import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';

module.exports = <Command>{
  config: {
    name: "dm",
    description: "Disable/Enable notifications when roles are added to you",
    usage: "<enable/disable>",
    uses: ["mongo"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addSubcommand(sub => sub.setName("enable").setDescription("Enable notifications"))
  .addSubcommand(sub => sub.setName("disable").setDescription("Disable notifications")),
  runInteraction: async (bot, interaction) => {
    const sub = interaction.options.getSubcommand(true) === "enable";

    const result = getCollection("usersettings");
    await result.updateOne({ _id: `${interaction.user.id}` }, { $set: { enabled: sub }}, { upsert: true });
    interaction.reply({content: `Direct messages are now ${sub ? "enabled" : "disabled"}`, ephemeral: true});
    return CommandResult.Success;
  }
}