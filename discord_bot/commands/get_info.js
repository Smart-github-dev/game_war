const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get_info')
		.setDescription('Fetch game infomation of your self!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};