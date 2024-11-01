import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
  config: {
    name: 'vote',
    usage: '',
    description: 'Supports the bot!'
  },
  slashCommand: () => new SlashCommandBuilder(),
  runInteraction: async (bot, interaction) => {
    const invitelink = new EmbedBuilder()
    
    .setColor('#00ffff')
    .setTitle('Vote For Simply React')
    .setDescription(`
    [Click Here to Vote](https://top.gg/bot/817127553914896404)`
    )
    .setFooter({text: 'Developers: Auskip and EpicPix'})
    interaction.reply({embeds: [invitelink]});
    return CommandResult.Success;
  }
}