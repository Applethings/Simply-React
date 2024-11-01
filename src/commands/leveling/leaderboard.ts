import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';

type LevelData = {level: number, points: number}

module.exports = <Command>{
  config: {
    name: 'leaderboard',
    description: 'Show the top 10 most active users!',
    usage: '',
    uses: ["mongo", "leveling"]
  },
  slashCommand: () => new SlashCommandBuilder(),
  runInteraction: async (bot, interaction) => {
    let result = await getCollection("levels").find({server: interaction.guild!.id}).toArray() as any[];
    result.sort(function(x: LevelData, y: LevelData) {
      if (x.level < y.level) return 1;
      if (x.level > y.level) return -1;
      if (x.points < y.points) return 1;
      if (x.points > y.points) return -1;
      return 0;
    });
    result = result.slice(0, 10);
    var newresult = [];
    for(var val of result) {
      var user = await bot.users.fetch(val.id);
      newresult.push({user, points: val.points, levels: val.level})
    }

    let levellist = new EmbedBuilder()
      .setColor('Random')
      .setTitle(interaction.guildId === "862769050013925386" ? `Leaderboard of virgins` : `Leaderboard`)
      .setThumbnail(bot.user!.displayAvatarURL())

    for(var nr of newresult) {
      var s = nr.levels==1?'':'s';
      levellist.addFields({name: nr.user.username, value: `Level${s}: ${nr.levels} Points: ${nr.points}`})
    }
    
    interaction.reply({embeds: [levellist]})
    return CommandResult.Success;
  }
}
