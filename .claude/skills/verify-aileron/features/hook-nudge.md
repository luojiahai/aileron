# Hook nudge

`hooks/hooks.json` registers a `UserPromptSubmit` command hook that prints a one-line reminder to apply `/aileron` when a task needs rigor. The user never sees it directly; the model does, on every prompt.

## Sub-features

- `hook-fires` the hook runs on every prompt submission, slash command or plain text.
- `hook-text` the injected text matches `hooks/hooks.json` exactly.

## How to get to it (user POV)

- Submit any prompt in a session with the plugin loaded.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.

- **Plain prompt.** Run `MODEL=haiku MAX_TURNS=1 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive hook-plain -- 'Reply with exactly PONG.'`. `result.txt` is `PONG`.
- **Hook recorded.** `grep -o '"type":"hook_success","hookName":"UserPromptSubmit"[^}]\{0,200\}' <artifacts>/hook-plain.transcript.jsonl` prints one record whose `content` begins `aileron: new task? if a playbook matches`.
- **Text matches source.** Compare that `content` to the string in `hooks/hooks.json`; they are identical.
- **Slash command too.** Reuse any skill drive's transcript (e.g. `skill-invoke.transcript.jsonl`) and run the same grep; the record is present.
- **Proof.** Quote the `hook_success` record from each transcript.

## Gotchas

- The prose form `UserPromptSubmit hook success: aileron: ...` appears in the model's context only for plain prompts. For slash commands it is absent from the text but the `hook_success` record is still written. Assert on the record, not the prose.
- The hook is an `echo`; it cannot fail unless the shell is missing. A missing record means the plugin's hooks did not register (check `hooks/hooks.json` syntax and doctor).
