import { Bot } from "./types/Bot";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import AddButton from "./context_menu/add_button.js"
import DeleteButton from "./context_menu/delete_button.js"
import EndPoll from "./context_menu/end_poll.js"
import EditEmbed from "./context_menu/edit_embed"
import SendChangelog from "./context_menu/send_changelog.js"

module.exports = {
  setup: async function(bot: Bot, local: boolean, removeNonAdmin: boolean) {
    const rest = new REST({ version: '9' }).setToken(bot.token!);
  
    const commands = [];
    for(const [, command] of bot.commands) {
      if(command.config.dev && !bot.debug) continue;
      if(command.config.disabled) continue;
      const slashCommand = command.slashCommand(bot);
      if((slashCommand as any)['setDMPermission']) {
        (slashCommand as any).setDMPermission(false);
      }
      slashCommand.setName(command.config.name).setDescription(command.config.description);
      if(local) {
        if((slashCommand as any)['setDefaultMemberPermissions']) {
          (slashCommand as any).setDefaultMemberPermissions("0");
        }
      }
      if(command.config.category === 'admin') {
        if(!local) continue;
      }
      if(removeNonAdmin && command.config.category !== 'admin') continue;
      commands.push(slashCommand.toJSON());
    }
    if(!local) {
      commands.push(AddButton.builder().toJSON())
      commands.push(DeleteButton.builder().toJSON())
      commands.push(EndPoll.builder().toJSON())
      commands.push(EditEmbed.builder().toJSON())
    }else {
      commands.push(SendChangelog.builder().toJSON());
    }
    const clientId = bot.user!.id;
    try {
      var result = null;
      if(local) {
        result = await rest.put(
          Routes.applicationGuildCommands(clientId, '853042758347128844'),
          {body: commands}
        )
      }else {
        result = await rest.put(
          Routes.applicationCommands(clientId),
          {body: commands}
        )
      }
    }catch(e) {
      console.error(require('util').inspect(e, {depth: null}));
      return false;
    }
    console.debug("Slash commands refreshed");
    return true;
  }
}
