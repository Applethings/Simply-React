import { EmbedBuilder, TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandResult } from '../../types/Command';

enum CalcLexType {
    Number,
    Word,
    Symbol,

    SymbolAdd,
    SymbolSub,
    SymbolMul,
    SymbolDiv,

    ParenOpen,
    ParenClose,

    Unknown,
}

interface CalcLex {
    start: number
    end: number
    value: any
    type: CalcLexType
}

enum CalcParseType {
    Func, Expr, Num, Paren, StaticNum
}

interface CalcParse {
    type: CalcParseType
    start: number
    end: number
    error: false
}

interface CalcParseFunc extends CalcParse {
    type: CalcParseType.Func
    name: CalcLex
    expr: CalcParse
}

interface CalcParseExpr extends CalcParse {
    type: CalcParseType.Expr
    values: CalcParse[]
    op: CalcLex
}

interface CalcParseNum extends CalcParse {
    type: CalcParseType.Num
    num: CalcLex
}

interface CalcParseStaticNum extends CalcParse {
    type: CalcParseType.StaticNum
    num: ComplexNumber
}

interface CalcParseParen extends CalcParse {
    type: CalcParseType.Paren
    expr: CalcParse
}

interface RefNumber {
    value: number
}

interface ErrorInfo {
    location: {
        start: number
        end: number
    }
    message: string
    error: true
}

type ExpressionParser = (lexs: CalcLex[], exprIndex: number, index: RefNumber) => CalcParse | ErrorInfo;

function genExpressionParserStage(...types: CalcLexType[]): ExpressionParser {
    return (lexs, exprIndex, index) => {
        const left = parse(lexs, index, exprIndex + 1);
        if(left.error) return left;
        const op = lexs[index.value];
        if(op && types.includes(op.type)) {
            index.value++;
            const right = parse(lexs, index, exprIndex);
            if(right.error) return right;
            let ext = [right];
            if(right.type === CalcParseType.Expr) {
                const expr = right as CalcParseExpr;
                if(expr.op.type === op.type) {
                    ext = expr.values;
                }
            }
            return <CalcParseExpr>{values: [left, ...ext], op, type: CalcParseType.Expr, start: left.start, end: ext[ext.length - 1].end, error: false};
        }
        return left;
    }
}

const expressionParsers: ExpressionParser[] = [
    genExpressionParserStage(CalcLexType.SymbolAdd, CalcLexType.SymbolSub),
    genExpressionParserStage(CalcLexType.SymbolMul, CalcLexType.SymbolDiv),
    (lexs, exprIndex, index) => {
        const t = lexs[index.value];
        if(t.type === CalcLexType.ParenOpen) {
            index.value++;
            const expr = parse(lexs, index);
            if(expr.error) return expr;
            const end = lexs[index.value++];
            if(end.type !== CalcLexType.ParenClose) {
                return <ErrorInfo>{
                    location: {
                        start: end.start,
                        end: end.end
                    },
                    message: "Expected ')'",
                    error: true
                };
            }
            return <CalcParseParen>{expr, type: CalcParseType.Paren, start: t.start, end: end.end, error: false};
        }else {
            return parse(lexs, index, exprIndex + 1);
        }
    },
    (lexs, exprIndex, index) => {
        const a = lexs[index.value++];
        if(a.type === CalcLexType.SymbolSub) {
            let p = parse(lexs, index, exprIndex - 1);
            if(p.error) return p;
            return <CalcParseExpr>{values: [
                <CalcParseStaticNum>{type: CalcParseType.StaticNum, num: <ComplexNumber> {error: false, real: 0, imaginary: 0}, start: a.start, end: a.end, error: false},
                p
            ], op: a, start: a.start, end: p.end, error: false, type: CalcParseType.Expr};
        }else if(a.type === CalcLexType.Number) {
            return <CalcParseNum>{num: a, type: CalcParseType.Num, start: a.start, end: a.end, error: false};
        }else if(a.type === CalcLexType.Symbol) {
            return <CalcParseStaticNum>{num: <ComplexNumber>{error: false, real: Math.PI, imaginary: 0}, type: CalcParseType.StaticNum, start: a.start, end: a.end, error: false};
        }else if(a.type === CalcLexType.Word) {
            const next = lexs[index.value++];
            if(next.type === CalcLexType.ParenOpen) {
                if(a.value !== "sqrt" && a.value !== "sin" && a.value !== "cos" && a.value !== "tan") {
                    return <ErrorInfo>{
                        location: {
                            start: a.start,
                            end: a.end
                        },
                        message: "Unknown function",
                        error: true
                    };
                }
                const parsed = parse(lexs, index);
                if(parsed.error) return parsed;
                const nnext = lexs[index.value++];
                if(nnext.type !== CalcLexType.ParenClose) {
                    return <ErrorInfo>{
                        location: {
                            start: nnext.start,
                            end: nnext.end
                        },
                        message: "Expected ')' when finishing calling a function",
                        error: true
                    };
                }
                return <CalcParseFunc>{
                    name: a,
                    expr: parsed,
                    type: CalcParseType.Func,
                    start: next.start,
                    end: nnext.end,
                    error: false
                };
            }else {
                return <ErrorInfo>{
                    location: {
                        start: next.start,
                        end: next.end
                    },
                    message: "Expected '(' when calling a function",
                    error: true
                };
            }
        }else {
            return <ErrorInfo>{
                location: {
                    start: a.start,
                    end: a.end
                },
                message: "Unexpected type: " + CalcLexType[a.type],
                error: true
            };
        }
    }
];

