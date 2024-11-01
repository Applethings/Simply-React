import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
    config: {
      name: 'spooky',
      description: '...',
      usage: '<question>'
    },
    slashCommand: () => new SlashCommandBuilder(),
    runInteraction: async (bot, interaction) => {
        const answers = ["boo", "🎃", "👻", "boo!"]
        const result = Math.floor(Math.random() * answers.length);
        await interaction.reply(answers[result]);
        return CommandResult.Success;
      }
    }
