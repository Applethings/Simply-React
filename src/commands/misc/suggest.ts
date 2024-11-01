import { EmbedBuilder, TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
  config: {
    name: 'suggest',
    description: 'Suggest a feature to the developers of the bot',
    usage: '<suggestion>'
  },
  slashCommand: () => new SlashCommandBuilder().addStringOption(option => option.setName("feature").setDescription("What feature do you suggest?").setRequired(true)),
  runInteraction: async (bot, interaction) => {
    const feature = interaction.options.getString("feature", true);
    const channel = bot.channels.cache.find(x => x.id === "1035623629389570110") as TextChannel;
    const embed = new EmbedBuilder()
      .setAuthor({name: interaction.user.username + "#" + interaction.user.discriminator + " (" + interaction.user.id + ")"})
      .setColor('#333333')
      .setTitle("Feature Request")
      .setDescription(feature);
    await channel.send({embeds: [embed]});
    await interaction.reply({content: "Feature request sent", ephemeral: true});
    return CommandResult.Success;
  }
};