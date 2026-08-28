---
name: verify-aileron
description: "Launch and drive the aileron Claude Code plugin from this checkout through headless `claude -p --plugin-dir`, and capture transcript evidence that its skills, hook, and agents load and behave. Use when asked to verify, prove, or screenshot-equivalent a change to any skill, agent, hook, or manifest in this repo, or to check the plugin still installs."
---

# Verify aileron

aileron is a Claude Code plugin: 44 skills under `skills/`, two agents under `agents/`, one `UserPromptSubmit` hook in `hooks/hooks.json`, manifests in `.claude-plugin/`. There is no server or UI. The "app" is Claude Code with this checkout loaded via `--plugin-dir`, and the user surface is slash commands (`/aileron:<skill>`), the hook nudge on every prompt, and the agents. Secondary surface: the release scripts (`scripts/sync-version.mjs`, changesets).

Everything below runs through one helper, `scripts/aileron-verify.sh`. Read `features/README.md` for the map before driving.

## Launch

Nothing stays running. Each drive is one headless session:

```
claude --plugin-dir <repo> -p '<prompt>' --output-format stream-json --verbose --max-turns N --model sonnet < /dev/null
```

run from a scratch cwd outside the repo. The helper does this:

```
RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive <label> -- '<prompt>'
```

Ready signal: the first stream line with `"subtype":"init"` lists `plugins` containing `{"name":"aileron","path":"<repo>","version":"<plugin.json version>"}`. Teardown is `cleanup` (below).

Why a scratch cwd, not the repo: the installed `aileron@aileron` (a cached copy, currently 0.1.0) is enabled at *local* scope for this repo via `.claude/settings.local.json`. A session started inside the repo loads both copies and skill invocations may resolve to the cache, not your edits. From any other cwd only `--plugin-dir` loads. Do not set `CLAUDE_CONFIG_DIR` to an empty dir for isolation: auth lives in the real config and the session fails with `Not logged in`.

Knobs (env): `RUN_ID` (groups evidence; default pid), `MODEL` (default `sonnet`; `haiku` is fine for load checks, unreliable for following skills), `MAX_TURNS` (default 3), `ALLOWED_TOOLS` (space-separated, e.g. `"Agent TodoWrite"`; headless runs in default permission mode, so unlisted tools that need permission are denied, not prompted).

## Doctor

```
RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh doctor
```

Read-only. Passes when: `claude plugin validate` accepts the manifests; a one-turn haiku probe's init event shows exactly one `aileron` plugin, at this checkout's path, at the version in `.claude-plugin/plugin.json`; `aileron:*` slash commands are present; agents are exactly `aileron:aileron-agent` and `aileron:comment-sicko`. Run it first, and again after anything surprising. `no init event` means not logged in or the CLI failed to start; run `claude` interactively once.

## Drive

Prompts are literal Claude Code input. A skill is driven by its slash command with the plugin prefix: `/aileron:unslop <text>`, `/aileron:aileron <task>`. Unprefixed names (`/unslop`) also resolve when unambiguous but the prefixed form is the stable handle. The hook is driven by any prompt at all. Agents are driven by a prompt that asks for the subagent by name with `ALLOWED_TOOLS=Agent`.

Each drive writes to `$ARTIFACTS/<label>.*` (default `.claude/skills/verify-aileron/artifacts/<RUN_ID>/`, gitignored):

- `prompt.txt` the exact input
- `stream.jsonl` the stream-json output (assistant turns, tool uses, result)
- `tools.txt` one line per tool call
- `result.txt` the final assistant text
- `transcript.jsonl` a copy of Claude Code's own session file from `~/.claude/projects/`, which is the only place the user turn, the hook output, and the expanded skill body are recorded
- `stderr.txt`

Stable markers to assert in `transcript.jsonl`:

- skill loaded from this checkout: `<command-name>/aileron:<skill>` and `Base directory for this skill: <repo>/skills/<skill>`
- hook fired: a record with `"type":"hook_success","hookName":"UserPromptSubmit"` whose `content` begins `aileron: new task?`
- agent registered: init event `agents` list; agent used: a `tool_use` of `Agent` with `subagent_type` `aileron:<agent>` in `tools.txt`

## Evidence

A proof exercises the real user path: the slash command a user would type, a plain prompt for the hook, an Agent spawn for agents. Never verify a skill by `cat`-ing its SKILL.md; that proves the file exists, not that Claude Code registers and expands it. Capture both the action (`prompt.txt`, `tools.txt`) and the resulting state (`result.txt`, transcript markers). For behavior claims (the skill changed the answer), state what the output shows and quote it; the model's output is nondeterministic, so assert on markers and on the presence of the expected behavior, not exact wording.

Side effects to check alongside: for the release feature, the two manifest files rewritten on disk and `claude plugin validate` still passing. For any drive with `ALLOWED_TOOLS` including `Write`/`Edit`/`Bash`, diff the scratch cwd afterward; nothing in the repo should change from a drive.

Cost: each drive is a paid API call (unslop on sonnet ≈ $0.05; the `/aileron` mode drive and agent spawns cost several times that). Prefer `MAX_TURNS` small and one drive per feature.

## Cleanup

```
RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh cleanup
```

Kills only leftover headless sessions started with this checkout's `--plugin-dir` (drives are synchronous, so normally none), removes the scratch cwd `$TMPDIR/aileron-verify-<RUN_ID>` and Claude Code's transcript directory for that cwd. Evidence under `.claude/skills/verify-aileron/artifacts/<RUN_ID>/` is kept; confirm it after cleanup with `ls`. Run cleanup after failed iterations too.

## Helpers

`scripts/aileron-verify.sh` (executable): `doctor`, `drive <label> -- <prompt>`, `cleanup`. Env knobs are listed at the top of the script and in Launch.

## Feature map

`features/README.md` indexes one file per user-facing feature. Drive every entry point a feature file lists before calling the feature verified. Maintain it with `/maintain-verification-skill`.
