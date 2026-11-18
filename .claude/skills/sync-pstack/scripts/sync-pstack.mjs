#!/usr/bin/env node

// Three-way merges upstream pstack changes into aileron. Usage:
//   node .claude/skills/sync-pstack/scripts/sync-pstack.mjs <cursor/plugins checkout> <base sha> <target ref>
// base is the commit the last sync reached (README.md "Last synced"). Each file pstack changed between base and target
// is mapped to its aileron path and merged with git merge-file, leaving conflict markers to resolve by hand. Content is
// not translated: Cursor names in merged or added text are caught afterwards by npm run check.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const [upstream, base, target] = process.argv.slice(2);
if (!upstream || !base || !target) {
  console.error("usage: sync-pstack.mjs <cursor/plugins checkout> <base sha> <target ref>");
  process.exit(2);
}

// Cursor-only parts of pstack that aileron does not carry.
const SKIPPED = [
  /^\.cursor-plugin\//,
  /^plugin\.json$/,
  /^assets\//,
  /^automations\//,
  /^docs\/harness\//,
  /^skills\/(?:poteto-help|make-bot-ui)\//,
];
const RENAMES = [
  [/^skills\/poteto-mode\//, "skills/aileron/"],
  [/^skills\/setup-pstack\//, "skills/setup-aileron/"],
  [/^agents\/poteto-agent\.md$/, "agents/aileron-agent.md"],
  [/^docs\/guide\/02-poteto-mode\.md$/, "docs/guide/02-aileron.md"],
];

const git = (...args) => execFileSync("git", ["-C", upstream, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
const show = (ref, path) => execFileSync("git", ["-C", upstream, "show", `${ref}:pstack/${path}`], { maxBuffer: 1 << 28 });

const scratch = mkdtempSync(join(tmpdir(), "sync-pstack-"));
const report = { merged: [], conflicted: [], added: [], deleted: [], skipped: [], absent: [], collided: [] };

const changes = git("diff", "--no-renames", "--name-status", base, target, "--", "pstack")
  .trim()
  .split("\n")
  .map((line) => line.split("\t"))
  .map(([status, path]) => [status, path.replace(/^pstack\//, "")]);

for (const [status, path] of changes) {
  if (SKIPPED.some((re) => re.test(path))) {
    report.skipped.push(path);
    continue;
  }
  const mapped = RENAMES.reduce((p, [re, to]) => p.replace(re, to), path);
  const ours = join(ROOT, mapped);
  const present = existsSync(ours);

  if (status === "D") {
    if (present) rmSync(ours);
    report[present ? "deleted" : "absent"].push(mapped);
  } else if (status === "A") {
    if (present) {
      report.collided.push(mapped);
      continue;
    }
    mkdirSync(dirname(ours), { recursive: true });
    const mode = git("ls-tree", target, `pstack/${path}`).split(" ")[0];
    writeFileSync(ours, show(target, path), { mode: mode === "100755" ? 0o755 : 0o644 });
    report.added.push(mapped);
  } else if (!present) {
    report.absent.push(mapped);
  } else {
    const b = join(scratch, "base");
    const t = join(scratch, "theirs");
    writeFileSync(b, show(base, path));
    writeFileSync(t, show(target, path));
    try {
      execFileSync("git", ["merge-file", "-L", "aileron", "-L", `pstack ${base}`, "-L", `pstack ${target}`, ours, b, t]);
      report.merged.push(mapped);
    } catch (error) {
      if (error.status > 0 && error.status < 128) report.conflicted.push(`${mapped} (${error.status})`);
      else throw error;
    }
  }
}
rmSync(scratch, { recursive: true });

for (const [kind, paths] of Object.entries(report)) {
  console.log(`\n${kind}: ${paths.length}`);
  if (kind !== "added" || paths.length < 40) for (const p of paths) console.log(`  ${p}`);
  else console.log(`  ${[...new Set(paths.map((p) => p.split("/").slice(0, 2).join("/")))].join("\n  ")}`);
}
