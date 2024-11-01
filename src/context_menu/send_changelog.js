const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    builder: () => new ContextMenuCommandBuilder().setName("Send Changelog").setType(ApplicationCommandType.Message),
    execute: (bot, event) => {
        console.log("execute!");
    }
};
