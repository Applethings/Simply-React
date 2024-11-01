import { Command, CommandResult } from "../../types/Command";
import { ModalBuilder, SlashCommandBuilder, TextInputBuilder, EmbedBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ChannelType, GuildTextBasedChannel, PermissionFlagsBits, TextInputStyle } from "discord.js";

module.exports = <Command>{
  config: {
    name: 'embed',
    description: 'Want something more then a plain text? Embeds are a great solution!',
    usage: 'Usually for longer more important messages',
    uses: ["mongo", "perm-embed", "firstuse"]
  },
  slashCommand: () => new SlashCommandBuilder()
  .addStringOption(option => option.setName("color").setDescription("Color of the embed").setRequired(true))
  .addChannelOption(option => option.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setName("channel").setDescription("Channel to send to").setRequired(true)),
    runInteraction: async(bot, interaction) => {
      let color = interaction.options.getString('color', true);
      if(color.startsWith("#")) color = color.substring(1);
      const channel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;

      if(!channel.permissionsFor(bot.user!.id)!.has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks)) {
        interaction.reply("I do not have permissions to send messages in that channel.")
        return CommandResult.Permissions;
      }

      await interaction.showModal(new ModalBuilder().setCustomId("embed_modal").setTitle("Embed Creator").addComponents(
        [
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder().setCustomId("title_" + color).setStyle(TextInputStyle.Short).setRequired(true).setLabel("Title of the embed").setMinLength(1)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder().setCustomId("description_" + channel.id).setStyle(TextInputStyle.Paragraph).setRequired(true).setLabel("Description of the embed").setMinLength(1)
          )
        ]
      ));
      interaction.replied = true;
      if(interaction.firstUse) {
        await interaction.followUp({ephemeral: true, embeds: [new EmbedBuilder().setTitle("Did you know?").setDescription(`You can edit embeds by right clicking the embed message, clicking Apps, and then clicking Edit Embed\nThat allows you to edit the title, description and color of the selected embed.`)]});
      }else {
        await interaction.followUp({ephemeral: true, content: "Created. USE HEX CODES FOR COLORS NOT WORDS LIKE 'red' \nie: #400d2f"});
      }

      return CommandResult.Success;

    }
}