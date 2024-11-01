import { Request } from 'express';
import { WebSocket } from 'ws';
import { getCollection } from '../mongo';
import fs from "fs";

module.exports = {
    get: async () => {
        return fs.readFileSync("../src/server/eventlog.html");
    },
    ws: async (ws: WebSocket, req: Request) => {
        const collection = getCollection("science");
        const events = (await collection.findOne({})).events;
        require("./server").localData.eventlogSockets.push(ws);
        const chunkSize = 50;
        for (let i = events.length - 1; i >= 0; i -= chunkSize) {
            const chunk = events.slice(i, i + chunkSize);
            ws.send(JSON.stringify({type: "-", elements: chunk}));
        }
        ws.send(JSON.stringify({type: "="}));
        
        ws.on("close", () => {
            const s = require("./server").localData.eventlogSockets;
            s.splice(s.indexOf(ws), 1);
        })
    },
    event: (e: any) => {
        const s = require("./server").localData.eventlogSockets;
        for(const client of s) {
            client.send(JSON.stringify({type: "+", elements: [e]}));
        }
    }
}