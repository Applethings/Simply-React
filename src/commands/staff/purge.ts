import { TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command.js';

module.exports = <Command>{
	config: {
		name: 'purge',
    description: 'Clear the chat in bulk',
		usage: '<amount>',
    uses: ["mongo", "perm-purge"]
	},
  slashCommand: () => new SlashCommandBuilder()
  .addIntegerOption(option => option.setName("amount").setDescription("Amount of messages to purge").setMinValue(1).setMaxValue(99).setRequired(true)),
  runInteraction: async (bot, interaction) => {
    if(!interaction.guild!.members.me!.permissions.has("Administrator") && !interaction.guild!.members.me!.permissions.has("ManageMessages")) {
      interaction.reply("I do not have permissions to manage messages, change that in the server settings and then retry the command.");
      return CommandResult.Permissions;
    }

    const amount = interaction.options.getInteger("amount", true) + 1;
    let channel = interaction.channel as TextChannel;
    await channel.messages.fetch({limit: amount}).then(messages =>{
      channel.bulkDelete(messages);
    });

    await interaction.reply({content: "Messages deleted", ephemeral: true});
    
    return CommandResult.Success;
  }
}