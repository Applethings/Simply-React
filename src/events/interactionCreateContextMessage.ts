import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, Guild, GuildMember, MessageActionRowComponent, MessageContextMenuCommandInteraction, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { addEvent, permCheck } from "../functions";
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";
import { CommandResult } from "../types/Command";

module.exports = async (bot: Bot, interaction: MessageContextMenuCommandInteraction) => {

    let readableReturnValue: CommandResult = CommandResult.Success;
    if(interaction.commandName === "Add Button") {
      if(interaction.targetMessage.author.id !== bot.user!.id) {
        interaction.reply({ephemeral: true, content: "That message was not created by me!"})
        readableReturnValue = CommandResult.Parameters;
      }else if(!await permCheck(interaction, false, "addbutton")) {
        interaction.reply({content: "You do not have the permission `Administrator`", ephemeral: true});
        readableReturnValue = CommandResult.Permissions;
      }else  {
        interaction.showModal(new ModalBuilder().setCustomId("add_button_" + interaction.targetMessage.channelId + "_" + interaction.targetId).setTitle("Add Button to Message").addComponents(
          [
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder().setCustomId("role").setStyle(TextInputStyle.Short).setRequired(true).setLabel("Name (or ID) for the role").setMinLength(1)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder().setCustomId("name").setStyle(TextInputStyle.Short).setRequired(true).setLabel("Name of the button (default: role name)").setMinLength(1)
            )
          ]
        ));
      }
    }else if(interaction.commandName === "Delete Button") {
      if(interaction.targetMessage.author.id !== bot.user!.id) {
        interaction.reply({ephemeral: true, content: "That message was not created by me!"})
        readableReturnValue = CommandResult.Parameters;
      }else if(interaction.targetMessage.components.length === 0) {
        interaction.reply({ephemeral: true, content: "That message does not have any buttons!"})
        readableReturnValue = CommandResult.Parameters;
      }else if(!await permCheck(interaction, false, "deletebutton")) {
        interaction.reply({content: "You do not have the permission `Administrator`", ephemeral: true});
        readableReturnValue = CommandResult.Permissions;
      }else {
        const components: ActionRow<MessageActionRowComponent>[] = interaction.targetMessage.components;
        o: for(const c of components) {
          for(const d of c.components) {
            if(d.type !== ComponentType.Button) {
              readableReturnValue = CommandResult.Parameters;
              break o;
            }
          }
        } 
        if(readableReturnValue !== CommandResult.Success) {
          interaction.reply({content: "Message cannot have menus!", ephemeral: true});
        }else {
          const global = require("../global");
          global.data.delete_button ??= [];
          global.data.delete_button_id ||= 0;
          
          const id = global.data.delete_button_id++;
          
          const genButtons: ActionRowBuilder<ButtonBuilder>[] = [];
          let buttonCount = 0;
          for(const c of components) {
            const row = new ActionRowBuilder<ButtonBuilder>();
            for(const d of c.components) {
              if(d.type === ComponentType.Button) {
                if(d.customId!.startsWith("button_role_")) {
                  row.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel(d.label!).setCustomId("delete_button_" + id + "_" + d.customId!.substring("button_role_".length)));
                  buttonCount++;
                }
              }
            }
            genButtons.push(row);
          }
          if(buttonCount === 0) {
            interaction.reply({ephemeral: true, content: "That message does not have any buttons!"})
            readableReturnValue = CommandResult.Parameters;
          }else {
            global.data.delete_button.push({
              id: id,
              message: interaction.targetMessage
            });
            interaction.reply({content: "Click a button to remove it", components: genButtons, ephemeral: true});
          }
        }
      }
    }else if(interaction.commandName === "Finish Poll") {
      if(interaction.targetMessage.author.id !== bot.user!.id) {
        interaction.reply({ephemeral: true, content: "That message was not created by me!"})
        readableReturnValue = CommandResult.Parameters;
      }else {
      const p = await getCollection("polls").findOne({message: interaction.targetId});
      if(!p) {
        interaction.reply({ephemeral: true, content: "Message is not a poll!"})
        readableReturnValue = CommandResult.Parameters;
      }else {
      if(!await permCheck(interaction, false, "finishpoll") && interaction.targetMessage.interaction?.user.id !== interaction.user.id) {
        interaction.reply({content: "You do not have the permission `Administrator`", ephemeral: true});
        readableReturnValue = CommandResult.Permissions;
      }else {
      const poll = (await getCollection("polls").findOneAndUpdate({message: interaction.targetId}, {"$set": {"finished": true}}, {returnDocument: "after"})).value;

      let desc = "";
      const components: ButtonBuilder[] = [];
      for(let i = 0; i<poll.options.length; i++) {
        let total = 0;
        for(const vote of Object.values(poll.votes)) {
          if(vote === i) {
            total++;
          }
        }
        desc += "**" + poll.options[i] + "**" + ": " + total + " vote" + (total === 1 ? "" : "s") + "\n";
        components.push(new ButtonBuilder().setCustomId(`poll_option_${i}`).setLabel(poll.options[i]).setStyle(ButtonStyle.Primary).setDisabled(true));
      }

      interaction.targetMessage.edit({
        embeds: [ new EmbedBuilder().setTitle(poll.title).setDescription(desc).setFooter({text: "Poll Closed"}) ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(components)
        ]
      });
      interaction.reply({content: "Vote finished", ephemeral: true});
      }
      }
      }
    }else if(interaction.commandName === "Edit Embed") {
      if(interaction.targetMessage.author.id !== bot.user!.id) {
        interaction.reply({ephemeral: true, content: "That message was not created by me!"})
        readableReturnValue = CommandResult.Parameters;
      }else if(interaction.targetMessage.embeds.length !== 1) {
        interaction.reply({ephemeral: true, content: "That message does not have an embed!"})
        readableReturnValue = CommandResult.Parameters;
      }else if(!await permCheck(interaction, false, "editembed")) {
        interaction.reply({content: "You do not have the permission `Administrator`", ephemeral: true});
        readableReturnValue = CommandResult.Permissions;
      }else {
        let embed = interaction.targetMessage.embeds[0];
        if(embed.footer && embed.footer.text.startsWith("Embed created by")) {
          interaction.showModal(new ModalBuilder().setCustomId("embed_edit").setTitle("Embed Editor").addComponents(
            [
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder().setCustomId("title_" + interaction.targetId).setValue(embed.title!).setStyle(TextInputStyle.Short).setRequired(true).setLabel("Title of the embed").setMinLength(1)
              ),
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder().setCustomId("description_" + interaction.targetMessage.channelId).setValue(embed.description!).setStyle(TextInputStyle.Paragraph).setRequired(true).setLabel("Description of the embed").setMinLength(1)
              ),
              new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder().setCustomId("color").setValue(embed.hexColor!).setStyle(TextInputStyle.Short).setRequired(true).setLabel("Color of the embed").setMinLength(7)
              )
            ]
          ));
        }else {
          interaction.reply({ephemeral: true, content: "That message has not been made using /embed"})
          readableReturnValue = CommandResult.Parameters;
        }
      }
    }else if(interaction.commandName === "Send Changelog") {
      if(!["332990813195993092", "665376355155968000"].includes(interaction.user.id)) {
        interaction.reply({content: "Not nice\n- EpicPix", ephemeral: true});
        readableReturnValue = CommandResult.Permissions;
      }else {
      if(interaction.targetMessage.author.id !== bot.user!.id) {
        interaction.reply({content: "I can only send my own messages, idiot", ephemeral: true});
        readableReturnValue = CommandResult.Parameters;
      }else {
      if(interaction.targetMessage.embeds.length !== 1) {
        interaction.reply({content: "The message must have exactly one embed, idiot", ephemeral: true});
        readableReturnValue = CommandResult.Parameters;
      }else {
      const e = interaction.targetMessage.embeds[0];
      const timeout = setTimeout(async () => {
        const guildData = await (await getCollection("serversettings").find()).toArray();
        const guildSettings: any = {};
        for(const settings of guildData) {
          guildSettings[settings.id] = settings;
        }
        const guilds: Guild[] = [];
        // guilds.push(bot.guilds.cache.get("853042758347128844")!);
        const allGuilds = bot.guilds.cache.map((v, k, c) => v);
        for(const guild of allGuilds) {
          let allowed = false;
          if(guild.features.includes("COMMUNITY")) {
            allowed = true;
          }
          const s = guildSettings[guild.id]?.changelog;
          if(s) {
            if(s.enabled) {
              if(s.id || guild.features.includes("COMMUNITY")) {
                allowed = true;
              }
            }else {
              allowed = false;
            }
          }
          if(allowed) {
            guilds.push(guild);
          }
        }
        await interaction.followUp({content: "Sending changelog to " + guilds.length + " guild" + (guilds.length === 1 ? "" : "s")});
        let sentCount = 0;
        for(const guild of guilds) {
          const channelId = guildSettings[guild.id]?.changelog?.id ?? guild.publicUpdatesChannelId;
          const channel = guild.channels.cache.get(channelId);
          if(channel) {
            if(channel.isTextBased()) {
              try {
                await channel.send({embeds: [e]});
                sentCount++;
              }catch(e) {}
            }
          }
        }
        await interaction.followUp({content: "Finished sending to " + guilds.length + " guild" + (guilds.length === 1 ? "" : "s, sent " + sentCount + " message" + (sentCount === 1 ? "" : "s"))});
      }, 2 * 60 * 1000);
      await interaction.reply({content: "The message will be sent to all servers in 2 minutes\ncancel it with `/evaluate input:clearTimeout(" + timeout + ")`", embeds: [e]});
      }
      }
      }
    }
    addEvent({
      type: "message",
      command: interaction.commandName,
      returnValue: readableReturnValue
    }, interaction.guildId!);
}