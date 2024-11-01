import { Bot } from "../types/Bot";

const events: {[key: string]: any} = {}

export default (bot: Bot) => {
  bot.ehandler = {
    reload: function(event) {
      try {
        if(events[event]) {
          bot.removeListener(event, events[event]);
          delete events[event];
        }
        delete require.cache[require.resolve('../events/' + event)];
        const eventHandler = require('../events/' + event).bind(null, bot);
        events[event] = eventHandler;
        bot.on(event, eventHandler);
        return event;
      } catch(e) {
        console.error(e);
      }
      return null;
    },
    unload: function(event) {
      try {
        bot.removeListener(event, events[event]);
        delete require.cache[require.resolve('../events/' + event)];
        return event;
      }catch(e) {
        console.error(e);
      }
      return null;
    }
  };
};