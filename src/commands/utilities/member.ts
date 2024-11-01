import { Command, CommandResult } from "../../types/Command";
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from "discord.js";

module.exports = <Command>{
  config: {
    name: 'member',
    description: 'Show info about a member on a server'
  },
  slashCommand: () => new SlashCommandBuilder().addUserOption(option => option.setName("member").setDescription("Member which to query").setRequired(true)),
  runInteraction: async(bot, interaction) => {
    const user = interaction.options.getUser("member", true);
    const member = await interaction.guild!.members.fetch(user);
    const embed = new EmbedBuilder();
    embed.setTitle("Info about " + (member.nickname ?? user.username));
    if(interaction.guild?.ownerId === user.id) {
        embed.setDescription("This user is the owner of this server.");
    }
    embed.addFields({
        name: "Server Username",
        value: member.nickname ?? user.username,
        inline: true
    },
    {
        name: "User ID",
        value: user.id,
        inline: true
    },
    {
        name: "Pending",
        value: member.pending ? "Yes" : "No",
        inline: true
    },
    {
        name: "Joined At",
        value: "<t:" + Math.floor(member.joinedTimestamp!/1000) + ":f>",
        inline: false
    },
    {
        name: "Roles",
        value: member.roles.cache.filter(x => x.id !== interaction.guildId).sort((a, b) => b.position - a.position).map(x => "<@&" + x.id + ">").join(", "),
        inline: false
    });
    embed.setFooter({text: "Get the avatar using /avatar"})
    interaction.reply({embeds: [embed]});
    return CommandResult.Success;
  }
}