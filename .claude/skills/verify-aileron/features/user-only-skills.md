# User-only skills

Most skills in `skills/` carry `disable-model-invocation: true`: they never auto-trigger and run only when the user types the slash command. The pstack 88d4751 sync added seven: `ketchup` (catch the user up on what changed since their last message), `sharpen` (make a task deeper, then rewrite the prompt), `correct` (turn repeated agent mistakes into checks), `in-your-own-words` (play back the user's goal and problem), `benchmark-checklist` (vet a measured number before reporting it), and the pair `create-formal-verification-skill` / `maintain-formal-verification-skill`. Each expands from this checkout like any skill (see [skill invocation](./skill-invoke.md)) and shapes the reply.

## Sub-features

- `uo-expand` each `/aileron:<skill>` expands its SKILL.md from this checkout.
- `uo-behavior` the reply follows the skill: `in-your-own-words` restates goal and problem and lists open questions; `benchmark-checklist` returns a verdict and a checklist table; `sharpen` answers its numbered questions and ends with a rewritten prompt.
- `uo-routed` `aileron` routes a measured speedup or regression to `benchmark-checklist` (`skills/aileron/SKILL.md`, the trigger list).

## How to get to it (user POV)

- Type `/aileron:<skill> <args>` (or `/<skill>` when unambiguous). Plain requests do not load these skills.
- `benchmark-checklist` is also reached from inside an `/aileron` run when the work measures perf.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.

- **Canary (in-your-own-words).** Run `MAX_TURNS=1 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive in-your-own-words -- '/aileron:in-your-own-words I want the verify script to stop crashing when a plugin in the init event has no version field.'`. Transcript has `<command-name>/aileron:in-your-own-words` and `Base directory for this skill: <repo>/skills/in-your-own-words`. `result.txt` restates the goal and the problem behind it and lists what is still unknown.
- **benchmark-checklist.** Run `MAX_TURNS=2 ... drive benchmark-checklist -- '/aileron:benchmark-checklist I ran the endpoint benchmark once before and once after adding a cache: p50 went from 120ms to 70ms, so caching gives a 42% speedup. Vet this from what I wrote here; do not run any commands.'`. `result.txt` opens with a verdict (`inconclusive` for one run per side) and has a checklist table.
- **sharpen.** Run `MAX_TURNS=1 ... drive sharpen -- '/aileron:sharpen make the login page faster'`. `result.txt` has numbered sections (what a top performer would add, rawest material, methods and tools) and a rewritten prompt.
- **Expansion only (ketchup, correct, formal pair).** Run `MAX_TURNS=1 ... drive <skill> -- '/aileron:<skill>'` for `ketchup`, `correct`, `create-formal-verification-skill`, `maintain-formal-verification-skill`. Assert only the two transcript markers; their real work needs a chat history or a project, which a scratch cwd does not have.
- **Proof.** Quote both markers per skill and the behavior lines from `result.txt`.

## Gotchas

- `benchmark-checklist` tries to measure the machine first (`uptime`, core count). Headless denies `Bash`, and with `MAX_TURNS=1` the turn ends with an empty `result.txt`. Tell it not to run commands and allow two turns.
- `ketchup` in a fresh one-prompt session has nothing to catch up on and replies "Nothing waits on you."; that is correct, not a failure.
- `correct` and the formal verification pair start by listing the cwd with `Bash`. With `MAX_TURNS=1` that call is denied and `result.txt` is empty; the markers still prove expansion. Drive their real work from a scratch copy of a real project only with a budget and `ALLOWED_TOOLS` that cover their reads.
