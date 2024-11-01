import { ActivityType, Guild } from "discord.js";
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

module.exports = async (bot: Bot) => {
  console.log(`Currently in ${bot.guilds.cache.size} servers`);
  console.log('Simply react is online')
  let res = await getCollection("botsettings").findOne({_id: "status"});
  if(!res) res = {data: ""};

  bot.user!.setActivity({ name: res.data, type: ActivityType.Playing });

  
  const topGuilds = bot.guilds.cache.map(x => x);
  topGuilds.sort((a, b) => a.memberCount - b.memberCount);
  topGuilds.reverse();

  new Promise(async resolve => {
    let notoptedin = 0;
    let optedin = 0;
    let failed = 0;
    let completed = 0;
    let webhookTotal = 0;
    const serversettings = getCollection("serversettings");

    const everySettings = await (await serversettings.find()).toArray();
    for(const guild of topGuilds) {
      const settings = everySettings.find((s: Guild) => s.id === guild.id);
      if(settings && settings.webhookProtection) {
        optedin++;
        if(guild.members.me!.permissions.has("ManageWebhooks")) {
          await sleep(1);
          const webhooks = await guild.fetchWebhooks();
          webhookTotal += webhooks.size;
          console.log(webhooks);
          completed++;
        }else {
          failed++;
        }
      }else {
        notoptedin++;
      }
    }
    resolve({notoptedin, optedin, failed, completed, webhookTotal});
  }).then((i: any) => {
    const {notoptedin, optedin, failed, completed, webhookTotal} = i as { notoptedin: number; optedin: number; failed: number; completed: number; webhookTotal: number; };
    console.log(`Finished getting webhooks: Not opted-in: ${notoptedin}, Opted-in: ${optedin} (Failed: ${failed}, Completed: ${completed}, Total Webhooks: ${webhookTotal})`);
  });
}