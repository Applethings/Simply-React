import { APIApplicationCommandOptionChoice, EmbedBuilder, Guild } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import fs from "fs";
import { Bot } from "../../types/Bot";
import { Command, CommandResult } from "../../types/Command";

async function runHelp(bot: Bot, guild: Guild, senderId: string, showCmd: string | null): Promise<[CommandResult, EmbedBuilder?]> {
  let result = getCollection("serversettings");
  let settings = await result.findOne({ id: guild.id })
  let showLevelling = true;
  if(settings && settings.leveling === false) {
    showLevelling = false;
  }

  const embed = new EmbedBuilder()
      .setColor("#00ffff")
      .setAuthor({name: `${guild.members.me!.displayName} Help`, iconURL: guild.iconURL()!})
      .setThumbnail(bot.user!.displayAvatarURL())


  var showFullHelp = showCmd && showCmd === 'all' && ['332990813195993092', '665376355155968000'].includes(senderId);
  var showHelp = !showCmd || showFullHelp;

  if(showHelp) {
    const categories = fs.readdirSync("./commands/");

    embed.setDescription(`These are the avaliable commands for ${guild.members.me!.displayName}`)
    
    
    var commandCount = 0;
    for(const category of categories) {
      if(fs.lstatSync("./commands/" + category).isFile()) {
        continue;
      } 
      if(!showFullHelp && category === 'admin') {
        continue;
      }
      if(!showFullHelp && (category === 'leveling' && !showLevelling)) {
        continue;
      }
      const dir = bot.commands.filter(c => c.config.category === category).filter(c => !((c.config.dev && !bot.debug) || c.config.disabled));
      if(showFullHelp || category !== 'admin') {
        const capitalise = category.slice(0, 1).toUpperCase() + category.slice(1)
        if(dir.size !== 0) {
          embed.addFields({name: `❯ ${capitalise} [${dir.size}]:\n`, value: dir.sort((a, b) => a.config.name.localeCompare(b.config.name)).map((c: Command) => `${c.config.deprecated?"~~":""}\`${c.config.name}\`${c.config.deprecated?"~~":""}`).join(" ")})
          commandCount += dir.size;
        }else {
          embed.addFields({name: `❯ ${capitalise} [${dir.size}]:\n`, value: "None"})
        }
      }
    }

    embed.setFooter({text: `Total Commands: ${commandCount}`, iconURL: bot.user!.displayAvatarURL()});
  } else {
    let command: (Command | null) = bot.commands.get(showCmd!.toLowerCase()) ?? null;
    if(command && command.config.category === 'admin') command = null;
    if(command && (command.config.uses || []).includes("leveling") && !showLevelling) command = null;
    if(command && (command.config.dev && !bot.debug)) command = null;
    if(command && command.config.disabled) command = null;
      
    if(!command) {
      return [CommandResult.Parameters, embed.setTitle("Invalid Command.").setDescription(`Do \`/help\` for the list of the commands.`)];
    }
    let config = command.config
embed.setDescription(`The bot's prefix is: \`/\`\n
**Command:** ${config.name.slice(0, 1).toUpperCase() + config.name.slice(1)}
**Description:** ${config.description || "No Description provided."}
**Usage:** ${config.usage ? `\`/${config.name} ${config.usage}\`` : "No Usage"}`)
  }
  return [CommandResult.Success, embed];
}


module.exports = <Command>{
  config: {
      name: "help",
      usage: "[command]",
      description: "Show help about commands"
  },
  slashCommand: () => new SlashCommandBuilder()
                        .addStringOption(option => {
                          return option.setName("command").setDescription("Command to show help").setRequired(false);
                        }),
  runInteraction: async (bot, interaction) => {
    const showCmd = interaction.options.getString("command", false);
    const result = await runHelp(bot, interaction.guild!, interaction.user.id, showCmd);

    if(result[1]) interaction.reply({embeds: [result[1]]});
    return result[0];
  }
}
