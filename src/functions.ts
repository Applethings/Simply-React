import { ChatInputCommandInteraction, GuildMemberRoleManager, Interaction, Message, PermissionFlagsBits, PermissionsBitField, Role } from "discord.js";
import { getCollection } from "./mongo";
import { Bot } from "./types/Bot";


export async function permCheck(message: Message | ChatInputCommandInteraction | Interaction, _default: boolean, command: string) {
  const result = getCollection("perms");

  let array = await result.findOne({ _id: command })
  if(!array || !_default) {
    if((message.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator)) {
      return true;
    } 
  }

  if(array) {
    array.roles.forEach((x: any) => {
      if((message.member!.roles as GuildMemberRoleManager).cache.some((r: Role) => r.id === x)) {
        return true;
      }
    })
  }

  return _default;
}

export async function addEvent(eventData: any, guildId?: string) {
  const bot: Bot = require("./index").bot;
  if(bot.debug) {
    return;
  }
  
  let collectScience = true;
  if(guildId) {
    let settings = await getCollection("serversettings").findOne({ 'id': guildId }) as any
    if(settings && settings.science === false) {
      collectScience = false;
    }
  }
  if(collectScience) {
    let updateQuery: any = {$push: {events: {}}};
    const eventInfo = {
      at: Date.now(),
      ...eventData
    };
    updateQuery["$push"][`events`] = eventInfo;
    getCollection("science").updateOne({}, updateQuery, {upsert: true});
    getFile("./server/eventlog").event(eventInfo);
  }
}

function getFile(file: string) {
    delete require.cache[require.resolve(file)];
    return require(file);
}