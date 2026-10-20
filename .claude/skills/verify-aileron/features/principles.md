# Principles

Each principle is a leaf skill `skills/principle-<name>/SKILL.md`, user-only (`disable-model-invocation: true`). `skills/aileron/SKILL.md` carries an inline Principles index with each trigger, and the mode reads a leaf when it applies that principle; a reply may cite only principles whose leaf it read this session. The pstack 88d4751 sync added three: `attack-the-premise` (after two fixes sharing one premise fail the same gate, test the premise), `explain-the-number` (find what limits a measured number before trusting it), and `test-behavior-not-implementation` (assert what users of the code observe).

## Sub-features

- `pr-expand` `/aileron:principle-<name>` expands the leaf from this checkout.
- `pr-behavior` the reply applies the principle to the user's situation.
- `pr-indexed` the three new principles appear in the aileron index (`Attack the Premise` under Core, the other two under Verification).

## How to get to it (user POV)

- Type `/aileron:principle-<name> <situation>`.
- Inside an `/aileron` run, the mode opens the leaf when its trigger fires.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID`.

- **explain-the-number.** Run `MAX_TURNS=1 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive principle-explain-the-number -- '/aileron:principle-explain-the-number Our eval score rose from 61% to 74% after a prompt change, measured on one run of 50 cases. Should I report it?'`. Transcript has `<command-name>/aileron:principle-explain-the-number` and `Base directory for this skill: <repo>/skills/principle-explain-the-number`. `result.txt` says not yet and names the noise (one run, about ±6.5 points standard error on 50 cases).
- **attack-the-premise.** Run `MAX_TURNS=1 ... drive principle-attack -- '/aileron:principle-attack-the-premise Two fixes that both assumed the cache key was stale have failed the same test. What next?'`. Both markers present; `result.txt` writes the shared premise down and proposes a direct test of it before a third fix.
- **test-behavior-not-implementation.** Run `MAX_TURNS=1 ... drive principle-test-behavior -- '/aileron:principle-test-behavior-not-implementation Should my test assert that save() calls db.insert exactly once?'`. Both markers present; `result.txt` steers the assertion to observable state (the saved record can be read back).
- **Indexed.** `grep -n 'Attack the Premise\|Explain the Number\|Test Behavior' <repo>/skills/aileron/SKILL.md` prints three index lines. This is a source check; the live proof of the index is the mode drive in [aileron mode](./aileron-mode.md).
- **Proof.** Quote both markers per drive and the applied advice from `result.txt`.

## Gotchas

- `haiku` tends to answer the question without applying the leaf; use `sonnet`.
- The doctor's slash-command count includes every principle; a missing leaf shows up there first as a count below 54.
