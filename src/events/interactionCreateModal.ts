import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalMessageModalSubmitInteraction, TextChannel } from "discord.js";
import { addEvent } from "../functions";
import { Bot } from "../types/Bot";

module.exports = async (bot: Bot, interaction: ModalMessageModalSubmitInteraction) => {
  if(interaction.customId === 'embed_modal') {
    let color: any = null;
    let channel = null;
    let title = null;
    let description = null;
    for(const [, n] of interaction.fields.fields) {
        if(n.customId.startsWith("title_")) {
            color = n.customId.substring(6);
            title = n.value;
        }else if(n.customId.startsWith("description_")) {
            channel = bot.channels.cache.get(n.customId.substring(12));
            description = n.value;
        }
    }
    (channel! as TextChannel).send({embeds: [new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setFooter({text: `Embed created by ${interaction.user.username}`})]});
    interaction.reply({content: `Created (This message will auto-delete in 5s)${new Date().getMonth() == 11 ? "\nAll vote commands are free to use this december!\nThis is a vote required command meaning you'll need to vote for it in the future." : ""}`, fetchReply: true}).then(m => {
        setTimeout(() => {
            m.delete();
        }, 5000);
    });
    addEvent({
      type: "modal",
      command: "embed_create"
    }, interaction.guildId!);
  }
  if(interaction.customId === "embed_edit") {
    let color: any = null;
    let channel: any = null;
    let message: any = null;
    let title = null;
    let description = null;
    for(const [, n] of interaction.fields.fields) {
        if(n.customId.startsWith("title_")) {
            message = n.customId.substring(6);
            title = n.value;
        }else if(n.customId.startsWith("description_")) {
            channel = bot.channels.cache.get(n.customId.substring(12));
            description = n.value;
        }else if(n.customId === "color") {
            color = n.value;
            if(color.startsWith("#")) {
                color = color.substring(1);
            }
            color = Number.parseInt(color, 16);
            if(Number.isNaN(color)) {
                color = 0;
            }
        }
    }
    let md = await channel.messages.fetch(message);
    await md.edit({
        embeds: [new EmbedBuilder().setFooter({text: md.embeds[0].footer!.text}).setColor(color).setTitle(title).setDescription(description)]
    });
    await interaction.reply({ephemeral: true, content: "Modal updated"});
    addEvent({
      type: "modal",
      command: "embed_edit"
    }, interaction.guildId!);
  }
  if(interaction.customId.startsWith("button_modal_")) {
      const global = require("../global");
      const id = Number.parseInt(interaction.customId.substring("button_modal_".length));
      const data = global.data.button_modals.find((e: any) => e.id === id);
      const index = global.data.button_modals.indexOf(data);
      if (index > -1) {
          global.data.button_modals.splice(index, 1);
      }
      const actionRow = new ActionRowBuilder();
      for(let i = 0; i<data.roles.length; i++) {
          const input = interaction.fields.fields.find((e: any) => e.customId === `role_${i}`)!;
          const role = data.roles[i];
          actionRow.addComponents(
              new ButtonBuilder()
              .setCustomId(`button_role_${role.id}`)
              .setLabel(`${input.value}`)
              .setStyle(ButtonStyle.Primary)
          )
      }
      const message = interaction.fields.fields.find((e: any) => e.customId === "message")!.value || "Choose a role";
      await data.in.send({content: message, components: [actionRow]});
      interaction.reply({content: `Created (This message will auto-delete in 5s)${new Date().getMonth() == 11 ? "\nAll vote commands are free to use this december!\nThis is a vote required command meaning you'll need to vote for it in the future." : ""}`, fetchReply: true}).then(m => {
        setTimeout(() => {
            m.delete();
        }, 5000);
      });
      addEvent({
        type: "modal",
        command: "create_button"
      }, interaction.guildId!);
  }
  if(interaction.customId.startsWith("add_button_")) {
      const ids = interaction.customId.substring("add_button_".length);
      const channelId = ids.split("_")[0];
      const messageId = ids.split("_")[1];
      let name: string = null as any, roleId: any;
      for(const [,n] of interaction.fields.fields) {
          if(n.customId === "role") {
              roleId = n.value;
          }else if(n.customId.startsWith("name")) {
              name = n.value;
          }
      }
      let role = interaction.guild!.roles.cache.find(x => x.name.toLowerCase() === roleId.toLowerCase() || x.id === roleId);
      if(!role) {
        interaction.reply({content: "Role \"" + roleId + "\" not found!", allowedMentions: {repliedUser: false, roles: [], users: []}, ephemeral: true});
        addEvent({
          type: "modal",
          command: "add_button",
          status: "role_not_found"
        }, interaction.guildId!);
        return;
      }
      if(!name) name = role.name;
      const message = await (interaction.guild!.channels.cache.find(x => x.id === channelId) as TextChannel).messages.fetch(messageId);
      const body: any = {};
      if(message.content) body.content = message.content;
      if(message.embeds) body.embeds = message.embeds;
      if(message.components) body.components = message.components;
      if(!message.components || message.components.length === 0) body.components = [new ActionRowBuilder()];
      if(body.components[body.components.length - 1].components.length >= 5) {
          body.components.push(new ActionRowBuilder());
      }
      if(!body.components[body.components.length - 1].addComponents) {
          const old = body.components[body.components.length - 1];
          const n = body.components[body.components.length - 1] = new ActionRowBuilder();
          n.addComponents(old.components);
      }
      body.components[body.components.length - 1].addComponents(new ButtonBuilder().setCustomId("button_role_" + role.id).setLabel(name).setStyle(ButtonStyle.Primary));
      try {
          await message.edit(body);
      }catch(e) {
        interaction.reply("Failed to update the message, make sure you don't have duplicates roles.");
        addEvent({
          type: "modal",
          command: "add_button",
          status: "message_update_error"
        }, interaction.guildId!);
        return;
      }
      interaction.reply({ephemeral: true, content: "Added role <@&" + role.id + "> to the message", allowedMentions: {repliedUser: false, roles: [], users: []}});
      addEvent({
        type: "modal",
        command: "add_button"
      }, interaction.guildId!);
  }
}