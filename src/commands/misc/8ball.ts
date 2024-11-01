import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

const answers = [
  'Yes', 
  'No', 
  'Never', 
  'Definitely', 
  'Ask again later', 
  'Does Siri know the answer?', 
  'What do you think?', 
  'Wait, what say that again',
  "roll again", 
  "maybe ;)",
  "stop",
  "I don't understand you",
  "Speak clearer",
  "Does Alexa know the answer?",
  "Think about it",
  "Yeah, obviously",
  "No... Yes",
  "That's obviously a yes",
  "There's an obvious answer, why are you asking me this?",
  "Literally yes",
  "Why are you asking me this?",
  "Yeahhhh...",
  "I *totally* understand",
  "¯\_(ツ)_/¯",
  "When you think about it... the answer is yes",
  "When you think about it... the answer is no",
  "When you think about it... the answer is so obvious",
  "the answer is yes",
  "the answer is no",
  "I'm busy, ask me that later",
  "That's not important right now",
  "lol",
  "good question"
];

module.exports = <Command>{
  config: {
    name: '8ball',
    description: 'Will probably answer questions for you...',
    usage: '<question>'
  },
  slashCommand: () => new SlashCommandBuilder().addStringOption(option => option.setName("question").setDescription("The question you have").setRequired(true)),
  runInteraction: async (bot, interaction) => {
    const result = Math.floor(Math.random() * answers.length);
    const question = interaction.options.getString("question", true);
    const embed = new EmbedBuilder()
      .setAuthor({name: '🎱 The 8 Ball says...'})
      .setColor('#FFA500').addFields({name: 'Question:', value: question})
      .addFields({name: 'Answer:', value: answers[result]})
    await interaction.reply({embeds: [embed]});
    return CommandResult.Success;
  }
};