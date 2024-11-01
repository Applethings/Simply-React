import { Client, Collection } from "discord.js";
import { MongoClient } from "mongodb";
import { Command } from "./Command";

export interface BotEventHandler {
    reload: (event: string) => string | null
    unload: (event: string) => string | null
}

export interface Bot extends Client {
    mongo: MongoClient
    commands: Collection<string, Command>
    ehandler: BotEventHandler
    debug: boolean
}