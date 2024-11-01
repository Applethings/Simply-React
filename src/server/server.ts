import fs from 'fs';
import markdown from "./markdown";
import express from "express";
const eapp = express();
import body_parser from "body-parser";
import expressWs from 'express-ws';
import { VoteUser1, VoteUser2 } from './VoteUser';
export const app = expressWs(eapp).app;

const voteKey = ">AP>@?*(@a@Qry70-0";


function getFile(file: string) {
    delete require.cache[require.resolve(file)];
    return require(file);
}

app.post("/api/vote/webhook", body_parser.json(), async (req, res) => {
    if(req.headers['authorization'] === voteKey + "-top") {
        res.status(200);
        const v: VoteUser1 = req.body;
        await getFile("./vote")({user_id: v.user, type: (v.type === 'upvote' ? "vote" : "test"), source: "topgg"});
        res.end();
    }else if(req.headers['authorization'] === voteKey + "-discordbotlist") {
        res.status(200);
        const v: VoteUser2 = req.body;
        await getFile("./vote")({user_id: v.id, vote: "vote", source: "discordbotlist"});
        res.end();
    }else {
        res.status(403).end();
    }
});

app.get("/admin/eventstats", async (req, res) => {
    res.status(200);
    res.end(await (await getFile("./eventstats")).get());
});

app.get("/admin/eventlog", async (req, res) => {
    res.status(200);
    res.end(await (await getFile("./eventlog")).get());
});

app.ws("/api/eventlog", async (ws, req) => {
    await (await getFile("./eventlog")).ws(ws, req);
});

app.get("/admin/serverstats", async (req, res) => {
    res.status(200);
    res.end(await getFile("./serverstats")());
});

app.get("/static/:name", body_parser.json(), (req, res) => {
    res.status(200);
    if(req.params.name.endsWith(".svg")) {
        res.set("Content-Type", "image/svg+xml");
    }
    res.end(fs.readFileSync("../src/server/static/" + req.params.name));
});

app.get("/tos", (req, res) => {
    res.status(200);
    res.set("Content-Type", "text/html");
    res.end("<html><body>" + markdown.convertToHtml(__dirname + "/tos.md") + "</body></html>");
});

app.get("/privacy", (req, res) => {
    res.status(200);
    res.set("Content-Type", "text/html");
    res.end("<html><body>" + markdown.convertToHtml(__dirname + "/privacy.md") + "</body></html>");
});


const localData = {
    shouldRefreshServerStats: true,
    serverStats: null,
    eventlogSockets: []
};

export { localData } 

export function startServer() {
    app.listen(8081);
    console.log("Simply React server online");
}