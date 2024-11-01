import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord-api-types/v9';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { Command, CommandResult } from '../../types/Command';
import { getCollection } from "../../mongo";

module.exports = <Command>{
  config: {
    name: "poll",
    description: "Create a poll",
    usage: "<poll> <option1> <option2> [option3] [option4]",
    uses: ["mongo", "firstuse"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addStringOption(option => option.setName("poll").setDescription("The poll question").setRequired(true))
  .addStringOption(option => option.setName("option1").setDescription("First Option").setRequired(true))
  .addStringOption(option => option.setName("option2").setDescription("Second Option").setRequired(true))
  .addStringOption(option => option.setName("option3").setDescription("Third Option (Optional)").setRequired(false))
  .addStringOption(option => option.setName("option4").setDescription("Fourth Option (Optional)").setRequired(false)),
  runInteraction: async(bot, interaction) => {
    const title = interaction.options.getString("poll", true);
    const values: string[] = [];
    values.push(interaction.options.getString("option1", true));
    values.push(interaction.options.getString("option2", true));
    const o3 = interaction.options.getString("option3", false);
    if(o3) values.push(o3);
    const o4 = interaction.options.getString("option4", false);
    if(o4) values.push(o4);
    const components: ButtonBuilder[] = [];

    for(let i = 0; i<values.length; i++) {
        components.push(new ButtonBuilder().setCustomId(`poll_option_${i}`).setLabel(values[i]).setStyle(ButtonStyle.Primary));
    }

    const message = await interaction.reply({
        embeds: [
            new EmbedBuilder().setTitle(title).setDescription(values.map(x => "**" + x + "**: 0 votes").join("\n"))
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(components)
        ],
        fetchReply: true
    });

    await getCollection("polls").insertOne({channel: message.channelId, message: message.id, title, options: values, votes: {}}) as any;
    if(interaction.firstUse) {
      await interaction.followUp({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can finish the poll by right clicking the poll, then going in Apps and then clicking Finish Poll`)]});
    }
    return CommandResult.Success;
  }
}


