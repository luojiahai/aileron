---
name: setup-aileron
description: Configure which model tier aileron uses per role and at what reasoning budget. Asks for an effort budget and which tier each role runs on, and writes ~/.claude/aileron-models.md, a per-role override the skills read. Use for /setup-aileron, "configure aileron models", "aileron budget", or changing aileron's model choices.
---

# Setup aileron

Write `~/.claude/aileron-models.md`, a plain markdown file with one line per role and an optional budget line. The aileron skills read it by path with the Read tool and fall back to their inline defaults when the file is absent or a role line is missing, so this is an override layer, not a requirement.

## Steps

### 1. Know the valid values

Claude Code subagents accept a fixed set of `model` values: `fable`, `opus`, `sonnet`, `haiku`, and `inherit`. There is nothing to detect. `inherit` means the role runs on the parent session model (the skill omits `model` on the Agent call). Never write any other tier.

The Agent tool's `effort` accepts `low`, `medium`, `high`, `xhigh`, and `max`. Never write any other effort.

The built-in defaults are `opus` for code, `fable` for judgment and prose, `sonnet` for bulk mechanical work, and the panel `fable, opus, sonnet` for every fan-out role. No budget and no effort suffix is the default, so the skills leave `effort` unset.

### 2. Load current state

If `~/.claude/aileron-models.md` already exists, read it and treat its `budget:` line and its role values as the current choices. Otherwise start from the defaults in step 5. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, tiers, and confirm

**(a) Ask for a budget.** Use `AskUserQuestion` with these five options, and name the current budget when the file records one. With no `budget:` line, say that `unset` matches the skill defaults.

- `unlimited (max effort)`
- `large (xhigh effort)`
- `medium (high effort)`
- `small (medium effort)`
- `unset (no effort set, the session default)`

The budget sets the effort of every entry that carries no `@effort` suffix of its own. It does not rewrite entries. An entry with a suffix keeps it and overrides the budget.

**(b) Ask per role.** Use `AskUserQuestion`, one question per role group, with the current value preselected and the five valid tiers as options. Group the roles so the user answers a handful of questions, not twenty:

- Core tiers: `code`, `judgment and prose`, `bulk`.
- Playbook delegates: `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`.
- `how`: `how explorer`, `how explainer`.
- `why`: `why investigators`, `why synthesizer`.
- `reflect`: `reflect tooling`, `reflect judgment, divergent, synthesizer`.
- Panels: `arena runners`, `arena cross-judge pool`, `architect runners`, `interrogate reviewers`.
- `swarm workers`.

For panel roles the value is a list, and one subagent runs per entry, `inherit` entries included, so the list length sets the fan-out. Offer the default panel, a two-entry panel, a single tier, and free text for a custom list. `arena cross-judge pool` is also a list. Arena picks one value from it, preferring a tier different from the parent session's when possible. `swarm workers` is the model for every worker unless a race or comparison assigns a tier per arm.

Free text may carry a per-entry effort as `tier@effort`, such as `opus@high` or `fable@xhigh, opus@high`.

Accept as-is is always an option. A user who wants everything on the session model answers `inherit` for each role.

**(c) Show the roles and confirm.** Show every role with its tier and the effort it resolves to, and list each line step 2 dropped. Ask whether to accept as-is or change specific roles.

### 4. Validate

Every entry written must be one of the five valid tiers, optionally followed by `@` and one of the five valid efforts. The `budget:` value must be one of the five valid efforts. If an answer is anything else, ask that role again.

### 5. Write the file

Write `~/.claude/aileron-models.md` with a `budget:` line when the user chose a budget, and one line per role, using the same labels the skills use. Leave the `budget:` line out for `unset`. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# aileron model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit` as a value: the role runs on the parent session model (omit `model` on the Agent call). Inherit entries in a panel list still count toward its fan-out.
# `tier@effort` sets that entry's effort. `budget:` sets the effort of every entry without a suffix. With neither, `effort` stays unset.
budget: xhigh
code: opus
judgment and prose: fable
bulk: sonnet
feature, refactoring: sonnet
bug-fix: opus
perf-issue: opus
hillclimb: opus
how explorer: sonnet
how explainer: fable
why investigators: sonnet
why synthesizer: fable
reflect tooling: opus
reflect judgment, divergent, synthesizer: fable
arena runners: fable, opus, sonnet
arena cross-judge pool: fable, opus, sonnet
swarm workers: sonnet
architect runners: fable, opus, sonnet
interrogate reviewers: fable, opus, sonnet
```

Format rules the skills rely on: one role per line, `<role label>: <value>` with panel values comma-separated, `#` lines ignored. Each entry is `<tier>` or `<tier>@<effort>`. `budget: <effort>` is not a role. A skill looks up its role label, splits the value on commas, and splits each entry at `@`. The tier is `model` on the Agent call and the effort is `effort`. An entry with no suffix takes the `budget:` effort, and with no budget the skill leaves `effort` unset. A missing line means the skill's inline default.

### 6. Show the result

Print the written file back to the user and say it applies immediately to every skill that reads it; no restart is needed. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill`. On no, move on without pushing.
