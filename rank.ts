import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
  config: {
    name: 'rank',
    usage: '@<user>',
    description: 'See where you are in levels!',
    uses: ["mongo", "leveling"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addUserOption(option => option.setName("user").setDescription("User to query").setRequired(false)),
  runInteraction: async (bot, interaction) => {    
    var author = interaction.options.getUser("user") || interaction.user;

    let user = await getCollection("levels").findOne({'id': author.id, server: interaction.guild!.id}) as any;
    if(!user) user = {points: 0, level: 1};

    const rank = new EmbedBuilder()
    .setThumbnail(author.displayAvatarURL())
    .setColor('#000000')
    .setTitle(`${author.username}'s Level`)
    .setDescription(`Points: ${user.points}\n Levels: ${user.level}`)

    interaction.reply({embeds: [rank]});
    return CommandResult.Success;
  }
}