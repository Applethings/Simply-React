import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ComponentType, EmbedBuilder, Message } from "discord.js";
import { addEvent } from "../functions";
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";

module.exports = async (bot: Bot, interaction: ButtonInteraction) => {
  if(interaction.customId.startsWith("button_role_")) {
    const roleId = interaction.customId.substring("button_role_".length);
    const role = interaction.guild!.roles.cache.find(r => r.id === roleId);
    const member = interaction.member as any;
    const currentRoles = [...member._roles];

    addEvent({
      type: "button",
      command: "role",
      role_update: currentRoles.includes(roleId) ? "remove" : "add"
    }, interaction.guildId!);

    if(currentRoles.includes(roleId)) {
        const index = currentRoles.indexOf(roleId);
        currentRoles.splice(index, 1);
        interaction.reply({content: `Removed role <@&${roleId}> click the button once again for the role`, ephemeral: true});
    }else {
        currentRoles.push(role);
        interaction.reply({content: `Added role <@&${roleId}> click the button once again to to remove the role`, ephemeral: true});
    }
    member.roles.set(currentRoles);
  }else if(interaction.customId.startsWith("delete_button_")) {
    const ids = interaction.customId.substring("delete_button_".length).split("_");
    const id = Number.parseInt(ids[0]);
    const remove = ids[1];
    
    const global = require("../global");
    const data = global.data.delete_button.find((e: any) => e.id === id);

    const message: Message = data.message;
    const actionRows: ActionRowBuilder<ButtonBuilder>[] = [new ActionRowBuilder<ButtonBuilder>()];
    let buttonRemoved = false;
    for(const old of message.components) {
      for(const v of old.components) {
        if(v.customId !== "button_role_" + remove) {
          if(actionRows[actionRows.length - 1].components.length === 5) {
            actionRows.push(new ActionRowBuilder<ButtonBuilder>());
          }
          if(v.type === ComponentType.Button) {
            actionRows[actionRows.length - 1].addComponents(new ButtonBuilder().setCustomId(v.customId!).setLabel(v.label!).setStyle(v.style));
          }
        }else {
          buttonRemoved = true;
        }
      }
    }
    if(actionRows[0].components.length === 0) {
      actionRows.pop();
    }
    if(buttonRemoved) {
      await message.edit({components: actionRows});
      await interaction.reply({content: "Button Removed", ephemeral: true});
    }else {
      await interaction.reply({content: "This button does not exist on the message!", ephemeral: true});
    }

    addEvent({
      type: "button",
      command: "delete",
      success: buttonRemoved
    }, interaction.guildId!);
  }else if(interaction.customId.startsWith("poll_option_")) {
    const option = interaction.customId.substring("poll_option_".length);
    const v = `votes.${interaction.user.id}`;
    const set: any = {};
    set[v] = Number.parseInt(option);
    const poll = (await getCollection("polls").findOneAndUpdate({message: interaction.message.id}, {"$set": set}, {returnDocument: "after"})).value;

    let desc = "";
    for(let i = 0; i<poll.options.length; i++) {
      let total = 0;
      for(const vote of Object.values(poll.votes)) {
        if(vote === i) {
          total++;
        }
      }
      desc += "**" + poll.options[i] + "**" + ": " + total + " vote" + (total === 1 ? "" : "s") + "\n";
    }
      
    interaction.message.edit({
      embeds: [ new EmbedBuilder().setTitle(poll.title).setDescription(desc) ]
    });
    interaction.reply({content: "Vote updated to **" + poll.options[Number.parseInt(option)] + "**", ephemeral: true});

    addEvent({
      type: "button",
      command: "poll"
    }, interaction.guildId!);
  }
}