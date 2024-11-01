import { Command, CommandResult } from "../../types/Command";
import { ChannelType, PermissionFlagsBits, TextChannel } from 'discord.js';
import { ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder } from '@discordjs/builders';


module.exports = <Command>{
  config: {
    name: 'menu',
    usage: '<channel> <role> [min] [max] [...roles]',
    description: "Dropdown Menu",
    uses: ["mongo", "perm-menu"],
  },
  slashCommand: () => new SlashCommandBuilder()
  .addChannelOption(option => option.addChannelTypes(ChannelType.GuildText).setName("channel").setDescription("Channel to send the menu to").setRequired(true))
  .addRoleOption(option => option.setName("role1").setDescription("Role to give").setRequired(true))
  .addIntegerOption(option => option.setMinValue(0).setMaxValue(10).setName("min").setDescription("Minimum amount of roles allowed to pick").setRequired(false))
  .addIntegerOption(option => option.setMinValue(1).setMaxValue(10).setName("max").setDescription("Maximum amount of roles allowed to pick").setRequired(false))
  .addRoleOption(option => option.setName("role2").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role3").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role4").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role5").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role6").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role7").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role8").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role9").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role10").setDescription("Role to give").setRequired(false)),
  runInteraction: async(bot, interaction) => {
    const channel = (interaction.options.getChannel("channel", false) || interaction.channel) as TextChannel;
    const roles = [];
    for(let i = 1; i<=10; i++) {
      const r = interaction.options.getRole("role" + i, false);
      if(r) {
        roles.push(r);
      }
    }
    let min = interaction.options.getInteger("min", false) ?? 0;
    let max = interaction.options.getInteger("max", false) ?? roles.length;
    var errors = [];

    if(!channel.permissionsFor(bot.user!.id)!.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks)) {
      errors.push("I do not have permissions to send messages in that channel.");
    }

    for(var role of roles) {
      if(role.position > interaction.guild!.members.me!.roles.highest.position) {
        errors.push(`Role \`${role.name}\` is higher than my current highest role I have.`)
      }else if(role.position == interaction.guild!.members.me!.roles.highest.position) {
        errors.push(`Role \`${role.name}\` is the same one that is the highest role I have.`)
      }
    }
    if(roles.length < min) errors.push(`Minimum of ${min} roles, is impossible because you only provided ${roles.length} roles`);
    if(errors.length != 0) {
      interaction.reply({embeds: [{
        title: "Errors",
        description: errors.join("\n"),
        color: 0xff0000
      }]})
      return CommandResult.Parameters;
    }
    var options = [];
    for(var role of roles) {
      options.push({
        label: role.name,
        value: role.id
      });
    }

    if(options.length != 0) {
      try {
        await channel.send({content: "Select roles that you want.", components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
          .setCustomId('selectRole')
          .setMinValues(min)
          .setMaxValues(max)
          .setPlaceholder('Nothing selected')
          .addOptions(options)
        )]});
      } catch(e: any) {
        interaction.reply({embeds: [{
          title: "An error occurred while sending `menu` selection",
          description: e.message,
          color: 0xff0000
        }], ephemeral: true});
        console.error(e);
        return CommandResult.Parameters;
      }
      interaction.reply({content: `Created${new Date().getMonth() == 11 ? "\nAll vote commands are free to use this december!\nThis is a vote required command meaning you'll need to vote for it in the future." : ""}`, ephemeral: true});
      return CommandResult.Success;
    }
    return CommandResult.Parameters;
  }
}