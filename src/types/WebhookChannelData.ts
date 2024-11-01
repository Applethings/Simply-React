import { Collection, NewsChannel, TextChannel, VoiceChannel, Webhook } from "discord.js";

export interface WebhookChannelData {
    webhooksCached: Webhook[]
};

export type WebhookChannel = (TextChannel | NewsChannel | VoiceChannel) & WebhookChannelData; // voice channel because text in voice discord thing
