import { Command, CommandResult } from "../../types/Command";
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = <Command>{
  config: {
    name: 'tos',
    usage: '',
    description: "Show the bot's ToS"
  },
  slashCommand: () => new SlashCommandBuilder(),
  runInteraction: async (bot, interaction) => {
    const invitelink = new EmbedBuilder()
    
    .setColor('Random')
    .setTitle('ToS')
    .setDescription(`
    [Terms of Service](https://simplyreact.ga/tos)
    `)
    interaction.reply({embeds: [invitelink], ephemeral: true});
    return CommandResult.Success;
  }
}
