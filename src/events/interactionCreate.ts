import { Interaction } from "discord.js";
import { Bot } from "../types/Bot";

module.exports = async (bot: Bot, interaction: Interaction) => {
  if(!interaction.guild) return;
  if(!interaction.member) return;

  if(interaction.isModalSubmit()) {
    bot.emit("interactionCreateModal", interaction);
    return;
  }
  if(interaction.isChatInputCommand()) {
    bot.emit("interactionCreateChat", interaction);
    return;
  }
  if(interaction.isSelectMenu()) {
    bot.emit("interactionCreateMenu", interaction);
    return;
  }
  if(interaction.isButton()) {
    bot.emit("interactionCreateButton", interaction);
    return;
  }
  if(interaction.isMessageContextMenuCommand()) {
    bot.emit("interactionCreateContextMessage", interaction);
    return;
  }
  if(interaction.isAutocomplete()) {
    bot.emit("interactionCreateAutocomplete", interaction);
    return;
  }
};
