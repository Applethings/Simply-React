import { AutocompleteInteraction, Role } from "discord.js";
import { Bot } from "../types/Bot";
import { Command } from "../types/Command";
import { getCollection } from "../mongo";

function sorter(chars: any, accessor: any) {
  return (a: any, b: any) => {
    const achars = {...chars};
    let amatchedChars = 0;
    for(const got of accessor(a)) {
      if(achars[got]) {
        amatchedChars++;
        achars[got]--;
      }
    }
    
    const bchars = {...chars};
    let bmatchedChars = 0;
    for(const got of accessor(b)) {
      if(bchars[got]) {
        bmatchedChars++;
        bchars[got]--;
      }
    }
    

    return bmatchedChars - amatchedChars;
  };
}

module.exports = async (bot: Bot, interaction: AutocompleteInteraction) => {
  if(interaction.commandName === "settings" && interaction.options.getFocused(true).name === "command") {
    const value = interaction.options.getString("command", true).toLowerCase().trim();
    const chars: any = {};
    for(const v of value) {
      if(!chars[v]) chars[v] = 0;
      chars[v]++;
    }

    const cmds: Command[] = [];
    for(const [,cmd] of bot.commands) {
      if(cmd.config.dev) continue;
      if(cmd.config.disabled) continue;
      if(cmd.config.category === "admin") continue;
      if(cmd.config.name === "settings") continue;
      cmds.push(cmd);
    }
    cmds.sort(sorter(chars, (a: Command) => a.config.name));
    cmds.length = Math.min(cmds.length, 25);
    interaction.respond(cmds.map(x => {return {name: x.config.name, value: x.config.name}}));
  }else if(interaction.commandName === "getrole" && interaction.options.getFocused(true).name === "role") {
    const value = interaction.options.getString("role", true).toLowerCase().trim();
    const chars: any = {};
    for(const v of value) {
      if(!chars[v]) chars[v] = 0;
      chars[v]++;
    }

    const publicRolesMongo = getCollection("publicroles");
    const found = (await publicRolesMongo.findOne({ guildId: interaction.guildId }));

    if(found) {
      const roles = found.roles.map((x: string) => interaction.guild?.roles.cache.get(x));
      roles.sort(sorter(chars, (a: Role) => a.name));
      roles.length = Math.min(roles.length, 25);
      interaction.respond(roles.map((x: Role) => ({ name: x.name, value: x.id })));
    }
  }
}