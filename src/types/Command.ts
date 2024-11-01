import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js"
import { Bot } from "./Bot"

export type CommandUse = "mongo" | "vote" | "leveling" | "firstuse" | "noscience";

export interface CommandConfig {
    name: string
    category?: string
    description: string
    usage: string
    uses?: CommandUse[]
    dev?: boolean
    disabled?: boolean
    deprecated?: boolean
}

export interface InteractionInfo extends ChatInputCommandInteraction {
    firstUse: boolean
}

export interface Command {
    config: CommandConfig,
    slashCommand: (bot?: Bot) => SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder,
    runInteraction: (bot: Bot, interaction: InteractionInfo) => Promise<CommandResult>
}

export enum CommandResult {
    Exception = -1,
    Permissions = 0,
    Success = 1,
    Parameters = 2,
    Disabled = 3,
    VoteRequired = 4,
    ForcedSlashCommands = 5
}