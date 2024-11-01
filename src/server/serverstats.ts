import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import { Bot } from "../types/Bot";

type RawMessageData = {author: {id: string}, id: string, content: string};

async function generateServersData(token: string) {
    const rest = new REST().setToken(token);
    let messages = [];
    let data = await rest.get(Routes.channelMessages("921611877178572811"), {query: new URLSearchParams("limit=100")}) as RawMessageData[];
    messages.push(...data);
    while(data.length === 100) {
      data = await rest.get(Routes.channelMessages("921611877178572811"), {query: new URLSearchParams("limit=100&before=" + messages[messages.length - 1].id)}) as RawMessageData[];
      messages.push(...data);
    }
    messages = messages.reverse();
    const format = [];
    const x = [];
    const y = [];
    for(let msg of messages) {
      if(msg.author.id === '968802228154548244') {
        let id = parseInt(msg.id);
        let binary = id.toString(2).padStart(64, "0");
        let excerpt = binary.substring(0, 42);
        let decimal = parseInt(excerpt, 2);
        let unix = decimal + 1420070400000;
        let possible = msg.content.match(/\d+/);
        if(possible) {
            x.push(Math.floor(unix / 1000));
            y.push(Number.parseInt(possible[0]));
        }
      }
    }
    format.push(x);
    format.push(y);
    return JSON.stringify(format);
  }

module.exports = async () => {
    const bot: Bot = require("../index").bot;
    const token = bot.token;
    const s = require("./server").localData;
    const x: any[] = [];
    const y: any[] = [];
    const guilds = bot.guilds.cache.map((g)=>g).sort((a,b)=>a.members.me!.joinedTimestamp!-b.members.me!.joinedTimestamp!);
    let num = 0;
    for(const guild of guilds) {
        num++;
        x.push(guild.joinedTimestamp/1000);
        y.push(num);
    }
    s.serverStats = JSON.stringify([x, y]);

    const days: any = {};
    let i = 0;
    for(const guild of guilds) {
        const date = new Date(guild.members.me!.joinedTimestamp!);

        // every day
        // const day = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate() + 1);

        // every week
        // const week = Math.ceil(((date.getTime()) / 86400000) / 7);
        // const day = "+" + week;

        // every month
        const day = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1);

        if(!days[day]) {
            // const d: any = { time: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())/1000, count: 0 };
            const d: any = { time: Date.UTC(date.getUTCFullYear(), date.getUTCMonth())/1000, count: 0 };
            days[day] = d;
        }
        days[day].count++;
        i++;
    }


    let d: any[] = [[], []];
    for(const [,e] of Object.entries(days)) {
        const ee = e as any;
        d[0].push(ee.time);
        d[1].push(ee.count);
    }


    // let d = JSON.parse(s.serverStats);
    // let x = [...d[0]];
    // let y = [...d[1]];
    // x.push(Math.floor(Date.now()/1000));
    // y.push(bot.guilds.cache.size);

    return `
<html>
    <head>
        <link rel="stylesheet" href="/static/uPlot.min.css">
        <style>
            body {
                background: #111111;
                color: #dfe0e8;
            }
        </style>
        <script src="/static/uPlot.iife.min.js"></script>
    </head>
    <body>
        <script>
            let data = ${s.serverStats};
            let type = uPlot.paths.stepped({align: 1});
            let opts = {
                title: "Servers",
                width: window.innerWidth,
                height: window.innerHeight - 100,
                axes: [
                    {
                        stroke: "#dfe0e8",
                        grid: {
                            width: 1 / devicePixelRatio,
                            stroke: "#2c3235",
                        }
                    },
                    {
                        stroke: "#dfe0e8",
                        grid: {
                            width: 1 / devicePixelRatio,
                            stroke: "#2c3235",
                        }
                    }
                ],
                series: [
                    {
                        label: "Time"
                    },
                    {

                        label: "Servers",

                        
                        // series style
                        stroke: "black",
                        width: 2,
                        fill: "rgba(255, 0, 0, 0.4)",
                        paths: (a, b, c, d, e, f) => type(a, b, c, d, e, f)
                    }
                ],
                
            };
            new uPlot(opts, data, document.body);
        </script>
        <script>
            new uPlot({
                title: "Servers per Month",
                width: window.innerWidth,
                height: window.innerHeight - 100,
                axes: [
                    {
                        stroke: "#dfe0e8",
                        grid: {
                            width: 1 / devicePixelRatio,
                            stroke: "#2c3235",
                        }
                    },
                    {
                        stroke: "#dfe0e8",
                        grid: {
                            width: 1 / devicePixelRatio,
                            stroke: "#2c3235",
                        }
                    }
                ],
                series: [
                    {
                        label: "Time"
                    },
                    {

                        label: "Servers per Month",
                        
                        // series style
                        stroke: "black",
                        fill: "rgba(255, 0, 0, 0.4)",
                        width: 2,
                        paths: uPlot.paths.spline()
                    }
                ],
                
            }, ${JSON.stringify(d)}, document.body);
        </script>
    </body>
</html>`
}