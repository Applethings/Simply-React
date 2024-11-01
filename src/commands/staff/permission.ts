import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';

const choices = [
    {name: "Purge", value: "purge"},
    {name: "Menu", value: 'menu'},
    {name: "Role Button", value: 'button'},
    {name: "Embed", value: "embed"},
    {name: "Reaction Role", value: 'reactionrole'},
    {name: 'Slowmode', value: 'slowmode'},
    {name: "Level Reset", value: "levelreset"},
    {name: "Assignable Roles", value: "assignableroles"},
    // {name: "Auto Role", value: "autorole"},
]

module.exports = <Command>{
  config: {
    name: "permission",
    description: "Gives/Removes a role permission to run a certain command",
    usage: "<add/remove> <command> <role>",
    uses: ["mongo", "perm-permissionmod"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addSubcommand(sub => sub.setName("add").setDescription("Adds a permission")
    .addStringOption(option => option.setName("command").setDescription("Command for which the role will give permissions to use it")
        .addChoices(...choices)
        .setRequired(true))
    .addRoleOption(option => option.setName("role").setDescription("Role to give permissions to").setRequired(true)))
  .addSubcommand(sub => sub.setName("remove").setDescription("Removes a permission")
    .addStringOption(option => option.setName("command").setDescription("Command for which the role will remove permissions to use it")
        .addChoices(...choices)
        .setRequired(true))
    .addRoleOption(option => option.setName("role").setDescription("Role to revoke permissions from").setRequired(true))),
  runInteraction: async (bot, interaction) => {
    const result = getCollection("perms");

    const blacklist = interaction.options.getString("command", true);
    const role = interaction.options.getRole("role", true);

    const sub = interaction.options.getSubcommand(true);
    if(sub === "add") {
        let found = await result.find({_id: blacklist, roles: role.id }).toArray();
        if(!found.length) {
          await result.updateOne({ _id: blacklist }, { $push: { roles: role.id } }, { upsert: true })
          interaction.reply(`Gave role ${role.name} permission to use the command: ${blacklist}`);
        }else {
          interaction.reply({content: `Role <@&${role.id}> already has permission \`${blacklist}\``, ephemeral: true});
        }
    }else {
        let changed = await result.updateOne({ _id: blacklist }, { $pull: { roles: role.id } }, { upsert: true })
        if(changed.modifiedCount) {
          interaction.reply(`Removed \`${blacklist}\` permission from role ${role.name}`);
        }else {
          interaction.reply({content: `Role <@&${role.id}> does not have permission \`${blacklist}\``, ephemeral: true});
        }
    }
    return CommandResult.Success;
  }
}