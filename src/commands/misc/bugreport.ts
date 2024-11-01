import { Attachment, AttachmentBuilder, EmbedBuilder, RawFile, TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';
import { IncomingMessage, RequestOptions } from "http";
import https from "https";

async function download(host: string, path: string): Promise<Buffer> {
  const options: RequestOptions = {
    hostname: host,
    port: 443,
    path: path,
    method: "GET"
  };
  return new Promise((resolve) => {
    const req = https.request(options, (res: IncomingMessage) => {
      const data: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        data.push(Buffer.from(chunk));
      })
      res.on('end', () => {
        resolve(Buffer.concat(data));
      })
    })
    req.end();
  });
}

module.exports = <Command>{
  config: {
    name: 'bugreport',
    description: 'Report a bug to the developers, try to include as much detail as possible',
    usage: '<feature> <message>'
  },
  slashCommand: () => new SlashCommandBuilder()
  .addStringOption(option => option.setName("feature").setDescription("The command or some specific feature that has the bug").setRequired(true))
  .addStringOption(option => option.setName("message").setDescription("Message to developers").setRequired(true))
  .addAttachmentOption(option => option.setName("screenshot").setDescription("Optional screenshot").setRequired(false)),
  runInteraction: async (bot, interaction) => {
    const feature = interaction.options.getString("feature", true);
    const message = interaction.options.getString("message", true);
    const screenshot = interaction.options.getAttachment("screenshot", false);
    
    const channel = bot.channels.cache.find(x => x.id === "1035623463932665956") as TextChannel;
    const embed = new EmbedBuilder()
      .setAuthor({name: interaction.user.username + "#" + interaction.user.discriminator + " (" + interaction.user.id + ")"})
      .setColor('#333333')
      .setTitle("Bug Report")
      .setDescription(feature + ": " + message);
    let files: AttachmentBuilder[] = [];
    let content = "";
    if(screenshot) {
      const downloaded = await download("media.discordapp.net", screenshot.proxyURL.substring("https://media.discordapp.net".length));
      files.push(new AttachmentBuilder(downloaded).setName(screenshot.name ?? "attachment"));
      content = "Bug report with attachment:";
    }
    await channel.send({embeds: [embed], files, content});
    await interaction.reply({content: "Bug Report sent", ephemeral: true});
    return CommandResult.Success;
  }
};