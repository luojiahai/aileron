# aileron mode

`/aileron <task>` is the plugin's main entry point. The chat that receives it runs the work itself: it matches the task to a playbook under `skills/aileron/playbooks/`, opens a todo list whose first items are that playbook's steps copied verbatim, and works the task in those steps. It is sticky across turns once entered.

## Sub-features

- `mode-invoke` the slash command expands `skills/aileron/SKILL.md` from this checkout.
- `mode-playbook` the chat reads the playbook file that matches the task (for a read-only question, `playbooks/investigation.md`).
- `mode-todo` a todo list opens with the playbook's steps before task-specific work.
- `mode-sticky` a later plain prompt in the same session still applies the mode (multi-turn; see Gotchas).

## How to get to it (user POV)

- Type `/aileron <task>` (or `/aileron:aileron <task>`) in a Claude Code session with the plugin loaded.
- The skill is `disable-model-invocation`, so plain words like "work in the aileron style" do not load it; only the slash command does. The hook nudge (see [hook nudge](./hook-nudge.md)) reminds the model on later turns.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.
- Budget for a multi-turn sonnet run (about $0.15).

- **Invoke the mode.** Run `ALLOWED_TOOLS="Read Grep Glob TaskCreate TaskUpdate" MAX_TURNS=12 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive aileron-mode -- '/aileron:aileron Investigation: how does the plugin at <repo> keep its version in sync across package.json and the two manifests in .claude-plugin/? Read only files under <repo>/scripts, <repo>/.claude-plugin, and <repo>/package.json.'`. `transcript.jsonl` contains `<command-name>/aileron:aileron` and `Base directory for this skill: <repo>/skills/aileron`.
- **Playbook chosen.** `tools.txt` contains a `Read` of `<repo>/skills/aileron/playbooks/investigation.md` before the task's own reads.
- **Todo list opened.** `tools.txt` contains a `TaskCreate` (or `TodoWrite` on older Claude Code builds) whose items copy the investigation playbook's steps.
- **Proof.** Quote the two transcript markers, the playbook `Read` line, and the todo line if present; keep `result.txt`.

## Gotchas

- Claude Code 2.1.303 has no `TodoWrite`; its todo tools are `TaskCreate`/`TaskUpdate`. Check the init event's `tools` list before asserting a tool name.
- On 2.1.303 with sonnet, two drives read the investigation playbook and answered from it without opening a todo list. Report `mode-todo` as not observed rather than passing it on the playbook read.
- Headless `-p` is one prompt, so `mode-sticky` cannot be proven from a single drive. Use `--resume <session_id>` manually with a second `-p` prompt if you need it; session ids are printed by `drive`.
- A task with no readable files (a scratch cwd, or "don't read files") matches no playbook work and the mode answers directly. Point the task at absolute paths under `<repo>` and allow `Read`.