function parse(lexs: CalcLex[], index: RefNumber, expr?: number): CalcParse | ErrorInfo {
    if(!expr) expr = 0;
    return expressionParsers[expr](lexs, expr, index);
}

interface ComplexNumber {
    real: number
    imaginary: number

    error: false
}

function evaluate(value: CalcParse): ComplexNumber | ErrorInfo {
    if(value.type === CalcParseType.Func) {
        const t = value as CalcParseFunc;
        if(t.name.value === "sqrt") {
            const v = evaluate(t.expr);
            if(v.error) return v;
            return <ComplexNumber>{
                real: Math.sqrt(v.real),
                error: false
            };
        }else if(t.name.value === "cos") {
            const v = evaluate(t.expr);
            if(v.error) return v;
            return <ComplexNumber>{
                real: Math.cos(v.real),
                error: false
            };
        }else if(t.name.value === "sin") {
            const v = evaluate(t.expr);
            if(v.error) return v;
            return <ComplexNumber>{
                real: Math.sin(v.real),
                error: false
            };
        }else if(t.name.value === "tan") {
            const v = evaluate(t.expr);
            if(v.error) return v;
            return <ComplexNumber>{
                real: Math.tan(v.real),
                error: false
            };
        }else {
            return <ErrorInfo>{
                location: {
                    start: t.start,
                    end: t.end
                },
                message: "Unexpected function: " + t.name.value,
                error: true
            }
        }
    }else if(value.type === CalcParseType.Expr) {
        const t = value as CalcParseExpr;
        const op = t.op.type;
        let num = evaluate(t.values[0]);
        if(num.error) return num;
        for(let i = 1; i<t.values.length; i++) {
            const right = evaluate(t.values[i]);
            if(right.error) return right;
            if(op === CalcLexType.SymbolAdd) {
                num = <ComplexNumber>{
                    real: num.real + right.real,
                    error: false
                };
            }else if(op === CalcLexType.SymbolSub) {
                num = <ComplexNumber>{
                    real: num.real - right.real,
                    error: false
                };
            }else if(op === CalcLexType.SymbolMul) {
                num = <ComplexNumber>{
                    real: num.real * right.real,
                    error: false
                };
            }else if(op === CalcLexType.SymbolDiv) {
                if(right.real === 0) {
                    return <ErrorInfo>{
                        location: {
                            start: t.op.start,
                            end: t.values[i].end
                        },
                        message: "Cannot divide by 0",
                        error: true
                    }
                }
                num = <ComplexNumber>{
                    real: num.real / right.real,
                    error: false
                };
            }
        }
        return num;
    }else if(value.type === CalcParseType.Num) {
        const t = value as CalcParseNum;
        return <ComplexNumber>{
            real: Number.parseFloat(t.num.value),
            error: false
        };
    }else if(value.type === CalcParseType.StaticNum) {
        const t = value as CalcParseStaticNum;
        return t.num;
    }else if(value.type === CalcParseType.Paren) {
        const t = value as CalcParseParen;
        return evaluate(t.expr);
    }
    return <ComplexNumber>{real: 0, imaginary: 0, error: false};
}

