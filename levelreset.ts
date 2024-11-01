import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
  config: {
    name: 'levelreset',
    usage: '@<user>',
    description: 'Reset a level',
    uses: ["mongo", "leveling", "perm-levelreset"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addUserOption(option => option.setName("user").setDescription("User to query").setRequired(true)),
  runInteraction: async (bot, interaction) => {    
    var author = interaction.options.getUser("user", true);

    var user = await getCollection("levels").findOne({'id': author.id, server: interaction.guild!.id}) as any;
    await getCollection("levels").deleteOne({'id': author.id, server: interaction.guild!.id});

    const rank = new EmbedBuilder()
    .setThumbnail(author.displayAvatarURL())
    .setColor('#00ff00')
    .setTitle(`Level has been reset`)
    .setDescription(`User ${author} had ${user?.points ?? 0} points and ${user?.level ?? 0} level${user?.level === 1 ? "" : "s"} before resetting`)

    interaction.reply({embeds: [rank]});
    return CommandResult.Success;
  }
}