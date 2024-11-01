import { MongoClient } from "mongodb";

export function getCollection(collection: string): any {
    let client: MongoClient = require("./index").bot.mongo;
    return client.db("simplyreact").collection(collection);
}