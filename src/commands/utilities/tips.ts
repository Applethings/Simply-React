import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, CommandResult } from "../../types/Command";


module.exports = <Command>{
    config: {
      name: 'tips',
      usage: '<tip>',
      description: 'Show tips about certain things'
    },
    slashCommand: () => new SlashCommandBuilder().addStringOption(opt => opt.setRequired(true).setName("tip").setDescription("What to show the tip about?").setChoices(
        {name: "/button", value: "button"},
        {name: "/embed", value: "embed"},
        {name: "/poll", value: "poll"}
    )),
    runInteraction: async (bot, interaction) => {
        const tip = interaction.options.getString("tip", true);
        if(tip === "button") {
            await interaction.reply({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can add buttons to messages sent by <@${bot.user!.id}>\nRight click the message, click Apps, and then click Add Button\nYou can use that to add buttons to an embed made with /embed`)]});
        }else if(tip === "embed") {
            await interaction.reply({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can edit embeds by right clicking the embed message, clicking Apps, and then clicking Edit Embed\nThat allows you to edit the title, description and color of the selected embed.`)]});
        }else if(tip === "poll") {
            await interaction.reply({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can finish the poll by right clicking the poll, then going in Apps and then clicking Finish Poll`)]});
        }else {
            await interaction.reply({ephemeral: true, content: "Invalid subcommand"});
            return CommandResult.Parameters;
        }
        return CommandResult.Success;
    }
}