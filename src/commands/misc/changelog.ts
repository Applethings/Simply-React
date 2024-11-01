import { EmbedBuilder, SlashCommandBuilder, version } from "discord.js";
import { Command, CommandResult } from "../../types/Command";
import fs from "fs";
import path from "path";

module.exports = <Command>{
    config: {
      name: 'changelog',
      description: 'Show changelog of Simply React',
      usage: '<version>'
    },
    slashCommand: () => new SlashCommandBuilder().addStringOption(opt => opt.setName("version").setDescription("Which version to show").setRequired(false).setChoices(
        // {name: "Development Version (Public)", value: "vdev"},
        {name: "Version 1.7.1 (Latest)", value: "v1.7.1"},
        {name: "Version 1.6", value: "v1.6"},
        {name: "Version 1.5", value: "v1.5"},
        {name: "Version 1.4", value: "v1.4"},
        {name: "Version 1.3", value: "v1.3"},
    )),
    runInteraction: async (bot, interaction) => {
        const get = interaction.options.getString("version") ?? "v1.7.1";
        const content = fs.readFileSync(path.resolve(__dirname, "../../../changelog.md")).toString();
        const versionInfo: any = {};
        let capture = false;
        let lines: any[] = [];
        let name = null;
        for(const line of content.split("\n")) {
            if(line.startsWith("###")) {
                if(name) {
                    if(capture) versionInfo[name] = lines.join("\n").trim();
                    lines = [];
                }
                name = line.substring(3).trim();
            }else if(line.startsWith("##")) {
                const v = line.substring(2).trim();
                if(capture) {
                    break;
                }
                if(v === get) {
                    name = null;
                    lines = [];
                    capture = true;
                }
            }else {
                lines.push(line);
            }
        }
        if(capture && name) {
            versionInfo[name] = lines.join("\n").trim();
        }
        interaction.reply({embeds: [
            new EmbedBuilder()
            .setColor("Random")
            .setTitle("Version " + get.substring(1))
            .setDescription(Object.entries(versionInfo).map(([name, content]) => `__**${name}**__\n\n${content}`).join("\n\n"))
        ], ephemeral: true});
        return CommandResult.Success;
    },
}