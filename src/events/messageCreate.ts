import { ChannelType, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";
import { WebhookChannel } from "../types/WebhookChannelData";
import { addEvent } from "../functions";

module.exports = async (bot: Bot, message: Message) => {
  if(!message.guild) return;
  if(message.channel.type === ChannelType.DM) return;
  let channel = message.channel as WebhookChannel;
  let channelPerms = channel.permissionsFor(bot.user!.id);
  if(channelPerms != null && !channelPerms.has(["SendMessages", "EmbedLinks", "ViewChannel"])) return;
  if(message.content == `<@!${bot.user!.id}>` || message.content == `<@${bot.user!.id}>`) {
    channel.send(`This bot now only functions with slash commands, use /help for help.`);
    return;
  }

  if(message.author.bot) return;

  let result = getCollection("serversettings");
  let settings = await result.findOne({ id: message.channel.guild.id }) || {};

  if(settings.leveling !== false) {
    result = getCollection("levels");
  
  
    await result.updateOne({ id: `${message.author.id}`, server: message.channel.guild.id }, { $inc: { points: 1 } }, { upsert: true });

    let info = await result.findOne({ id: message.author.id, server: message.channel.guild.id })

    if(!info || !info.level) {
      await result.updateOne({ id: `${message.author.id}`, server: message.channel.guild.id }, { $set: { level: 1 } }, { upsert: true });

      info = await result.findOne({ id: message.author.id, server: message.channel.guild.id })
    }

    let level = info.level;
    let points = info.points;
    let nextlvl = Math.floor(((level+1)**1.5)*8);

    if(points >= nextlvl) {
      
      let desc;
      const embed = new EmbedBuilder()
      .setColor("#00ffff")
      .setTitle(`Level UP`)
      .setDescription(desc=`**${message.author} has levelled up to level ${level + 1}!**`)
      .setFooter({ text: `"/settings leveling set" to disable leveling.` });
      await result.updateOne({ id: `${message.author.id}`, server: message.channel.guild.id }, { $inc: { level: 1 }, $set: { points: points-nextlvl }}, { upsert: true });


      let role = await result.findOne({ id: `roles.${level + 1}`, server: message.channel.guild.id})
      if(role) {
        let roles = message.guild.roles.cache.find(r => r.id === role.rol)
        if(roles) {
          message.member!.roles.add(roles.id)
          embed.setDescription(desc=`**${message.author} has levelled up to level ${level + 1}, and has gotten the role ${roles}!**`)
        }
      }

      const levelingChannel = message.guild.channels.cache.find(x => x.id === settings.levelup_channel) as TextChannel | undefined;

      addEvent({
        type: "level_up",
        command: "level_up",
        has_set_channel: levelingChannel ? true : false
      }, message.guildId!);

      if(levelingChannel) {
        try {
          await levelingChannel.send({embeds: [embed]});
          return;
        }catch(e) {
          addEvent({
            type: "level_up",
            command: "leveling_channel_send_failed"
          }, message.guildId!);
          embed.setDescription(desc + "\n\nI could not send this message in <#" + settings.levelup_channel + ">");
        }
      }
      message.channel.send({embeds: [embed]}).then(msg => {
        setTimeout(function(){
          msg.delete().catch(e => {
            console.debug("Failed to delete level-up message:"); console.debug(e);
            addEvent({
              type: "level_up",
              command: "delete_message_error"
            }, message.guildId!);
          })
        }, 10000)
      })
    }
  }

  if(message.content.split(" ")[0].toLowerCase() === ">rsc") {
    if(['332990813195993092', '665376355155968000'].includes(message.author.id)) {
    
      async function refreshSlashCommands(global: boolean, old: boolean): Promise<boolean> {
        return await require("../slashCommands").setup(bot, !global, old);
      }

      let adminCommands = await refreshSlashCommands(false, true);
      let normalCommands = await refreshSlashCommands(true, false);

      message.reply("Admin Commands: " + adminCommands + "\nNormal Commands: " + normalCommands);
      if(!bot.debug) {
        addEvent({
          type: "commands",
          command: "refresh",
          admin_commands: adminCommands,
          normal_commands: normalCommands
        });
      }

      return;
    }
  }
    
}
