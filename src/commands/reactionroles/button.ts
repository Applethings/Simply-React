import { Command, CommandResult } from "../../types/Command";

import { SlashCommandBuilder } from '@discordjs/builders';
import { data as global } from "../../global";
import { REST } from '@discordjs/rest';
import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { WebhookChannel } from "../../types/WebhookChannelData";

module.exports = <Command>{
  config: {
    name: 'button',
    usage: '<channel> <role> [...roles]',
    description: "Make buttons that gives/takes roles after clicking",
    uses: ["mongo", "perm-button", "firstuse"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addChannelOption(option => option.addChannelTypes(0).setName("channel").setDescription("Channel to send the button in").setRequired(true))
  .addRoleOption(option => option.setName("role1").setDescription("Role to give").setRequired(true))
  .addRoleOption(option => option.setName("role2").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role3").setDescription("Role to give").setRequired(false))
  .addRoleOption(option => option.setName("role4").setDescription("Role to give").setRequired(false)),
  runInteraction: async(bot, interaction) => {
    const channel = (interaction.options.getChannel("channel", false) || interaction.channel!) as WebhookChannel;
    const roles = [];
    for(let i = 1; i<=4; i++) {
      const r = interaction.options.getRole("role" + i, false);
      if(r) {
        roles.push(r);
      }
    }
    var errors = [];

    if(!channel.permissionsFor(bot.user!.id)!.has(["ViewChannel", "SendMessages", "EmbedLinks"])) {
      errors.push("I do not have permissions to send messages in that channel.");
    }
    
    let highest = interaction.guild!.members.me!.roles.highest;
    for(var role of roles) {
      if(role.position > highest.position) {
        errors.push(`Role <@&${role.id}> is higher than my current highest role I have, I can only give roles below <@&${highest.id}>.`)
      }else if(role.position == highest.position) {
        errors.push(`Role <@&${role.name}> is the same one that is the highest role I have, I can only give roles below <@&${highest.id}>.`)
      }
    }
    if(errors.length != 0) {
      interaction.reply({embeds: [{
        title: "Errors",
        description: errors.join("\n"),
        color: 0xff0000
      }], ephemeral: true})
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
        const d = global as any;
        d.button_modals ??= [];
        d.button_modal_id ||= 0;
        
        const id = d.button_modal_id++;

        const data = {
          id: id,
          in: channel,
          roles: roles,
          at: Date.now()
        };
        d.button_modals.push(data);

        const components = [{
          type: 1,
          components: [{
            type: 4,
            custom_id: "message",
            style: 2,
            label: "Message",
            required: false
          }]
        }];

        for(let i = 0; i<roles.length; i++) {
          components.push(
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: `role_${i}`,
                  style: 1,
                  label: `Button name for ${roles[i].name}`,
                  required: true
                }
              ]
            });
        }

        const rest = new REST({ version: '9' }).setToken(bot.token!);
        await rest.post(`/interactions/${interaction.id}/${interaction.token}/callback`, {
          body: {
            type: 9,
            data: {
              custom_id: `button_modal_${id}`,
              title: "Button Creator",
              components: components
            }
          }
        })
      } catch(e: any) {
        await interaction.reply({embeds: [{
          title: "An error occurred while sending `button` modal",
          description: e.message,
          color: 0xff0000
        }], ephemeral: true});
        return CommandResult.Exception;
      }
      if(interaction.firstUse) {
        interaction.replied = true;
        await interaction.followUp({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can add buttons to messages sent by <@${bot.user!.id}>\nRight click the message, click Apps, and then click Add Button\nYou can use that to add buttons to an embed made with /embed`)]});
      }
      return CommandResult.Success;
    }
    return CommandResult.Parameters;
  }
}