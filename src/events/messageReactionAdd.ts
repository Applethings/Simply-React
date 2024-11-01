import { MessageReaction, User, EmbedBuilder } from "discord.js";
import { addEvent } from "../functions";
import { getCollection } from "../mongo";
import { Bot } from "../types/Bot";

module.exports = async (bot: Bot, reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    let guilds = reaction.message.guild;
    if(!guilds) return;

    let messageid = reaction.message.id;
    let guild = bot.guilds.cache.get(guilds.id);
    if(!guild) return;
    const startMeasure = Date.now();
    
    let check = await getCollection("reactionroles").findOne({guild: guild.id, message: messageid});
    if (!check) return;

    if (reaction.emoji.name === check.reaction) {
        let mem = guild.members.cache.get(user.id);
        if(!mem) return;
        let role = guild.roles.cache.get(check.role);
        if(!role) return; // possibly remove the reaction role from db?
        mem.roles.add(role).then(async () => {
            const collection = getCollection("usersettings");
            var dbuser = await collection.findOne({'_id': user.id});
            addEvent({
              type: "reaction_role",
              command: "add_reaction"
            }, reaction.message.guildId!);
            if(dbuser) {
                if(dbuser.enabled) {
                    let embed = new EmbedBuilder()
                        .setColor('#1df2af')
                        .setTitle('Role Added')
                        .setDescription(`The role ${role!.name} has been added to you in ${guild!.name}.`);
                    mem!.send({embeds: [embed]}).catch(e => {
                        console.log("Could not send DM to " + mem!.user.username);
                        addEvent({
                          type: "reaction_role",
                          command: "dm_failed",
                          action: "add"
                        }, reaction.message.guildId!);
                    });
                }
                const stopMeasure = Date.now();
                console.log("Add role took: " + (stopMeasure - startMeasure));

                
            }
        }).catch(console.error);
    }
}