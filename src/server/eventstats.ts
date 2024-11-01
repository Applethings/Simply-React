import { getCollection } from '../mongo';

const HSLToRGB = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  };

module.exports = {
    get: async () => {
        const collection = getCollection("science");
        const events = (await collection.findOne({})).events;
        const seen: any[] = [];
        const stats: any[] = [[]];
        const vals: any[] = [];
        for(const stat of events) {
            const id = stat.type + ":" + stat.command;
            if(!seen.includes(id)) {
                seen.push(id);
                stats.push([]);
            }
        }
        const days: any = {};
        let i = 0;
        for(const stat of events) {
            const id = stat.type + ":" + stat.command;
            const date = new Date(stat.at);

            // every day
            // const day = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate() + 1);


            // every week
            const week = Math.ceil(((date.getTime()) / 86400000) / 7);
            const day = "+" + week;

            // every month
            // const day = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1);

            if(!days[day]) {
                const d: any = { time: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())/1000, events: {} };
                // const d: any = { time: Date.UTC(date.getUTCFullYear(), date.getUTCMonth())/1000, events: {} };
                for(const type of seen) {
                    d.events[type] = 0;
                }
                days[day] = d;
            }
            days[day].events[id]++;
            i++;
        }
        const tops: any = {};
        for(const day of Object.values(days)) {
            const d: any = day;
            const e: any = Object.entries(d.events).sort((a: any, b: any) => b[1] - a[1]);
            for(let i = 0; i<e.length; i++) {
                tops[e[i][0]] = true;
            }
            // tops[e[0][0]] = true;
        }
        const topCount = Object.entries(tops).length;
        const newStats = new Array(topCount + 1);
        for(let i = 0; i<newStats.length; i++) newStats[i] = [];
        const newSeen: any[] = [];
        let x = 0;
        for(let i = 0; i<seen.length; i++) {
            const id = seen[i];
            if(tops[id]) {
                const rgb = HSLToRGB(360 * (x / topCount), 100, 50);
                const rgbN = rgb.map(x => Math.floor(x));
                vals.push(`{show:false,label:${JSON.stringify(id)},stroke:"#${rgbN[0].toString(16).padStart(2, '0')}${rgbN[1].toString(16).padStart(2, '0')}${rgbN[2].toString(16).padStart(2, '0')}a0",width,paths}`);
                newSeen.push(id);
                x++;
            }
        }

        for(const day of Object.values(days)) {
            const d: any = day;
            newStats[0].push(d.time);
            for(const [k, v] of Object.entries(d.events)) {
                if(tops[k]) {
                    newStats[newSeen.indexOf(k)+1].push(v);
                }
            }
        }
        vals.unshift(`{label:"Time"}`);
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
        const data = ${JSON.stringify(newStats)};
        const paths = uPlot.paths.spline();
        const width = 5;
        let opts = {
            title: "Events",
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
            series: [${vals}],
            
        };
        let uplot = new uPlot(opts, data, document.body);
    </script>
</body>
</html>`;
    }
}
