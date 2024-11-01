import { Command, CommandResult } from "../../types/Command";
import ms from 'ms';
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";

module.exports = <Command>{
  config: {
    name: 'remind',
    usage: '<time> <what you need a reminder of>',
    description: 'Ever forget stuff? Not anymore',
    uses: ["mongo"]
  },
  slashCommand: () => new SlashCommandBuilder()
                        .addStringOption(subcommand => 
                          subcommand
                          .setName("time")
                          .setDescription("Time before triggering the remind")
                          .setRequired(true))
                        .addStringOption(option => 
                          option
                          .setName("reminder")
                          .setDescription("Reminder Name")
                          .setRequired(true)),
  runInteraction: async (bot, interaction) => {
    const incorrect = new EmbedBuilder()
      .setAuthor({
        name: "Command Reminder", iconURL: bot.user!.displayAvatarURL({ size: 2048 })
      })
      .setColor("#eb0936")
      .setTitle("Invalid Arguments")
      .addFields({
        name: "USAGE",
        value: "```>remind <time> <reminder>```"
      }, {
        name: "EXAMPLE",
        value: "`>remind 1h Event starts`"
      }).setFooter({text: 
`Abbreviations:

s = seconds
m = minutes
h = hours
d = days`
      });
    const time = interaction.options.getString("time", true);
    const reminder = interaction.options.getString("reminder", true);
    let user = interaction.user

    if (!time.endsWith("d") && !time.endsWith("m") && !time.endsWith("h") && !time.endsWith("s")) {
      interaction.reply({ embeds: [incorrect] });
      return CommandResult.Parameters;
    }
    const collection = getCollection("usersettings");
    var dbuser = await collection.findOne({ '_id': user.id });
    if (dbuser) {
      if (dbuser.enabled) {
        const remindertime = new EmbedBuilder()
          .setColor('#33F304')
          .setDescription(`\**Your reminder will go off in ${time}**\nMake sure your server dms are on!`)

        interaction.reply({ embeds: [remindertime] })

        const reminderdm = new EmbedBuilder()
          .setColor('#7289DA')
          .setTitle('**REMINDER**')
          .setDescription(`**It has been ${time} here is your reminder:** ${reminder}`)

        setTimeout(async function () {
          try {
            await user.send({ embeds: [reminderdm] })
          } catch (err) {
            console.error(err);
          }

        }, ms(time));
        return CommandResult.Success;

      } else {
        interaction.reply('Please enable your dms. To do so please type /dm enable')
        return CommandResult.Parameters;
      }

    }
  }
}