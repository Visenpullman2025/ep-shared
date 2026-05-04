#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[name] = "true";
      continue;
    }
    args[name] = next;
    i += 1;
  }
  return args;
}

function bangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function cell(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function usage() {
  console.log(`Usage:
node rules/growth-hook.mjs \\
  --source "用户反馈/测试失败/代码审计" \\
  --type "API 闸门/开发风格/规则追加" \\
  --level "必须/应该/可以" \\
  --scope "全局/ExpatTH/ep/epbkend" \\
  --rule "一条短规则" \\
  --trigger "什么时候触发" \\
  --check "如何检查" \\
  --destination "PROJECT_RULES.md/全局 skill/项目文档"

Optional:
  --date YYYY-MM-DD
  --file /absolute/path/to/PROJECT_RULES.md
  --status candidate/promoted/rejected`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  usage();
  process.exit(0);
}

const required = ["source", "type", "level", "scope", "rule", "trigger", "check", "destination"];
const missing = required.filter((key) => !args[key]);
if (missing.length > 0) {
  console.error(`[growth-hook] Missing required args: ${missing.join(", ")}`);
  usage();
  process.exit(1);
}

const allowedStatuses = new Set(["candidate", "promoted", "rejected"]);
const status = args.status || "candidate";
if (!allowedStatuses.has(status)) {
  console.error(`[growth-hook] Invalid status: ${status}`);
  process.exit(1);
}

const rulesPath = args.file
  ? path.resolve(args.file)
  : path.resolve(__dirname, "..", "PROJECT_RULES.md");

const date = args.date || bangkokDate();
const row = `| ${cell(date)} | ${cell(args.source)} | ${cell(args.type)} | ${cell(args.level)} | ${cell(args.scope)} | ${cell(args.rule)} | ${cell(args.trigger)} | ${cell(args.check)} | ${cell(args.destination)} | ${cell(status)} |`;

let content = fs.readFileSync(rulesPath, "utf8");

if (!/^##\s+\d+\.\s+规则成长候选/m.test(content)) {
  content = `${content.trimEnd()}

## 15. 规则成长候选

候选状态只能是 \`candidate\`、\`promoted\`、\`rejected\`。

| 日期 | 来源 | 类别 | 等级 | 范围 | 规则 | 触发 | 检查方式 | 去向 | 状态 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | -------- | ---- | ---- |
${row}
`;
} else {
  content = `${content.trimEnd()}
${row}
`;
}

fs.writeFileSync(rulesPath, content);
console.log(`[growth-hook] Added candidate to ${rulesPath}`);
