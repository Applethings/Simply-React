import { Bot } from "./types/Bot";

let debug = process.argv.includes("--dev");

const data: any = {}

const time = function() {
    const a = Math.floor(data.bot.uptime / 1000);
    const s = (a % 60).toString();
    const m = (Math.floor(a / 60) % 60).toString();
    const h = Math.floor(a / 60 / 60).toString();
    return `[${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}]`;
}

module.exports = data;

console.debug = (i) => process.stdout.write(i.toString().substring(0, i.length).split("\n").map((a: string) => "[DEBUG] " + time() + " " + a).join("\n") + "\n")
console.warn = (i) => process.stdout.write(i.toString().substring(0, i.length).split("\n").map((a: string) => "[WARNING] " + time() + " " + a).join("\n") + "\n")

import { startServer } from "./server/server";
if(!debug) {
  startServer();
}

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';
import { Command } from "./types/Command";
const uri = process.env.MONGO;
const mongo = new MongoClient(uri!);
mongo.connect().then(_ => {
  console.log("Connected to Database");
});

import eventSetup from './handlers/event'

function deleteCommandByPath(bot: Bot, path: string) {
  try {
    delete require.cache[require.resolve(path)];
    for(const [, command] of bot.commands) {
      if(command.config.category === path.split("/")[2]) {
        if(command.config.name === path.split("/")[3]) {
          bot.commands.delete(command.config.name);
          return command.config.name;
        }
      }
    }
  } catch(e) {
    console.error(e);
  }
}

function refreshCommandByPath(bot: Bot, path: string) {
  try {
    delete require.cache[require.resolve(path)];
    const cmdd: Command = require(path);
    if(cmdd && cmdd.config && cmdd.config.name) {
      if(cmdd.config.name === path.split("/")[3].substring(0, path.split("/")[3].length - 3)) {
        cmdd.config.category = path.split('/')[2];
        bot.commands.set(cmdd.config.name, cmdd);
        return cmdd.config.name;
      }
    }
  } catch(e) {
    console.error(e);
  }
}

import chokidar from "chokidar";
import { Client, Collection, GatewayIntentBits as Intents, Partials } from 'discord.js';

async function botStart(token: string, debug: boolean) {
  console.log('Starting... [debug=' + debug + "]")
  const intents = [Intents.GuildMessages, Intents.GuildMessageReactions, Intents.DirectMessages, Intents.Guilds, Intents.GuildWebhooks];
  if(debug) {
    intents.push(Intents.GuildMembers);
    intents.push(Intents.MessageContent);
  }
  const bot = new Client({ intents, partials: [Partials.Message, Partials.Channel, Partials.Channel, Partials.Reaction] }) as Bot;
  process.openStdin().addListener("data", function(d) {
    console.log(eval(d.toString().trim()));
  });
  data.bot = bot;

  bot.mongo = mongo;

  bot.commands = new Collection();
  bot.debug = debug;

  eventSetup(bot);

  if(debug) bot.on("debug", console.log);

  const commandWatcher = chokidar.watch('.', {
    awaitWriteFinish: true,
    cwd: "./commands/"
  });
  commandWatcher
  .on("add", (path: string) => {
    const res = refreshCommandByPath(bot, "./commands/" + path);
    if(res) console.debug(`Loaded command [${path.substring(0, path.length - 3)}] ${res}`);
  })
  .on("change", (path: string) => {
    const res = refreshCommandByPath(bot, "./commands/" + path);
    if(res) console.debug(`Refreshed command [${path.substring(0, path.length - 3)}] ${res}`);
  })
  .on("unlink", path => {
    const res = deleteCommandByPath(bot, "./commands/" + path);
    if(res) console.debug(`Unloaded command [${path.substring(0, path.length - 3)}] ${res}`);
  });


  const eventWatcher = chokidar.watch('.', {
    awaitWriteFinish: true,
    cwd: "./events/"
  });
  eventWatcher
  .on("add", path => {
    const res = bot.ehandler.reload(path.substring(0, path.length - 3));
    if(res) console.debug(`Loaded event [${path.substring(0, path.length - 3)}] ${res}`);
  })
  .on("change", path => {
    const res = bot.ehandler.reload(path.substring(0, path.length - 3));
    if(res) console.debug(`Reloaded event [${path.substring(0, path.length - 3)}] ${res}`);
  })
  .on("unlink", path => {
    const res = bot.ehandler.unload(path.substring(0, path.length - 3));
    if(res) console.debug(`Removed event [${path.substring(0, path.length - 3)}] ${res}`);
  });


  await bot.login(token);
}
process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled Promise", reason);
})
process.on('uncaughtException', (error, origin) => {
  console.error("Unhandled", error);
})
botStart(!debug?process.env.TOKEN!:process.env.DEV_TOKEN!, debug);
