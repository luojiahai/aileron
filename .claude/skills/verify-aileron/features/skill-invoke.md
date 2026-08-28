# Skill invocation

Any skill in `skills/` is reachable as `/aileron:<name>`. Claude Code expands the SKILL.md from this checkout into the turn and the answer follows it. `unslop` is the cheapest skill with visibly different output, so it is the canary; the same recipe proves any skill.

## Sub-features

- `skill-expand` the slash command expands the SKILL.md from this checkout, not the installed cache.
- `skill-behavior` the answer follows the skill (for unslop: the filler is cut and the rewrite is shorter).
- `skill-args` the text after the command reaches the skill as its argument.

## How to get to it (user POV)

- Type `/aileron:<skill> <args>` in a session with the plugin loaded.
- Type `/<skill> <args>` when the name is not ambiguous with another plugin's skill.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.

- **Invoke unslop.** Run `RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive skill-invoke -- '/aileron:unslop In today'"'"'s fast-paced world, it is important to note that this function serves as a robust solution which seamlessly leverages caching.'`. `drive` prints `turns: 1 error: False`.
- **Expanded from checkout.** `grep -o '<command-name>[^<]*' <artifacts>/skill-invoke.transcript.jsonl` prints `<command-name>/aileron:unslop`; `grep -o 'Base directory for this skill: [^ \\]*'` prints a path under this repo's `skills/unslop`.
- **Behavior.** `result.txt` contains a rewrite that drops "fast-paced world", "it is important to note", "robust", "seamlessly", and is shorter than the input.
- **Argument passed.** The transcript's user turn shows the original sentence after the command name.
- **Proof.** Quote the two marker lines and the rewrite from `result.txt`.

## Gotchas

- Drive from inside the repo and `Base directory` may point at `~/.claude/plugins/cache/aileron/...`; that proves the cached copy, not your edit. The helper's scratch cwd avoids this.
- `haiku` sometimes ignores the skill body and answers plainly; use `sonnet` for behavior checks.
- The stream-json output has no user turn; only `transcript.jsonl` shows the expansion.
- Skills marked `disable-model-invocation` (e.g. `maintain-verification-skill`) still expand when typed by the user; they just never auto-trigger.
