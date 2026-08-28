# Release version sync

A release bumps `package.json` (via `changeset version`) and `scripts/sync-version.mjs` copies that version into `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` so the installed plugin reports the released version. CI (`.github/workflows/release.yml`) runs the same `npm run version`.

## Sub-features

- `sync-script` `node scripts/sync-version.mjs` rewrites both manifests to `package.json`'s version and prints one line per changed file.
- `sync-idempotent` a second run changes nothing and prints nothing.
- `sync-validate` the rewritten manifests still pass `claude plugin validate`.
- `sync-loaded` a session loaded from the synced checkout reports the new version in its init event.

## How to get to it (user POV)

- Run `npm run version` after adding a changeset (`npx changeset`), or let the release workflow do it on `main`.
- Run `node scripts/sync-version.mjs` directly after editing `package.json`.

## Driving it with aileron-verify

Preconditions:

- A scratch copy of the repo, never the real checkout: `cp -R <repo> $TMPDIR/aileron-verify-<RUN_ID>/repo` (exclude `.git` if you like; the script does not need it).
- Node on PATH. `npm ci` in the copy only if driving the full `npm run version` path.

- **Bump.** In the copy, set `"version": "9.9.9"` in `package.json` (`node -e` or `sed`). Record `git diff --no-index`-style before/after of both manifests into `<artifacts>/release-before.txt`.
- **Sync.** Run `node scripts/sync-version.mjs` in the copy. stdout is exactly two lines: `.claude-plugin/plugin.json -> 9.9.9` and `.claude-plugin/marketplace.json -> 9.9.9`. Both files now contain `"version": "9.9.9"`; save them to `<artifacts>/release-after.txt`.
- **Idempotent.** Run it again. stdout is empty, exit code `0`.
- **Validate.** Run `claude plugin validate <copy>`. Output contains `Validation passed`.
- **Loaded.** From the scratch cwd run the raw launch line with the copy: `claude --plugin-dir <copy> -p 'Reply with exactly PONG.' --output-format stream-json --verbose --max-turns 1 --model haiku < /dev/null | grep -m1 '"subtype":"init"' > <artifacts>/release-init.json`. That line contains `"name":"aileron"` with `"version":"9.9.9"`.
- **Proof.** Keep before/after files, the two stdout lines, the validate output, and the init line.

## Gotchas

- Never run the sync in the real checkout during verification; it dirties tracked manifests. The copy is the unit; delete it in cleanup.
- The full `npm run version` needs `node_modules` (`npm ci`) and at least one file in `.changeset/`; without a changeset it exits without bumping.
- `doctor` compares the loaded version to `.claude-plugin/plugin.json`, not `package.json`; a checkout where they disagree is a sync that was never run, which is a product finding, not a harness one.
