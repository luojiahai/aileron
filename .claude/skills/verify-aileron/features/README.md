# aileron verification map

Maintained source for verifying aileron's user-facing behavior. Read this index, then the matching feature file, before driving.

## Baseline preconditions

- Logged in to Claude Code (`claude` starts interactively without a `/login` prompt).
- Drive from a scratch cwd outside the repo (the helper does this); never from the repo, where the cached installed copy is also enabled.
- `RUN_ID` set for the run so evidence groups under `.claude/skills/verify-aileron/artifacts/<RUN_ID>/`.
- `aileron-verify.sh doctor` reports one aileron plugin at this checkout's path and version, 44 slash commands, both agents.
- Node ≥ 18 on PATH (for `scripts/sync-version.mjs`).

## Driving conventions

- Every drive is `RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive <label> -- '<prompt>'`; `<prompt>` is literal Claude Code input.
- Skill handles are `/aileron:<skill>`; keep the prefix.
- Default `MODEL=sonnet`, `MAX_TURNS=3`; raise turns only for the mode and agent features.
- Tools needing permission are denied headlessly unless listed in `ALLOWED_TOOLS`.
- Assert on transcript markers first, then on the behavior visible in `result.txt`.

## Proof and skip reporting

- Proof per drive: `prompt.txt`, `tools.txt`, `result.txt`, `transcript.jsonl`, plus the marker lines quoted in the report.
- Release proof: before/after contents of both manifest JSON files and the `claude plugin validate` output.
- Record the feature ID and the entry point with every artifact.
- Report an unreachable path with the command tried and the unmet precondition (not logged in, rate limited, tool denied).
- Never report an entry point verified through a different one.

## Feature entry contract

Each feature file has an H1, one paragraph of user-visible behavior, then four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with aileron-verify`, `Gotchas`. Driving starts with `Preconditions:` and pairs each user action with the exact command and the observable result.

## Features

- [aileron mode](./aileron-mode.md) covers `/aileron` as the entry point: todo list, principles read, playbook selection.
- [Skill invocation](./skill-invoke.md) covers any `/aileron:<skill>` expanding from this checkout and changing the answer.
- [Hook nudge](./hook-nudge.md) covers the `UserPromptSubmit` hook firing on every prompt.
- [Agents](./agents.md) covers registration and spawning of `aileron-agent` and `comment-sicko`.
- [Release version sync](./release-version-sync.md) covers the version bump propagating from `package.json` into both plugin manifests.
