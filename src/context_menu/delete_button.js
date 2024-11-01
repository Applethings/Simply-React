const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    builder: () => new ContextMenuCommandBuilder().setName("Delete Button").setType(ApplicationCommandType.Message),
    execute: (bot, event) => {
        console.log("execute!");
    }
};
