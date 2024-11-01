const fs = require('fs');

function textElement(v) {
    return {html: () => v};
}

function getLinks(text) {
    const elements = [];

    let matches = text.matchAll(/\[[^\]]*]\([^)]*\)/g);
    let index = 0;
    for(const match of matches) {
        if(match.index != index) {
            elements.push(textElement(text.substring(index, match.index)));
        }
        const contents = text.substring(match.index, match.index + match[0].length);
        const name = contents.split(/\([^)]*\)/)[0].slice(1, -1);
        const link = contents.split(/\[[^\]]*]/)[1].slice(1, -1);
        elements.push({html: () => `<a href="${link}">${name}</a>`})
        index = match.index + match[0].length;
    }
    if(index != text.length) {
        elements.push(textElement(text.substring(index, text.length)));
    }
    return elements;
}

function generateElements(contents) {
    const lines = contents.split("\n");
    const elements = [];
    var list = [];
    for(let line of lines) {
        line = line.trim();
        if(line.length === 0) continue;
        if(line.startsWith("-")) {
            list.push(line.substring(1));
            continue;
        }
        if(list.length !== 0) {
            const children = [];
            for(const l of list) {
                children.push(getLinks(l));
            }
            elements.push({html: () => `<ul>${children.map(e => `<li>${e.html()}</li>\n`).join("")}</ul>`});
            list = [];
        }
        if(line.startsWith("#")) {
            let size = 0;
            let data = line;
            while(data.charAt(0) === '#') {
                size++;
                data = data.substring(1).trim();
            }
            elements.push({html: () => `<h${size}>${data}</h${size}>`}); 
        }else {
            const links = getLinks(line);
            elements.push({html: () => `<p>${links.map(e => e.html()).join("")}</p>`});
        }
    }
    if(list.length !== 0) {
        const children = [];
        for(const l of list) {
            children.push(...getLinks(l));
        }
        elements.push({html: () => `<ul>${children.map(e => `<li>${e.html()}</li>\n`).join("")}</ul>`});
        list = [];
    }
    return {html: () => elements.map(e => e.html()).join("\n")};
}

module.exports = {
    convertToHtml: function(filename) {
        return generateElements(fs.readFileSync(filename).toString()).html();
    }
}