function getOps(value: CalcParse): string[] {
    if(value.type === CalcParseType.Func) {
        const t = value as CalcParseFunc;
        return [...getOps(t.expr), "call " + t.name.value];
    }else if(value.type === CalcParseType.Expr) {
        const t = value as CalcParseExpr;
        const op = t.op.type;
        let num = getOps(t.values[0]);
        for(let i = 1; i<t.values.length; i++) {
            const right = getOps(t.values[i]);
            num.push(...right);
            if(op === CalcLexType.SymbolAdd) {
                num.push("add");
            }else if(op === CalcLexType.SymbolSub) {
                num.push("sub");
            }else if(op === CalcLexType.SymbolMul) {
                num.push("mul");
            }else if(op === CalcLexType.SymbolDiv) {
                num.push("div");
            }
        }
        return num;
    }else if(value.type === CalcParseType.Num) {
        const t = value as CalcParseNum;
        return ["push " + t.num.value];
    }else if(value.type === CalcParseType.StaticNum) {
        const t = value as CalcParseStaticNum;
        return ["push " + t.num];
    }else if(value.type === CalcParseType.Paren) {
        const t = value as CalcParseParen;
        return getOps(t.expr);
    }
    return [];
}

module.exports = <Command>{
  config: {
    name: 'calc',
    description: 'Calculate stuff (beta)',
    usage: '<expr>',
    uses: []
  },
  slashCommand: () => new SlashCommandBuilder().addStringOption(option => option.setName("expr").setDescription("expr").setRequired(true)),
  runInteraction: async (bot, interaction) => {
    let expr = interaction.options.getString("expr", true);
    const lex = expr.startsWith("lex:");
    if(lex) {
        expr = expr.substring(4);
    }
    const ops = expr.startsWith("ops:");
    if(ops) {
        expr = expr.substring(4);
    }

    const uwumsg = `there are bugs, go find them <3 ${(interaction.user.id === "647059365378916372") ? "love you UwU" : ""}\n-EpicPix`;
    
    const lexs: CalcLex[] = [];
    for(let i = 0; i<expr.length; i++) {
        const v = expr.charCodeAt(i);
        let value = expr[i];
        let start = i;
        if(value === '(') {
            lexs.push({ start: start, end: i, value: value, type: CalcLexType.ParenOpen });
        }else if(value === ')') {
            lexs.push({ start: start, end: i, value: value, type: CalcLexType.ParenClose });
        }else if(value === '+') {
            lexs.push({ start: start, end: i, value: value, type: CalcLexType.SymbolAdd });
        }else if(value === '-') {
            const nv = expr.charCodeAt(i + 1);
            if((nv >= 0x30 && v <= 0x39) && lexs[lexs.length - 1]?.type !== CalcLexType.Number) {
                while(i + 1 < expr.length) {
                    const nv = expr.charCodeAt(++i);
                    if((nv >= 0x30 && nv <= 0x39) || nv === 0x2E) {
                        if(nv === 0x2E && value.includes(".")) {
                            await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc failed").setDescription(`\`\`\`\n${expr}\n${" ".repeat(i)}^\nToo many decimal points\`\`\`\n\n${uwumsg}`).setColor("Random")]});
                            return CommandResult.Parameters;
                        }
                        value += expr[i];
                    }else {
                        i--;
                        lexs.push({ start: start, end: i, value: value, type: CalcLexType.Number });
                        break;
                    }
                }
                if(i + 1 >= expr.length) {
                    lexs.push({ start: start, end: i, value: value, type: CalcLexType.Number });
                }
            }else {
                lexs.push({ start: start, end: i, value: value, type: CalcLexType.SymbolSub });
            }
        }else if(value === '*') {
            lexs.push({ start: start, end: i, value: value, type: CalcLexType.SymbolMul });
        }else if(value === '/') {
            lexs.push({ start: start, end: i, value: value, type: CalcLexType.SymbolDiv });
        }else if((v >= 0x30 && v <= 0x39) || v === 0x2E) {
            while(i + 1 < expr.length) {
                const nv = expr.charCodeAt(++i);
                if((nv >= 0x30 && nv <= 0x39) || nv === 0x2E) {
                    if(nv === 0x2E && value.includes(".")) {
                        await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc failed").setDescription(`\`\`\`\n${expr}\n${" ".repeat(i)}^\nToo many decimal points\`\`\`\n\n${uwumsg}`).setColor("Random")]});
                        return CommandResult.Parameters;
                    }
                    value += expr[i];
                }else {
                    i--;
                    lexs.push({ start: start, end: i, value: value, type: CalcLexType.Number });
                    break;
                }
            }
            if(i + 1 >= expr.length) {
                lexs.push({ start: start, end: i, value: value, type: CalcLexType.Number });
            }
        }else if((v >= 0x41 && v <= 0x5A) || (v >= 0x61 && v <= 0x7A)) {
            while(i + 1 < expr.length) {
                const nv = expr.charCodeAt(++i);
                if((nv >= 0x41 && nv <= 0x5A) || (nv >= 0x61 && nv <= 0x7A) || (nv >= 0x30 && nv <= 0x39)) {
                    value += expr[i];
                }else {
                    i--;
                    if(value.toUpperCase() === "PI") {
                        lexs.push({ start: start, end: i, value: "PI", type: CalcLexType.Symbol });
                    }else {
                        lexs.push({ start: start, end: i, value: value, type: CalcLexType.Word });
                    }
                    break;
                }
            }
            if(i + 1 >= expr.length) {
                if(value.toUpperCase() === "PI") {
                    lexs.push({ start: start, end: i, value: "PI", type: CalcLexType.Symbol });
                }else {
                    lexs.push({ start: start, end: i, value: value, type: CalcLexType.Word });
                }
            }
        }else {
            if(value.trim().length === 0) {
                continue;
            }
            if(lexs.length !== 0 && lexs[lexs.length - 1].type === CalcLexType.Unknown) {
                const p = lexs.pop()!;
                start = p.start;
                value = p.value + value;
            }
            lexs.push({start: start, end: i, value: value, type: CalcLexType.Unknown});
        }
    }

    if(lex) {
        await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc lex").setDescription(`\`\`\`\n${expr}\n\`\`\`\`\`\`json\n${JSON.stringify(lexs)}\`\`\`\n\n\n${uwumsg}`).setColor("Random")]});
        return CommandResult.Success;
    }
    
    const d = <CalcParseExpr>{start: 0, end: expr.length, error: false, op: <CalcLex>{start: 0, end: expr.length, type: CalcLexType.SymbolMul, value: "*"}, values: [], type: CalcParseType.Expr};
    
    const loc: RefNumber = {value: 0};
    let p = parse(lexs, loc);
    if(p.error) {
        await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc failed").setDescription(`\`\`\`\n${expr}\n${" ".repeat(p.location.start)}${"^".repeat(p.location.end-p.location.start+1)}\n${p.message}\`\`\`\n\n${uwumsg}`).setColor("Random")]});
        return CommandResult.Parameters;
    }
    d.values.push(p);

    while(loc.value < lexs.length) {
        p = parse(lexs, loc);
        if(p.error) {
            await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc failed").setDescription(`\`\`\`\n${expr}\n${" ".repeat(p.location.start)}${"^".repeat(p.location.end-p.location.start+1)}\n${p.message}\`\`\`\n\n${uwumsg}`).setColor("Random")]});
            return CommandResult.Parameters;
        }
        d.values.push(p);
    }

    if(ops) {
        await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc ops").setDescription(`\`\`\`\n${expr}\n\`\`\`\`\`\`\n${getOps(d).join("\n")}\`\`\`\n\n\n${uwumsg}`).setColor("Random")]});
        return CommandResult.Success;
    }

    let result = evaluate(d);
    if(result.error) {
        await interaction.reply({embeds: [new EmbedBuilder().setTitle("Calc failed").setDescription(`\`\`\`\n${expr}\n${" ".repeat(result.location.start)}${"^".repeat(result.location.end-result.location.start+1)}\n${result.message}\`\`\`\n\n${uwumsg}`).setColor("Random")]});
        return CommandResult.Parameters;
    }

    await interaction.reply({embeds: [new EmbedBuilder().setTitle("expr").setDescription("`" + expr + "`\nResult: `" + result.real + "`\n\n" + uwumsg).setColor("Random")]});
    return CommandResult.Success;
  }
};