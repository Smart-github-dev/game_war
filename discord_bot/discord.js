const { Client, GatewayIntentBits, REST, Routes, Collection, Events } = require('discord.js');
const cron = require('node-cron');
const path = require('node:path');
const fs = require('node:fs');

const DiscordUser = require('../model/discord_users.model');
const playerModel = require('../model/player.model');
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const RAKING_CHANNEL_ID = process.env.RAKING_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const BOT_CHANNEL_ID = process.env.BOT_CHANNEL_ID;
const BOT_CLIENT_ID = process.env.BOT_CLIENT_ID;
const DISCORD_GAME_SERVER_ID = process.env.DISCORD_GAME_SERVER_ID;

module.exports = (onmessage, callback) => {
    let events = {
        get_user_list: null,
        send_ranking_function: null
    };

    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages
        ]
    });
    client.commands = new Collection();

    client.once(Events.ClientReady, () => {
        console.log('Bot is ready');
        let channel = client.channels.cache.get(BOT_CHANNEL_ID);
        if (channel) {
            // channel.send('Hello, I am now ready and connected to the game server!');
        } else {
            console.log('Channel not found');
        }

        events['get_user_list'] = async function () {
            const guild = client.guilds.cache.get(DISCORD_GAME_SERVER_ID);
            if (guild) {
                guild.members.fetch().then(async members => {
                    const alreadys = await DiscordUser.find({ userId: { $in: members.filter(member => !member.user.bot).map(member => member.user.id) } });
                    const newMembers = members.filter(({ user }) => !user.bot && alreadys.findIndex(u => user.id == u.userId) == -1)
                        .map(({ user }) => {
                            return {
                                username: user.username.toLocaleLowerCase(),
                                tag: user.tag,
                                userId: user.id.toLocaleLowerCase(),
                            };
                        });
                    const result = await DiscordUser.create(newMembers);
                    if (result.length > 0) {
                        console.log("new members", newMembers)
                    } else {
                        console.log("already all registryed")
                    }
                }).catch(console.error);
            } else {
                console.log('Guild not found');
            }
        };

        events['get_user_id'] = async function (targetUsername) {
            const targetUser = await DiscordUser.findOne({ $or: [{ username: targetUsername.toLocaleLowerCase(), tag: targetUsername.toLocaleLowerCase() }] });
            if (targetUser) {
                return targetUser.userId;
            } else {
                return false;
            }
        }

        events['send_message'] = function (id, msg) {
            const targetUser = client.users.cache.get(id);
            if (targetUser) {
                if (msg) {
                    targetUser.send('Hello! This is a direct message from the bot.');
                } else {
                    targetUser.send(msg);
                }
            } else {
                console.log('User not found.');
            }
        }

        events['send_ranking_function'] = async function () {
            const rankingChannel = client.channels.cache.get(RAKING_CHANNEL_ID);
            if (rankingChannel) {
                try {
                    const players = await playerModel.find({}, 'name score status discordId');
                    const sortedRankings = players.sort((a, b) => b.score - a.score);
                    const rankingMessage = sortedRankings.map((player, i) => {
                        const user = player.discordId != "false" ? client.users.cache.get(player.discordId) : { username: player.name };
                        return `${i}------> name : ${user.username} , score ${player.score}`;
                    }).join('\n');
                    rankingChannel.send('**Rankings**:\n' + rankingMessage);
                } catch (err) {
                    console.log(err)
                }
            }
        }

        cron.schedule('0 9 * * *', () => {
            events.send_ranking_function();
        });
        events.get_user_list();

        callback(events);

    });

    client.on(Events.MessageCreate, message => {
        const channelId = message.channelId;
        const channel = client.channels.cache.get(channelId);
        const user = message.author.displayName;
        if(message.content.toLowerCase()=="!hello"){
            channel.send(`thank you! @${user} :${inputTag}`);
        }
        if(onmessage[message.content.toLowerCase()]){
            onmessage[message.content] && onmessage[message.content](message, client, user);
            console.log("get new message" + message.content + " : from " + user);
            channel.send(`thank you! @${user}`);
        }
    });

    client.on(Events.GuildMemberAdd, async member => {
        try {
            if (member.user.bot) {
                console.log(`${member.user.username} is a bot`);
                return;
            }
            const channel = client.channels.cache.get(WELCOME_CHANNEL_ID);
            if (!channel) return;

            const username = member.user.username.toLocaleLowerCase(); // Get the username of the new member
            const userId = member.user.id.toLocaleLowerCase(); // Get the user ID of the new member

            const _user = await DiscordUser.findOne({ userId: userId });
            if (_user) {
                console.log("already registryed");
                return;
            }
            const user = new DiscordUser({
                username,
                userId,
                tag: member.user.tag
            })
            await user.save();
            const avatarUrl = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 128 });

            channel.send(
                {
                    files: [avatarUrl],
                    content: `I'm @Game_Sever bot, Welcome to the server, ${member}!\n You are registryed Our Game server.\n When you are signin to our game server, kindly use your discord name`,
                });
        } catch (error) {
            console.log("New member registry error")
        }
    });

    client.on(Events.GuildMemberRemove, async member => {
        const userId = member.user.id;
        const _user = await DiscordUser.find({ userId: userId });
        if (_user) {
            const result = await DiscordUser.deleteOne({ userId: userId });
            if (result) {
                console.log('new member out');
            }
            return;
        }
    });


    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });


    const commands = [];
    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const command = require(commandsPath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(DISCORD_BOT_TOKEN);

    // and deploy your commands!
    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(
                Routes.applicationGuildCommands(BOT_CLIENT_ID, DISCORD_GAME_SERVER_ID),
                { body: commands },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();


    if (DISCORD_BOT_TOKEN) {
        client.login(DISCORD_BOT_TOKEN);
    } else {
        console.log("descord bot need auth token!");
        return;
    }

}

