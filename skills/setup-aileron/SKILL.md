---
name: setup-aileron
description: Configure which model tier aileron uses per role. Asks which tier each role runs on and writes ~/.claude/aileron-models.md, a per-role override the skills read. Use for /setup-aileron, "configure aileron models", or changing aileron's model choices.
---

# Setup aileron

Write `~/.claude/aileron-models.md`, a plain markdown file with one line per role. The aileron skills read it by path with the Read tool and fall back to their inline defaults when the file is absent or a role line is missing, so this is an override layer, not a requirement.

## Steps

### 1. Know the valid values

Claude Code subagents accept a fixed set of `model` values: `fable`, `opus`, `sonnet`, `haiku`, and `inherit`. There is nothing to detect. `inherit` means the role runs on the parent session model (the skill omits `model` on the Agent call). Never write any other value.

The built-in defaults are `opus` for code, `fable` for judgment and prose, `sonnet` for bulk mechanical work, and the panel `fable, opus, sonnet` for every fan-out role.

### 2. Load current state

If `~/.claude/aileron-models.md` already exists, read it and treat its values as the current choices. Otherwise start from the defaults in step 5.

### 3. Ask per role

Use `AskUserQuestion`, one question per role group, with the current value preselected and the five valid values as options. Group the roles so the user answers a handful of questions, not twenty:

- Core tiers: `code`, `judgment and prose`, `bulk`.
- Playbook delegates: `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`.
- `how`: `how explorer`, `how explainer`.
- `why`: `why investigators`, `why synthesizer`.
- Panels: `how critics`, `arena runners`, `arena cross-judge pool`, `architect runners`, `interrogate reviewers`.
- `swarm workers`.

For panel roles the value is a list, and one subagent runs per entry, `inherit` entries included, so the list length sets the fan-out. Offer the default panel, a two-entry panel, a single tier, and free text for a custom list. `arena cross-judge pool` is also a list; Arena picks one value from it, preferring a tier different from the parent session's when possible. `swarm workers` is the model for every worker unless a race or comparison assigns a tier per arm.

Accept as-is is always an option. A user who wants everything on the session model answers `inherit` for each role.

### 4. Validate

Every value written must be one of the five valid values. If an answer is anything else, ask that role again. A line pointing at a value the Agent tool rejects breaks every delegation that reads it.

### 5. Write the file

Write `~/.claude/aileron-models.md` with one line per role, using the same labels the skills use. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# aileron model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit` as a value: the role runs on the parent session model (omit `model` on the Agent call). Inherit entries in a panel list still count toward its fan-out.
code: opus
judgment and prose: fable
bulk: sonnet
feature, refactoring: sonnet
bug-fix: opus
perf-issue: opus
hillclimb: opus
how explorer: sonnet
how explainer: fable
how critics: fable, opus, sonnet
why investigators: sonnet
why synthesizer: fable
arena runners: fable, opus, sonnet
arena cross-judge pool: fable, opus, sonnet
swarm workers: sonnet
architect runners: fable, opus, sonnet
interrogate reviewers: fable, opus, sonnet
```

Format rules the skills rely on: one role per line, `<role label>: <value>` with panel values comma-separated, `#` lines ignored. A skill looks up its role label, splits the value on commas, and uses each entry as `model` on the Agent call. A missing line means the skill's inline default.

### 6. Show the result

Print the written file back to the user and say it applies immediately to every skill that reads it; no restart is needed. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.
