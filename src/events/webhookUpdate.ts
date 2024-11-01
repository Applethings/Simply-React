import { PermissionFlagsBits } from "discord.js";
import { Bot } from "../types/Bot";
import { WebhookChannel } from "../types/WebhookChannelData";

module.exports = async (bot: Bot, channel: WebhookChannel) => {
    channel.webhooksCached ??= [];
    if(channel.permissionsFor(channel.guild.members.me!, true).has(PermissionFlagsBits.ManageWebhooks)) {
        const webhooks = (await channel.fetchWebhooks()).map(x => x);
        const createdWebhooks = [];
        const deletedWebhooks = [];
        channel.webhooksCached = webhooks;
        webhooks.forEach(webhook => {
        });
    }
    // webhooks.forEach(a => console.log(a.owner));
}