import { GuildMember } from "discord.js";
import { Bot } from "../types/Bot";
import { getCollection } from "../mongo";

module.exports = async (bot: Bot, member: GuildMember) => {
    const autoroles = getCollection("autoroles");
    const found = await autoroles.findOne({ server: member.guild.id });
    if(found != null) {
        await member.roles.add(found.roles, "/autorole");
    }
}