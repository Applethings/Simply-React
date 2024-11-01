import { ChannelType, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command.js';

module.exports = <Command>{
  config: {
    name: 'reactionrole',
    usage: '',
    description: "Create a reaction role",
    uses: ["mongo", "perm-reactionrole"],
  },
  slashCommand: () => new SlashCommandBuilder()
    .addChannelOption(option => option.addChannelTypes(ChannelType.GuildText).setName("channel").setDescription("Channel to send the message in").setRequired(true))
    .addRoleOption(option => option.setName("role").setDescription("Role to give").setRequired(true))
    .addStringOption(option => option.setName("emoji").setDescription("Emoji to use").setRequired(true))
  ,
 runInteraction: async(bot, interaction) => {
  let channel = interaction.options.getChannel('channel', true) as TextChannel;
  let role = interaction.options.getRole('role', true)
  let emoji = interaction.options.getString('emoji', true);

  if(!interaction.guild!.members.me!.permissions.has("Administrator") && !interaction.guild!.members.me!.permissions.has("ManageRoles")) {
    interaction.reply("I do not have permissions to give roles, change that in the server settings and then retry the command.");
    return CommandResult.Permissions;
  }

  let embed = new EmbedBuilder();
  

  if(role.position > interaction.guild!.members.me!.roles.highest.position) {
    embed.setColor("#eb0936");
    embed.setDescription(`Role \`${role.name}\` is higher than my current highest role I have.\nTo fix this, put this bot's role above the role you're trying to give.`);
    interaction.reply({embeds: [embed], ephemeral: true})
    return CommandResult.Permissions;
  }else if(role.position == interaction.guild!.members.me!.roles.highest.position) {
    embed.setColor("#eb0936");
    embed.setDescription(`Role \`${role.name}\` is the same one that is the highest role I have.\nTo fix this, put this bot's role above the role you're trying to give.`);
    interaction.reply({embeds: [embed], ephemeral: true})
    return CommandResult.Permissions;
  }

  if(!channel.permissionsFor(bot.user!.id)!.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks)) {
    embed.setColor("#eb0936");
    embed.setDescription("I do not have permissions to send messages in that channel.");
    interaction.reply({embeds: [embed], ephemeral: true})
    return CommandResult.Permissions;
  }

  embed.setColor('#1df2af')
  .setDescription(`React with ${emoji} to get the ${role} role!`);

  const m = await channel.send({embeds: [embed]});
  try {
    await m.react(emoji)
  }catch(e) {
    interaction.reply({embeds: [new EmbedBuilder()
      .setColor('#fe1212')
      .setDescription(`An error occurred while reacting, make sure you're not using emojis from a different server.\n*This bot would have to be added there.*`)]});
    await m.delete();
    return CommandResult.Parameters;
  }

  getCollection("reactionroles").insertOne({guild: interaction.guild!.id, message: m.id, role: role.id, reaction: emoji});


  await interaction.reply({embeds: [new EmbedBuilder()
  .setColor('#1df2af')
  .setDescription(`Reaction role successfully created`)]});
 
  const msg = await interaction.followUp({embeds: [new EmbedBuilder()
    .setColor('#00ffff')
    .setDescription(`Making multiple Reactionroles? Consider using the /menu command!`)
  ]})

    setTimeout(() => msg.delete(), 7000);

  return CommandResult.Success;

 }
}
