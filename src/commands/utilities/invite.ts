import { Command, CommandResult } from "../../types/Command";
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = <Command>{
  config: {
    name: 'invite',
    usage: '',
    description: "Shows the invite info to invite the bot"
  },
  slashCommand: () => new SlashCommandBuilder(),
  runInteraction: async (bot, interaction) => {
    const invitelink = new EmbedBuilder()
    
    .setColor('Random')
    .setTitle('Simply Info')
    .setDescription(`
    [Support Server](https://discord.gg/fD47wsvjHx)
    [Invite](https://top.gg/bot/817127553914896404)
    [Vote](https://top.gg/bot/817127553914896404)
    
    Active Developer(s): Auskip
    Retired Developer(s): Epicpix
    `)
    interaction.reply({embeds: [invitelink]});
    return CommandResult.Success;
  }
}
