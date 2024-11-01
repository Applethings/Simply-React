import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { addEvent, permCheck } from "../functions";
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";
import { Command, CommandResult, InteractionInfo } from "../types/Command";

module.exports = async (bot: Bot, interaction: ChatInputCommandInteraction) => {
  for(var name of bot.commands.keys()) {
      var cmd = bot.commands.get(name);
      if(!cmd) {
          interaction.reply("Not implemented yet.");
          return;
      }
      if(interaction.commandName === cmd.config.name) {
        if(cmd.config.category === 'admin') {
          if(!['332990813195993092', '665376355155968000'].includes(interaction.user.id)) {
            interaction.reply({content: "Sorry! You can't run this.", ephemeral: true});
            return;
          }
        }
        if(cmd.config.disabled) {
          interaction.reply({content: "This command is not available", ephemeral: true});
          return;
        }
        const uses = cmd.config.uses || [];
        let returnValue = CommandResult.Exception;
        if(uses.includes("vote")) {
          // ignore voting for December, months are 0-based, which means 11 is December
          if(new Date().getMonth() !== 11 && interaction.user.id !== "481377376475938826") {
            const voteData = await getCollection("votes").findOne({id: interaction.user.id});
            if(!voteData || voteData.votes[voteData.votes.length - 1].at + 43200000 <= Date.now()) {
              interaction.reply({content: "Please [vote](https://top.gg/bot/817127553914896404/vote) for the bot to access this command.", ephemeral: true});
              returnValue = CommandResult.VoteRequired;
            }
          }
        }
        if(returnValue === CommandResult.Exception) {
          let cmdd: Command | null = cmd;
          if(cmdd?.config.dev) cmdd = null;
          if(cmdd?.config.disabled) cmdd = null;
          if(cmdd?.config.category === "admin") cmdd = null;
          if(cmdd?.config.name === "settings") cmdd = null;
          if(cmdd) {
            let settings = await getCollection("serversettings").findOne({ 'id': interaction.guild!.id }) as any
            if(settings && settings.commands && settings.commands[cmd.config.name] === false) {
              interaction.reply({content: "This command is disabled on this server", ephemeral: true});
              returnValue = CommandResult.Disabled;
            }
          }
        }
        if(returnValue === CommandResult.Exception && uses.includes("leveling")) {
          let settings = await getCollection("serversettings").findOne({ 'id': interaction.guild!.id }) as any
          if(settings && settings.leveling === false) {
            interaction.reply({content: "Leveling is disabled on this server", ephemeral: true});
            returnValue = CommandResult.Disabled;
          }
        }
        if(returnValue === CommandResult.Exception) {
          for(const other of uses) {
            if(other.startsWith("perm-")) {
              let check = await permCheck(interaction, false, other.substring(5))
              if(!check) {
                interaction.reply("Not enough permissions. Required permission: `Administrator` or `" + other.substring(5) + "`");
                returnValue = CommandResult.Permissions;
              }
            }
          }
        }
        let collectScience = !uses.includes("noscience");
        if(collectScience) {
          let settings = await getCollection("serversettings").findOne({ 'id': interaction.guild!.id }) as any
          if(settings && settings.science === false) {
            collectScience = false;
          }
        }
        if(returnValue === CommandResult.Exception) {
          try {
            const interactionI = interaction as InteractionInfo;
            if(uses.includes("firstuse")) {
              const found = await getCollection("usersettings").findOne({_id: interaction.user.id});
              interactionI.firstUse = true;
              if(found && found['commands_ran'] && found['commands_ran'][cmd.config.name]) {
                interactionI.firstUse = false;
              }
            }else {
              interactionI.firstUse = false;
            }
            returnValue = await cmd.runInteraction(bot, interactionI);
          } catch(e) {
              console.error("An exception occurred while running command \"" + cmd.config.name + "\"", e);
              if(collectScience) {
                addEvent({
                  type: "command_crash",
                  command: cmd.config.name
                }, interaction.guildId!);
                if(!interaction.replied) {
                  await interaction.reply({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Error").setDescription("An error occurred while running this command!\nPlease use `/bugreport` to report this bug.").setColor(0xff0000)]});
                }
              }
          }
        }

        if(returnValue === CommandResult.Success && uses.includes("firstuse")) {
          const q: any = {$set: {}};
          q["$set"][`commands_ran.${cmd.config.name}`] = true;
          getCollection("usersettings").updateOne({_id: interaction.user.id}, q, {upsert: true});
        }

        if(bot.debug || !collectScience) return;

        addEvent({
          type: "command",
          command: cmd.config.name,
          returnValue: returnValue
        }, interaction.guildId!);
        
        {
          let updateQuery: any = {$inc: {}};
          updateQuery["$inc"][`${cmd.config.name}.${returnValue ?? 0}`] = 1;
          getCollection("commandstats").updateOne({}, updateQuery, {upsert: true});
        }
    }
  }
}