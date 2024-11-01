import { SelectMenuComponent, SelectMenuInteraction } from "discord.js";
import { addEvent } from "../functions";
import { Bot } from "../types/Bot";

module.exports = async (bot: Bot, interaction: SelectMenuInteraction) => {
  if(interaction.customId === 'selectRole') {
    var selected = [];
    var nonselected: string[] = [];
    for(const option of (interaction.message.components[0].components[0] as SelectMenuComponent).options) {
      if(interaction.values.includes(option.value)) {
        selected.push(option.value);
      }else {
        nonselected.push(option.value);
      }
    }
    const member = interaction.member as any;
    selected = selected.filter((x) => !member._roles.includes(x));
    nonselected = nonselected.filter((x) => member._roles.includes(x));
    var newRoles = [...member._roles as any];
    newRoles.push(...selected);
    newRoles = newRoles.filter((x) => !nonselected.includes(x))
    member.roles.set(newRoles);
    interaction.reply({content: "Added: " + selected.map(x => "<@&" + x + ">").join(" ") + "\nRemoved: " + nonselected.map(x => "<@&" + x + ">").join(" "), ephemeral: true});

    addEvent({
      type: "select_menu",
      command: "menu"
    }, interaction.guildId!);
  }
}