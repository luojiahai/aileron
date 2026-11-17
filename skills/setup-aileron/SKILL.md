---
name: setup-aileron
description: Configure which model tier aileron uses per role and at what reasoning budget. Asks for an effort budget and which tier each role runs on, and writes ~/.claude/aileron-models.md, a per-role override the skills read. Use for /setup-aileron, "configure aileron models", "aileron budget", or changing aileron's model choices.
---

# Setup aileron

Write `~/.claude/aileron-models.md`, a plain markdown file with one line per role and an optional budget line. The aileron skills read it by path with the Read tool and fall back to their inline defaults when the file is absent or a role line is missing, so this is an override layer, not a requirement.

## Steps

### 1. Know the valid values

Claude Code subagents accept a fixed set of `model` values: `fable`, `opus`, `sonnet`, `haiku`, and `inherit`. There is nothing to detect. `inherit` means the role runs on the parent session model (the skill omits `model` on the Agent call). Never write any other tier.

aileron writes efforts `low`, `medium`, `high`, and `xhigh`. No role runs above `xhigh`, so never write `max` or any other effort.

### 2. Load current state

The default role values are the file shape in step 5. If `~/.claude/aileron-models.md` already exists, read it and treat its `budget:` line and its role values as the current choices. Otherwise start from the defaults. A line whose role is not in step 5, such as `how explorer`, `how explainer`, `why investigators`, `why synthesizer`, `reflect tooling`, `reflect judgment, divergent, synthesizer`, or `architect runners`, is from a retired role. Drop it.

A file without the `# defaults: 1` line comes from an older setup. That setup wrote a line for every role, so some of its values are old defaults, not choices. Before step 3, replace these values:

- `judgment and prose: fable`, `bulk: sonnet`, `feature, refactoring: sonnet`, and `swarm workers: sonnet` take the role's step 5 default.
- A panel list (`arena runners`, `arena cross-judge pool`, `interrogate reviewers`) of exactly `fable, opus, sonnet` takes the role's step 5 list.
- `budget: max` becomes `budget: xhigh`, and an entry's `@max` becomes `@xhigh`.

Every other value is the user's choice and stays, including every `inherit`. Tell the user which values you replaced.

### 3. Budget, tiers, and confirm

**(a) Ask for a budget.** Use `AskUserQuestion` with these three options, and name the current budget when the file records one. With no file, say that `large` matches the skill defaults.

- `large (xhigh effort)`
- `medium (high effort)`
- `small (medium effort)`

**(b) Apply it.** Each role has a target effort, its default's effort moved by the budget. `large` keeps it, `medium` lowers it one step, and `small` lowers it two, on the ladder `xhigh` > `high` > `medium` > `low`. A target at `low` stays there. Most defaults are at `xhigh`, and each budget label names where those land. So `medium` turns `opus@xhigh` into `opus@high` and `opus@high` into `opus@medium`. Write each entry with its target as an `@effort` suffix, panel entries included. A role the user changed keeps its tier and takes the target effort. An `inherit` entry carries no suffix. The `budget:` line records the effort the label names, for entries the user writes without a suffix.

**(c) Ask per role and confirm.** Show every role with its tier and effort, and list each line step 2 dropped or replaced. Ask with `AskUserQuestion` whether to accept as-is or change specific roles, offering the valid tiers at `xhigh` or below. Group the roles so the user answers a handful of questions:

- Core: `code`, `judgment and prose`, `bulk`.
- Playbook delegates: `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`.
- Panels: `arena runners`, `arena cross-judge pool`, `interrogate reviewers`.
- `swarm workers`.

For panel roles the value is a list, and one subagent runs per entry, `inherit` entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena runs one judge, the first entry whose tier differs from the parent session's, so order it by preference. An `inherit` entry never judges. `swarm workers` is the model for every worker unless a race or comparison assigns a tier per arm, and verification runs on it. Fable runs outside a panel only when the user names it for a task or two `opus@xhigh` runs of a brief fail, so say so if the user puts `fable` on a non-panel role.

### 4. Validate

Every entry written must be one of the five valid tiers, optionally followed by `@` and one of the four valid efforts. The `budget:` value must be one of the four valid efforts. If an answer is anything else, ask that role again.

### 5. Write the file

Write `~/.claude/aileron-models.md` with the `# defaults: 1` line, a `budget:` line with the effort the chosen label names, and one line per role, using the same labels the skills use. Overwrite the whole file so re-runs stay idempotent. Shape, at `large`:

```
# aileron model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit` as a value: the role runs on the parent session model (omit `model` on the Agent call). Inherit entries in a panel list still count toward its fan-out.
# `tier@effort` sets that entry's effort. `budget:` sets the effort of every entry without a suffix.
# defaults: 1
budget: xhigh
code: opus@xhigh
judgment and prose: opus@xhigh
bulk: opus@high
feature, refactoring: opus@xhigh
bug-fix: opus@xhigh
perf-issue: opus@xhigh
hillclimb: opus@xhigh
arena runners: fable@high, opus@high, sonnet@high
arena cross-judge pool: fable@high, opus@high, sonnet@high
swarm workers: opus@high
interrogate reviewers: fable@high, opus@high, sonnet@high
```

Format rules the skills rely on: one role per line, `<role label>: <value>` with panel values comma-separated, `#` lines ignored. Each entry is `<tier>` or `<tier>@<effort>`. `budget: <effort>` is not a role. A skill looks up its role label, splits the value on commas, and splits each entry at `@`. The tier is `model` on the Agent call and the effort is `effort`. An entry with no suffix takes the `budget:` effort, and with no budget its default's effort. A missing line means the skill's inline default.

### 6. Show the result

Print the written file back to the user and say it applies immediately to every skill that reads it; no restart is needed. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill`. On no, move on without pushing.
