const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    builder: () => new ContextMenuCommandBuilder().setName("Finish Poll").setType(ApplicationCommandType.Message),
    execute: (bot, event) => {
        console.log("execute!");
    }
};
