const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick_player')
		.setDescription('Kick player of game!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};