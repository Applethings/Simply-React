import { Command, CommandResult } from "../../types/Command";
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = <Command>{
  config: {
    name: 'privacy',
    usage: '',
    description: "Show the bot's Privacy Policy"
  },
  slashCommand: () => new SlashCommandBuilder(),
  runInteraction: async (bot, interaction) => {
    const invitelink = new EmbedBuilder()
    
    .setColor('Random')
    .setTitle('Privacy Policy')
    .setDescription(`
    [Privacy Policy](https://simplyreact.ga/privacy)
    `)
    interaction.reply({embeds: [invitelink], ephemeral: true});
    return CommandResult.Success;
  }
}
