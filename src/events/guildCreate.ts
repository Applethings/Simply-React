import { ActivityType, Guild } from "discord.js";
import { IncomingMessage, RequestOptions } from "http";
import https from "https";
import fs from 'fs';
import { Bot } from "../types/Bot";
import { addEvent } from "../functions";
import { getCollection } from '../mongo';

var servers = fs.createWriteStream('./servers.log', {flags: "a"});

function time(bot: Bot): string {
    const a = Math.floor((Date.now() - bot.uptime!) / 1000);
    const s = (a % 60).toString();
    const m = (Math.floor(a / 60) % 60).toString();
    const h = Math.floor(a / 60 / 60).toString();
    return `[${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}]`;
  };

async function sendRequest(method: string, host: string, path: string, port: number, headers: any, data: any): Promise<string> {
  const options: RequestOptions = {
    hostname: host,
    port: port,
    path: path,
    method: method,
    headers: headers
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res: IncomingMessage) => {
      var data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      })
      res.on('end', () => {
        resolve(data);
      })
    })
    if(data) {
      req.write(data);
    }
    req.end();
  });
}

module.exports = async (bot: Bot, guild: Guild) => {
  if(!bot.debug) {
    servers.write(`${time(bot)} in ${bot.guilds.cache.size} guilds\n`);
    await sendRequest("POST", "discord.com", "/api/v9/webhooks/968802228154548244/agqBCN2Gaw3yurkgyGWgnFSsCo4dTr4z1kfL0RiMn5ZUZWdV6Ro2PNIf3M3d0BlWT7EZ", 443, {"Content-Type": "application/json"}, JSON.stringify(
      {
          content: `I've been added to a guild, now I am in ${bot.guilds.cache.size} guilds!`
      }
    ));
    addEvent({
      type: "servers",
      command: "join",
      now: bot.guilds.cache.size
    }, guild.id);

    const newStatus = `/help in ${bot.guilds.cache.size} guilds`;
    bot.user!.setActivity({ name: newStatus, type: ActivityType.Playing });
    getCollection("botsettings").updateOne({_id: "status"}, {"$set": {data: newStatus}}, {upsert: true});
    require("../server/server").shouldRefreshServerStats = true;
  }
}