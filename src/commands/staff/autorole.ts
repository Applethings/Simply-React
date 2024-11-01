import { ChatInputCommandInteraction, Client } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from "../../types/Command";
import { getCollection } from "../../mongo";

module.exports = <Command>{
  config: {
    name: 'autorole',
    description: "Gives roles automatically after members join",
    usage: '',
    uses: ["mongo", "perm-autorole"],
    dev: true
  },
  slashCommand: () => new SlashCommandBuilder()
    .addSubcommand(sub => sub.setName("add").setDescription("Adds a role on join")
      .addRoleOption(role => role.setName("role").setDescription("The role to give").setRequired(true)))
    .addSubcommand(sub => sub.setName("remove").setDescription("Removes adding a role on join")
      .addRoleOption(role => role.setName("role").setDescription("The role to no longer give").setRequired(true))),
  runInteraction: async (bot: Client, interaction: ChatInputCommandInteraction) => {
    let sub = interaction.options.getSubcommand(true);
    let role = interaction.options.getRole("role", true);

    if(!interaction.guild!.members.me!.permissions.has("Administrator") && !interaction.guild!.members.me!.permissions.has("ManageRoles")) {
      interaction.reply("I do not have permissions to manage roles, change that in the server settings and then retry the command.");
      return CommandResult.Permissions;
    }

    const autoroles = getCollection("autoroles");

    if(sub === "add") {
      const found = await autoroles.findOne({ roles: role.id, server: interaction.guildId });
      if(found != null) {
        interaction.reply({content: "This role is already automatically added on join!", ephemeral: true});
        return CommandResult.Parameters;
      }

      if(role.managed) {
        interaction.reply({content: `Role \`${role.name}\` is a managed role, which means I cannot give that role.`, ephemeral: true})
        return CommandResult.Parameters;
      }
      if(role.position > interaction.guild!.members.me!.roles.highest.position) {
        interaction.reply({content: `Role \`${role.name}\` is higher than my current highest role I have.`, ephemeral: true})
        return CommandResult.Parameters;
      }else if(role.position == interaction.guild!.members.me!.roles.highest.position) {
        interaction.reply({content: `Role \`${role.name}\` is the same one that is the highest role I have.`, ephemeral: true})
        return CommandResult.Parameters;
      }
      await autoroles.updateOne({ server: interaction.guildId }, { $push: { roles: role.id } }, { upsert: true });
      interaction.reply({content: `${role.toString()} will now be given to new members.`, ephemeral: true});
      return CommandResult.Success;
    }else if(sub === "remove") {
      const found = await autoroles.findOne({ roles: role.id, server: interaction.guildId });

      if(found == null) {
        interaction.reply({content: "This role is already not given automatically!", ephemeral: true});
        return CommandResult.Parameters;
      }

      await autoroles.updateOne({ server: interaction.guildId }, { $pull: { roles: role.id } });
      interaction.reply({content: `${role.toString()} will no longer be given to new members.`, ephemeral: true});
      return CommandResult.Success;
    }
    return CommandResult.Exception;
  }

};
