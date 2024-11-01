import { SlashCommandBuilder } from '@discordjs/builders';
import { getCollection } from "../../mongo";
import { Command, CommandResult } from '../../types/Command';
import { ChannelType } from 'discord.js';

module.exports = <Command>{
  config: {
    name: 'settings',
    description: 'Manage bot settings',
    usage: '',
    uses: ["mongo", "perm-settings"]
  },
  slashCommand: (bot) => new SlashCommandBuilder()
  .addSubcommandGroup(sub => sub.setName("leveling").setDescription("Enables or disables leveling on this server")
    .addSubcommand(o => o.setName("set").setDescription("Set the value").addStringOption(
      opt => opt.setName("enabled").setDescription("Is leveling enabled")
      .addChoices(
        {name: "Enable", value: "true"},
        {name: "Disable", value: "false"}
      )
      .setRequired(true)
    ))
    .addSubcommand(o => o.setName("get").setDescription("Get the current value"))
    .addSubcommand(o => o.setName("reset").setDescription("Reset to the default value"))
  )
  .addSubcommandGroup(sub => sub.setName("levelup_channel").setDescription("Channel in which leveling level-up messages will be sent")
    .addSubcommand(o => o.setName("set").setDescription("Set the value").addChannelOption(
      opt => opt.setName("channel").setDescription("Levelup Notification Channel").addChannelTypes(ChannelType.GuildText).setRequired(true)
    ))
    .addSubcommand(o => o.setName("get").setDescription("Get the current value"))
    .addSubcommand(o => o.setName("reset").setDescription("Reset to the default value"))
  )
  .addSubcommandGroup(sub => sub.setName("changelog").setDescription("Will the bot post the changelog in this server")
    .addSubcommand(o => o.setName("set").setDescription("Set the value").addStringOption(
      opt => opt.setName("enabled").setDescription("Will post changelog")
      .addChoices(
        {name: "Enable", value: "true"},
        {name: "Disable", value: "false"}
      )
      .setRequired(true)
    ))
    .addSubcommand(o => o.setName("get").setDescription("Get the current value"))
    .addSubcommand(o => o.setName("reset").setDescription("Reset to the default value"))
  )
  .addSubcommandGroup(sub => sub.setName("changelog_channel").setDescription("Channel in which the changelog will be sent")
    .addSubcommand(o => o.setName("set").setDescription("Set the value").addChannelOption(
      opt => opt.setName("channel").setDescription("Changelog Channel").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)
    ))
    .addSubcommand(o => o.setName("get").setDescription("Get the current value"))
    .addSubcommand(o => o.setName("reset").setDescription("Reset to the default value"))
  )
  .addSubcommand(sub => {
    return sub.setName("command").setDescription("Disable or enable specific commands").addStringOption(cmd => {
      return cmd.setAutocomplete(true).setRequired(true).setName("command").setDescription("Which command to Disable/Enable");
    }).addStringOption(
      opt => opt.setName("enabled").setDescription("Is the command enabled?")
      .addChoices(
        {name: "Enable", value: "true"},
        {name: "Disable", value: "false"}
      )
      .setRequired(true)
    );
  })
  .addSubcommand(sub => sub.setName("science").setDescription("Send usage data to Simply React for science").addStringOption(
    opt => opt.setName("enabled").setDescription("Science")
    .addChoices(
      {name: "Enable", value: "true"},
      {name: "Disable", value: "false"}
    )
    .setRequired(true)
  ))
  ,
  runInteraction: async (bot, interaction) => {
    const group = interaction.options.getSubcommandGroup();
    const type = interaction.options.getSubcommand();
    if(group === 'leveling') {
      const settings = getCollection("serversettings");
      if(type === "set") {
        let value = interaction.options.getString("enabled") === 'true';
        await settings.updateOne({ id: interaction.guild!.id }, { $set: { leveling: value }}, { upsert: true });
        if(value) {
          interaction.reply("Enabled leveling");
        }else {
          interaction.reply("Disabled leveling");
        }
      }else if(type === "get") {
        const value = await settings.findOne({ id: interaction.guild!.id });
        interaction.reply(`Leveling is currently ${(value?.leveling ?? true) ? "Enabled" : "Disabled"}`);
      }else if(type === "reset") {
        await settings.updateOne({ id: interaction.guild!.id }, { $unset: { leveling: true }}, { upsert: true });
        interaction.reply("Reset leveling option to default");
      }else {
        interaction.reply({content: "impossible", ephemeral: true});
        return CommandResult.Parameters;
      }
      return CommandResult.Success;
    }else if(group === 'levelup_channel') {
      const settings = getCollection("serversettings");
      if(type === "set") {
        let channel = interaction.options.getChannel("channel", true);
        await settings.updateOne({ id: interaction.guild!.id }, { $set: { levelup_channel: channel.id }}, { upsert: true });
        interaction.reply("Set Level Up Channel to <#" + channel.id + ">");
      }else if(type === "get") {
        const value = await settings.findOne({ id: interaction.guild!.id });
        if(value?.levelup_channel) {
          interaction.reply(`The levelup channel is configured to <#${value.levelup_channel}>`);
        }else {
          interaction.reply("The levelup channel is not set");
        }
      }else if(type === "reset") {
        await settings.updateOne({ id: interaction.guild!.id }, { $unset: { levelup_channel: true }}, { upsert: true });
        interaction.reply("Reset levelup channel option to default");
      }else {
        interaction.reply({content: "impossible", ephemeral: true});
        return CommandResult.Parameters;
      }
      return CommandResult.Success;
    }else if(group === 'changelog') {
      const settings = getCollection("serversettings");
      if(type === "set") {
        let enabled = interaction.options.getString("enabled") === 'true';
        await settings.updateOne({ id: interaction.guild!.id }, { $set: { "changelog.enabled": enabled }}, { upsert: true });
        if(enabled) {
          interaction.reply(`Enabled changelog in this server`);
        }else {
          interaction.reply("Disabled changelog in this server");
        }
      }else if(type === "get") {
        const value = await settings.findOne({ id: interaction.guild!.id });
        if(!value || !value.changelog || value.changelog.enabled) {
          interaction.reply(`The bot will send its changelog in this server`);
        }else {
          interaction.reply("The bot will not send its changelog in this server");
        }
      }else if(type === "reset") {
        await settings.updateOne({ id: interaction.guild!.id }, { $unset: { "changelog.enabled": true }}, { upsert: true });
        interaction.reply("Reset changelog option to default");
      }else {
        interaction.reply({content: "impossible", ephemeral: true});
        return CommandResult.Parameters;
      }

      return CommandResult.Success;
    }else if(group === 'changelog_channel') {
      const settings = getCollection("serversettings");
      if(type === "set") {
        let channel = interaction.options.getChannel("channel", true);

        await settings.updateOne({ id: interaction.guild!.id }, { $set: { "changelog.enabled": true, "changelog.id": channel.id}}, { upsert: true });
        interaction.reply(`Enabled changelog and set channel to <#${channel.id}>`);
      }else if(type === "get") {
        const value = await settings.findOne({ id: interaction.guild!.id });
        if(value?.changelog?.id) {
          interaction.reply(`The changelog channel is configured to <#${value.levelup_channel}>`);
        }else {
          interaction.reply("The changelog channel is not set");
        }
      }else if(type === "reset") {
        await settings.updateOne({ id: interaction.guild!.id }, { $unset: { "changelog": true }}, { upsert: true });
        interaction.reply("Reset changelog channel option to default");
      }else {
        interaction.reply({content: "impossible", ephemeral: true});
        return CommandResult.Parameters;
      }
      return CommandResult.Success;
    }else if(type === 'command') {
      let commandName = interaction.options.getString("command", true);
      let enabled = interaction.options.getString("enabled") === 'true';
      let cmd = bot.commands.get(commandName);
      if(cmd?.config.dev) cmd = undefined;
      if(cmd?.config.disabled) cmd = undefined;
      if(cmd?.config.category === "admin") cmd = undefined;
      if(cmd?.config.name === "settings") cmd = undefined;
      if(!cmd) {
        interaction.reply({content: "Command not found", ephemeral: true});
        return CommandResult.Parameters;
      }

      const settings = getCollection("serversettings");
      const v: any = {$set: {}};
      v["$set"][`commands.${cmd.config.name}`] = enabled;
      await settings.updateOne({ id: interaction.guild!.id }, v, { upsert: true });
      interaction.reply(`${enabled?"Enabled":"Disabled"} command \`${cmd.config.name}\``);
      return CommandResult.Success;
    }else if(type === 'science') {
      let enabled = interaction.options.getString("enabled") === 'true';

      const settings = getCollection("serversettings");
      await settings.updateOne({ id: interaction.guild!.id }, { $set: { "changelog.enabled": enabled }}, { upsert: true });
      if(enabled) {
        interaction.reply(`Enabled science in this server`);
      }else {
        interaction.reply("Disabled science in this server");
      }
      await settings.updateOne({ id: interaction.guild!.id }, { $set: { "science": enabled }}, { upsert: true });
      return CommandResult.Success;
    }
    interaction.reply("Unknown subcommand");
    return CommandResult.Parameters;
  }
}