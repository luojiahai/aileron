import { readFileSync, writeFileSync } from "node:fs";

const resolve = (file) => new URL(`../${file}`, import.meta.url);
const { version } = JSON.parse(readFileSync(resolve("package.json"), "utf8"));

const consumers = [
  { file: ".claude-plugin/plugin.json", set: (json, version) => { json.version = version; } },
  { file: ".claude-plugin/marketplace.json", set: (json, version) => { json.plugins[0].version = version; } },
];

for (const { file, set } of consumers) {
  const path = resolve(file);
  const before = readFileSync(path, "utf8");
  const json = JSON.parse(before);
  set(json, version);
  const after = `${JSON.stringify(json, null, 2)}\n`;
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`${file} -> ${version}`);
  }
}
