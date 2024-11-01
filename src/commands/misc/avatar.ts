import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

 module.exports = <Command>{
  config: {
    name: 'avatar',
    description: 'Show your Profile Picture or someone elses in a bigger format',
    usage: '[@user]'
  },
  slashCommand: () => new SlashCommandBuilder().addUserOption(option => option.setName("user").setDescription("User to get profile picture of").setRequired(false)),
  runInteraction: async (bot, interaction) => {
    let user = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
    .setAuthor({name: "Profile Picture", iconURL: bot.user!.displayAvatarURL()})
      .setColor("#00ffff")
      .setTitle(`${user.username}'s Profile Picture`)
      .setImage(user.displayAvatarURL({ size: 2048 }))
    interaction.reply({embeds: [embed]});
    return CommandResult.Success;
  }

}