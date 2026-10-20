#!/usr/bin/env node

// Lists aileron's skills, playbooks, and agents from the tree and checks what README.md and docs/guide say about
// them: slash commands, relative links and anchors, the README tables, and counts. Also fails on Cursor-only terms
// left behind by an upstream pstack sync. Exits 1 when the docs drift from the tree.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE = "docs/guide";

// Commands that ship with Claude Code, not in this repository. Add a name only after a public Claude Code doc shows it.
const EXTERNAL = new Set(["agents", "config", "hooks", "loop", "model", "plugin", "schedule"]);

// Cursor-only vocabulary from pstack. README.md may name pstack, poteto, and Cursor in its credits.
const CURSOR_TERMS = [
  [/\bTask tool\b|\bTask\(/, "Task tool (use Agent)"],
  [/\bgeneralPurpose\b/, "generalPurpose (use general-purpose)"],
  [/\bAskQuestion\b/, "AskQuestion (use AskUserQuestion)"],
  [/\.cursor\//, ".cursor/ path"],
  [/\.mdc\b/, ".mdc rules file"],
  [/\bBugbot\b/i, "Bugbot (use bot reviewers)"],
  [/\bcursor-team-kit\b/, "cursor-team-kit"],
  [/(?<![\w/])\/goal\b/, "/goal (use /loop)"],
  [/\bOrigin\b/, "Origin forge"],
  [/\bGraphite\b|`gt\s/, "Graphite (use gh)"],
  [/\b(?:grok|composer|cursor-grok)-\d|\binherit-parent\b|\bclaude-(?:opus|sonnet|haiku|fable)-\d/, "model slug (use a tier)"],
  [/\bpoteto(?:-mode|-agent|-help)?\b|\bpstack\b|\bCursor\b/, "pstack or Cursor name", "README.md"],
];
const SCANNED = ["README.md", "agents", "docs", "hooks", "skills"];

const SMALL = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
// "The twenty-three playbooks" claims the whole set. "Three playbooks scale it up" names a subset, so it is not checked.
const CLAIM = /\b(?:(all|has|of|ships|the|with) )?(\d+|[a-z]+(?:-[a-z]+)?) (short )?(skills|principles|playbooks|agents)\b/gi;
const SLASH = /(?<=^|[\s`(|"'>])\/(?:aileron:)?([a-z][a-z0-9-]*)(?![\w/<-])/gm;
const LINK = /\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)/g;
const AGENT = /subagent_type: "([^"]+)"/g;

function names(dir, keep) {
  return existsSync(dir) ? readdirSync(dir).filter((name) => keep(join(dir, name))).sort() : [];
}
const isSkill = (path) => existsSync(join(path, "SKILL.md"));
const isMarkdown = (path) => path.endsWith(".md") && statSync(path).isFile();

function files(path) {
  const full = join(ROOT, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [path];
  return readdirSync(full)
    .filter((name) => name !== "node_modules")
    .flatMap((name) => files(posix.join(path, name)));
}

const skills = names(join(ROOT, "skills"), isSkill);
const principles = skills.filter((name) => name.startsWith("principle-"));
const commands = skills.filter((name) => !name.startsWith("principle-"));
const playbooks = names(join(ROOT, "skills", "aileron", "playbooks"), isMarkdown).map((name) => name.slice(0, -3));
const agents = names(join(ROOT, "agents"), isMarkdown).map((name) => name.slice(0, -3));
const docs = ["README.md", ...names(join(ROOT, GUIDE), isMarkdown).map((name) => `${GUIDE}/${name}`)];
const text = new Map(docs.map((doc) => [doc, readFileSync(join(ROOT, doc), "utf8")]));

const problems = [];
const lineOf = (body, index) => body.slice(0, index).split("\n").length;
const fail = (doc, index, message) => problems.push(`${doc}:${lineOf(text.get(doc), index)} ${message}`);

function toNumber(word) {
  if (/^\d+$/.test(word)) return Number(word);
  const [tens, unit] = word.toLowerCase().split("-");
  if (unit === undefined && SMALL.includes(tens)) return SMALL.indexOf(tens);
  const ones = unit === undefined ? 0 : SMALL.indexOf(unit);
  return TENS.indexOf(tens) > 1 && ones >= 0 && ones < 10 ? TENS.indexOf(tens) * 10 + ones : undefined;
}

function anchors(path) {
  const seen = new Map();
  const found = new Set();
  let fenced = false;
  for (const line of readFileSync(join(ROOT, path), "utf8").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^#{1,6}\s+(.*?)\s*$/);
    if (!heading) continue;
    const plain = heading[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*]/g, "");
    const slug = plain.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    const repeat = seen.get(slug) ?? 0;
    seen.set(slug, repeat + 1);
    found.add(repeat ? `${slug}-${repeat}` : slug);
  }
  return found;
}

const expected = {
  skills: [skills.length, commands.length],
  principles: [principles.length],
  playbooks: [playbooks.length],
  agents: [agents.length],
};
const named = new Map(docs.map((doc) => [doc, new Set()]));
let slashes = 0;
let links = 0;

for (const [doc, body] of text) {
  for (const { 0: match, 1: whole, 2: word, 3: short, 4: noun, index } of body.matchAll(CLAIM)) {
    const claimed = toNumber(word);
    const kind = short ? "principles" : noun.toLowerCase();
    if ((whole || short) && claimed !== undefined && !expected[kind].includes(claimed)) {
      fail(doc, index, `says "${match}", but the tree has ${expected[kind].join(" or ")}`);
    }
  }
  for (const { 1: name, index } of body.matchAll(SLASH)) {
    slashes++;
    if (skills.includes(name)) named.get(doc).add(name);
    else if (!EXTERNAL.has(name)) fail(doc, index, `names /${name}, which no aileron skill or listed built-in provides`);
  }
  for (const { 1: href, index } of body.matchAll(LINK)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    links++;
    const [target, anchor] = href.split("#");
    const path = target ? posix.normalize(posix.join(posix.dirname(doc), target)).replace(/\/$/, "") : doc;
    const skill = path.match(/^skills\/([^/]+)\/SKILL\.md$/);
    if (skill) named.get(doc).add(skill[1]);
    if (!existsSync(join(ROOT, path))) fail(doc, index, `links to ${href}, which does not exist`);
    else if (anchor && path.endsWith(".md") && !anchors(path).has(anchor)) {
      fail(doc, index, `links to ${href}, but ${path} has no heading with that anchor`);
    }
  }
  for (const { 1: name, index } of body.matchAll(AGENT)) {
    if (!agents.includes(name) && !["general-purpose", "Explore"].includes(name)) {
      fail(doc, index, `names subagent_type "${name}", which neither agents/ nor Claude Code ships`);
    }
  }
}

const readme = text.get("README.md");
for (const skill of skills) {
  if (!readme.includes(`(./skills/${skill}/SKILL.md)`)) problems.push(`README.md does not list skill ${skill}`);
}
for (const playbook of playbooks) {
  if (!readme.includes(`(./skills/aileron/playbooks/${playbook}.md)`)) problems.push(`README.md does not list playbook ${playbook}`);
}
for (const agent of agents) {
  if (!readme.includes(`(./agents/${agent}.md)`)) problems.push(`README.md does not link agent ${agent}`);
}

let scanned = 0;
for (const path of SCANNED.flatMap(files)) {
  if (!/\.(md|json|mjs|ts|sh)$/.test(path)) continue;
  scanned++;
  const lines = readFileSync(join(ROOT, path), "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const [pattern, label, exempt] of CURSOR_TERMS) {
      if (exempt !== path && pattern.test(line)) problems.push(`${path}:${index + 1} Cursor term: ${label}`);
    }
  });
}

const inDocs = new Set([...named.values()].flatMap((set) => [...set]));
const inGuide = new Set(docs.filter((doc) => doc !== "README.md").flatMap((doc) => [...named.get(doc)]));
const unnamed = commands.filter((name) => !inGuide.has(name));
console.log(
  `tree: ${skills.length} skills (${commands.length} commands, ${principles.length} principles), ` +
    `${playbooks.length} playbooks, ${agents.length} agents`,
);
console.log(
  `docs: ${docs.length} files, ${slashes} slash mentions, ${links} relative links, ` +
    `${commands.filter((name) => inDocs.has(name)).length} of ${commands.length} commands named, ` +
    `${commands.length - unnamed.length} of ${commands.length} in the guide; ${scanned} files scanned for Cursor terms`,
);
if (unnamed.length > 0) console.log(`note: the guide never names ${unnamed.map((name) => `/${name}`).join(", ")}`);
for (const problem of problems) console.log(`FAIL ${problem}`);
console.log(`${problems.length} problems`);
if (problems.length > 0) process.exit(1);
