# aileron mode

`/aileron <task>` is the plugin's main entry point. It reads the task, opens a todo list whose first item is reading the inline principles index, picks a playbook, and works the task in that playbook's steps. It is sticky across turns once entered.

## Sub-features

- `mode-invoke` the slash command expands `skills/aileron/SKILL.md` from this checkout.
- `mode-todo` a todo list is opened before any work.
- `mode-playbook` the reply names a playbook that matches the task.
- `mode-sticky` a later plain prompt in the same session still applies the mode (multi-turn; see Gotchas).

## How to get to it (user POV)

- Type `/aileron <task>` (or `/aileron:aileron <task>`) in a Claude Code session with the plugin loaded.
- Ask in plain words to "work in the aileron style" (routes to `aileron-agent`; covered in [agents](./agents.md)).

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.
- Budget for a multi-turn sonnet run.

- **Invoke the mode.** Run `MAX_TURNS=4 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive aileron-mode -- '/aileron:aileron I have a read-only question: what does scripts/sync-version.mjs in the current plugin do? Answer only from what you already know from this prompt; do not read files.'`. `transcript.jsonl` contains `<command-name>/aileron:aileron` and `Base directory for this skill: <repo>/skills/aileron`.
- **Todo list opened.** `tools.txt` contains a `TodoWrite` call whose first item mentions the principles index.
- **Playbook chosen.** `result.txt` (or an assistant text turn in `stream.jsonl`) names the `investigation` playbook for a read-only question.
- **Proof.** Quote the two transcript markers and the `TodoWrite` line; keep `result.txt`.

## Gotchas

- Headless `-p` is one prompt, so `mode-sticky` cannot be proven from a single drive. Use `--resume <session_id>` manually with a second `-p` prompt if you need it; session ids are printed by `drive`.
- The mode can call subagents; with no `ALLOWED_TOOLS` those calls are denied and the run may end early. That still proves invocation and todo; it does not prove playbook execution.
- Reading files from a scratch cwd finds nothing repo-related; keep the task self-contained or the mode will spend turns on empty searches.
