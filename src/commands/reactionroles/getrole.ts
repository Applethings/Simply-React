import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';
import { EmbedBuilder } from 'discord.js';

module.exports = <Command>{
  config: {
    name: "getrole",
    description: "Takes a role from the publicly available roles",
    usage: "<add/remove/list> [role]",
    uses: ["mongo"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addSubcommand(sub => sub.setName("list").setDescription("Lists all roles"))
  .addSubcommand(sub => sub.setName("add").setDescription("Take a role").addStringOption(opt => opt.setAutocomplete(true).setName("role").setDescription("Which role to take").setRequired(true)))
  .addSubcommand(sub => sub.setName("remove").setDescription("Remove a role").addStringOption(opt => opt.setAutocomplete(true).setName("role").setDescription("Which role to take").setRequired(true))),
  runInteraction: async (bot, interaction) => {
    const publicRolesMongo = getCollection("publicroles");
    const found = (await publicRolesMongo.findOne({ guildId: interaction.guildId }));
    if(interaction.options.getSubcommand(true) === "list") {
        const roles = [];
        if(found) {
            roles.push(...found.roles);
        }
        if(roles.length === 0) {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("This server does not have any available roles")], ephemeral: true})
        }else {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0x2ea7ff).setTitle("Assignable Roles").setDescription("Currently available role" + (roles.length !== 1 ? "s" : "") + " on this server (" + roles.length + "):\n" + roles.map(x => "<@&" + x + ">").join(", "))]})
        }
        return CommandResult.Success;
    }
    const roleId = interaction.options.getString("role", true);
    if(!found || !found.roles.includes(roleId)) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("You do not have access to this role")], ephemeral: true})
        return CommandResult.Permissions;
    }
    const role = interaction.guild!.roles.cache.get(roleId);
    if(!role) {
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("This role does not exist")], ephemeral: true})
        return CommandResult.Parameters;
    }
    const add = interaction.options.getSubcommand(true) === "add";
    
    const member = interaction.member as any;
    const currentRoles = [...member._roles];

    if(add) {
        currentRoles.push(role);
        interaction.reply({content: `Added role <@&${roleId}> run \`/getrole remove <role>\` to remove it`, ephemeral: true});
    }else {
        const index = currentRoles.indexOf(roleId);
        currentRoles.splice(index, 1);
        interaction.reply({content: `Removed role <@&${roleId}> run \`/getrole add <role>\` to get it again`, ephemeral: true});
    }
    member.roles.set(currentRoles);

    return CommandResult.Success;
  }
}