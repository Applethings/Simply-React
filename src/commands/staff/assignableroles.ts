import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';
import { ChannelType, EmbedBuilder } from 'discord.js';

module.exports = <Command>{
  config: {
    name: 'assignableroles',
    description: 'Get or set the assignable roles available for anyone',
    usage: '',
    uses: ["mongo", "perm-assignableroles"]
  },
  slashCommand: (bot) => new SlashCommandBuilder()
  .addSubcommand(sub => sub.setName("get").setDescription("Gets the current public roles"))
  .addSubcommand(sub => sub.setName("add").setDescription("Adds a role to the public roles").addRoleOption(i => i.setRequired(true).setName("role").setDescription("Role to add")))
  .addSubcommand(sub => sub.setName("remove").setDescription("Removes a role from the public roles").addRoleOption(i => i.setRequired(true).setName("role").setDescription("Role to remove")))
  .addSubcommand(sub => sub.setName("reset").setDescription("Removes all roles from public roles"))
  ,
  runInteraction: async (bot, interaction) => {
    const publicRolesMongo = getCollection("publicroles");
    let highest = interaction.guild!.members.me!.roles.highest;

    const type = interaction.options.getSubcommand(true);
    if(type === "get") {
        const found = (await publicRolesMongo.findOne({ guildId: interaction.guildId }));
        const roles = [];
        if(found) {
            roles.push(...found.roles);
        }
        if(roles.length === 0) {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("This server does not have any available roles")], ephemeral: true})
        }else {
            interaction.reply({embeds: [new EmbedBuilder().setColor(0x2ea7ff).setTitle("Assignable Roles").setDescription("Currently available role" + (roles.length !== 1 ? "s" : "") + " on this server (" + roles.length + "):\n" + roles.map(x => "<@&" + x + ">").join(", "))], ephemeral: true})
        }
    }else if(type === "reset") {
        await publicRolesMongo.updateOne({ guildId: interaction.guildId }, { $set: { roles: [] } }, { upsert: true });
        interaction.reply({embeds: [new EmbedBuilder().setColor(0x2ea7ff).setTitle("Assignable Roles").setDescription("All roles have been removed from assignable roles, use `/assignableroles add <role>` to add roles for anyone to access")], ephemeral: true})
    }else if(type === "add") {
        const found = (await publicRolesMongo.findOne({ guildId: interaction.guildId }));
        const role = interaction.options.getRole("role", true);
        if(role.position > highest.position) {
            interaction.reply({content: `Role <@&${role.id}> is higher than my current highest role I have, I can only give roles below <@&${highest.id}>.`, ephemeral: true})
            return CommandResult.Permissions;
        }else if(role.position == highest.position) {
            interaction.reply({content: `Role <@&${role.name}> is the same one that is the highest role I have, I can only give roles below <@&${highest.id}>.`, ephemeral: true})
            return CommandResult.Permissions;
        }
        if(found) {
            if(found.roles.includes(role.id)) {
                interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("This role is already available for anyone, you can check all of the roles using `/assignableroles get`")], ephemeral: true})
                return CommandResult.Parameters;
            }
        }
        await publicRolesMongo.updateOne({ guildId: interaction.guildId }, { $push: { roles: role.id } }, { upsert: true });
        interaction.reply({embeds: [new EmbedBuilder().setColor(0x2ea7ff).setTitle("Assignable Roles").setDescription("Added <@&" + role.id + "> to assignable roles, use `/assignableroles get` to check all roles which members of this server can get.")], ephemeral: true})
    }else if(type === "remove") {
        const found = (await publicRolesMongo.findOne({ guildId: interaction.guildId }));
        const role = interaction.options.getRole("role", true);
        if(found) {
            if(found.roles.includes(role.id)) {
                await publicRolesMongo.updateOne({ guildId: interaction.guildId }, { $pull: { roles: role.id } }, { upsert: true });
                interaction.reply({embeds: [new EmbedBuilder().setColor(0x2ea7ff).setTitle("Assignable Roles").setDescription("Removed <@&" + role.id + "> from assignable roles, use `/assignableroles get` to check all roles which members of this server can get.")], ephemeral: true})
                return CommandResult.Success;
            }
        }
        interaction.reply({embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("Assignable Roles").setDescription("This role already wasn't available for anyone, you can check all of the roles using `/assignableroles get`")], ephemeral: true})
        return CommandResult.Parameters;
    }
    return CommandResult.Success;
  }
}