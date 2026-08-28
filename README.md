# aileron

There's a growing sense that AI writes too much slop code. Throughput without quality is not a goal worth aspiring to. If you want to go fast, go deep first.

**aileron is a set of rigorous engineering skills for Claude Code.** It turns one agent into a real engineering team. The goal is not to maximize LOC, in fact it's the opposite. aileron helps you write less, but higher quality code.

**aileron gives you fearless parallelism.** When you can go deep on one agent and trust it to write good, verifiable code, you can truly parallelize with confidence. Start multiple sessions with `/aileron` and trust that they'll apply rigorous engineering principles to their work.

**aileron is a sticky mode.** Once entered it stays on across turns, applying itself when a playbook matches or the task needs rigor and staying out of the way otherwise. Opt out any time by saying so.

Fork it. Improve it. Make it yours. PRs are welcome!

## Install

```bash
/plugin marketplace add luojiahai/aileron
/plugin install aileron@aileron
```

For local development, run Claude Code from a checkout with `claude --plugin-dir .`.

## Release

Every user-facing change adds a changeset with `npx changeset`. Merging to `main` opens or updates a "chore: version packages" PR. Merging that PR bumps the version in `package.json` and syncs it into `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. It also publishes a `vX.Y.Z` tag and a GitHub release.

## Get started

Two steps:

1. Run [`/setup-aileron`](./skills/setup-aileron/SKILL.md) and choose which models you want per role.
2. Use [`/aileron`](./skills/aileron/SKILL.md) whenever you're doing anything that requires rigor.

New here? The [aileron guide](./docs/guide/README.md) walks you through a first real task, from setup and prompting through verification and overnight runs.

That's it. The other skills are situational; the mode skill uses them for you as needed. Out of the box the mode splits work by role: precisely specified code goes to opus, prose and judgment go to fable, and bulk mechanical work goes to sonnet. The default panel is fable / opus / sonnet. [`/setup-aileron`](./skills/setup-aileron/SKILL.md) changes any of it.

## Usage

Use [`/aileron`](./skills/aileron/SKILL.md) at the start of a task. It reads your request, picks from a set of playbooks, and runs the other skills as the steps need them.

### Just use [`/aileron`](./skills/aileron/SKILL.md)

This skill is the main shortcut. Use it whenever you need the agent to do rigorous engineering work. It comes with twenty-two playbooks:

```
/aileron this pr has a subtle bug where the scroll drifts every 750ms even when idle. repro
first, then fix and verify.
```

```
/aileron i'm going to bed. land the stack even if ci flakes. i want everything merged by
morning.
```

<details>
<summary>The twenty-two playbooks</summary>

| Playbook | For |
|---|---|
| [Investigation](./skills/aileron/playbooks/investigation.md) | A read-only question. How does X work, why was Y built this way, are we sure. |
| [Bug fix](./skills/aileron/playbooks/bug-fix.md) | Reproduce a defect, root-cause it, and fix with runtime evidence. |
| [Perf](./skills/aileron/playbooks/perf-issue.md) | Trace a measured slowness and improve it against a baseline. |
| [Hillclimb](./skills/aileron/playbooks/hillclimb.md) | Sustained, scientific improvement of one metric against a target, looping hypotheses with before/after measurement and one commit per accepted win. |
| [Runtime forensics](./skills/aileron/playbooks/runtime-forensics.md) | Diagnose a live symptom (leak, idle-CPU spin, glitch) from instrumentation. |
| [Trace forensics](./skills/aileron/playbooks/trace-forensics.md) | Diagnose a captured profiling artifact (cpuprofile, trace, spindump, heap snapshot). |
| [Feature](./skills/aileron/playbooks/feature.md) | New or changed behavior, built from a named data shape. |
| [Refactoring](./skills/aileron/playbooks/refactoring.md) | A behavior-preserving change to structure or shape. |
| [Prototype](./skills/aileron/playbooks/prototype.md) | A throwaway sketch to make a design or behavioral decision cheaply, or to settle an empirical fork by observing it. |
| [Visual parity](./skills/aileron/playbooks/visual-parity.md) | Pixel-exact UI equivalence between two implementations. |
| [Authoring a skill](./skills/aileron/playbooks/authoring-a-skill.md) | Writing or editing a SKILL.md. |
| [Eval](./skills/aileron/playbooks/eval.md) | Test how a skill or prompt change affects agent behavior, blinded. |
| [Babysit](./skills/aileron/playbooks/babysit.md) | Drive a PR or a stack to merge-ready. Conflicts, review threads, CI. |
| [Shipping](./skills/aileron/playbooks/shipping.md) | Independently verify a green stack, then land the contiguous verified run with Graphite merge-when-ready. |
| [Autonomous run](./skills/aileron/playbooks/autonomous-run.md) | Drive a long task to completion without stopping. |
| [Orchestrate](./skills/aileron/playbooks/orchestrate.md) | A standing project handed to one coordinator chat. Multi-day, many stacked PRs, fleets of subagents. |
| [autopilot-full](./skills/aileron/playbooks/autopilot-full.md) | Run independent PRs to merged with one owner per PR and root verification of each merge-ready head. |
| [autopilot-stack](./skills/aileron/playbooks/autopilot-stack.md) | Build and verify one linear Graphite stack for the operator to review and land. |
| [Session pickup](./skills/aileron/playbooks/session-pickup.md) | Resume or take over a prior agent's in-flight work. |
| [Pause safely](./skills/aileron/playbooks/pause-safely.md) | Suspend in-flight work cleanly so it can be resumed later. |
| [Multi-phase plan](./skills/aileron/playbooks/multi-phase-plan.md) | Work that spans phases or stacked PRs. |
| [Worktree cleanup](./skills/aileron/playbooks/worktree-cleanup.md) | Reclaim disk by pruning merged or abandoned worktrees and stale iOS simulators, safety-gated. |

</details>

Every playbook ends by invoking [opening a PR](./skills/aileron/playbooks/opening-a-pr.md).

When invoked it:

1. Opens a todo list. The first item is reading the inline principles index in the skill.
2. Matches your task to a [playbook](./skills/aileron/playbooks/) and copies the steps in verbatim.
3. Routes to the other skills as the steps fire.
4. Writes unslopped replies framed for the consumer and the maintainer.

The full rules and playbooks live in [`skills/aileron/SKILL.md`](./skills/aileron/SKILL.md).

[`/aileron`](./skills/aileron/SKILL.md) works extremely well with Claude Code's `/loop` command. You can keep an agent working for many hours without sacrificing rigor.

Claude Code's plan mode works with aileron too. If you want a plan, [`/aileron`](./skills/aileron/SKILL.md) covers it, but it's not a default. The best spec is code.

## Skills

[`/aileron`](./skills/aileron/SKILL.md) runs most of these for you when a step needs them (`how`, `why`, `architect`, `arena`, `swarm`, `interrogate`, `unslop`, `no-comments`, `technical-writing`, `tdd`, and the principles). The table below is for when you want one directly:

```
/how do we cancel runs? do we have an n+1 when we look up every run to cancel?
```

```
/interrogate review this pr.
```

Every skill is also reachable with the plugin prefix, as `/aileron:<skill>`, when an unqualified name is ambiguous.

<details>
<summary>All skills</summary>

| Skill | Use it when |
|---|---|
| [`/aileron`](./skills/aileron/SKILL.md) | Default entry point for any non-trivial task. |
| [`/how`](./skills/how/SKILL.md) | You want a walkthrough of how a subsystem works. |
| [`/why`](./skills/why/SKILL.md) | You want to know why something was built this way. Discovers available MCPs at run time and queries each evidence category in parallel (source control, issue tracker, long-form docs, real-time chat, infra observability, error tracking, analytics warehouse). |
| [`/recall`](./skills/recall/SKILL.md) | You're starting or resuming work and want your recent context on a topic rebuilt from your own chat history and the shared record, handed back as a tight current-state brief. |
| [`/blast-radius`](./skills/blast-radius/SKILL.md) | You have a small-looking change and want to know what else it could break, with the one fact it's safe because of proven by running code, not asserted. |
| [`/architect`](./skills/architect/SKILL.md) | You're about to write code that crosses a function boundary and want the caller's usage, types, and module shape settled first. |
| [`/arena`](./skills/arena/SKILL.md) | You want N parallel attempts at the same thing, then to grab the best parts of each. |
| [`/swarm`](./skills/swarm/SKILL.md) | You want N parallel workers across different slices or races, then one aggregated report. |
| [`/interrogate`](./skills/interrogate/SKILL.md) | You have a diff and want several reviewers with distinct lenses to try to break it, including a strict code-quality lens. |
| [`/automate-me`](./skills/automate-me/SKILL.md) | You want your own `-mode` skill, drafted from how you've actually worked. |
| [`/setup-aileron`](./skills/setup-aileron/SKILL.md) | You want to pick which models aileron uses per role. Writes `~/.claude/aileron-models.md`. |
| [`/reflect`](./skills/reflect/SKILL.md) | A long task landed and you want the recipe captured as a skill edit. |
| [`/teach`](./skills/teach/SKILL.md) | You want to actually understand a change or subsystem, not just have it summarized. Runs how + why and weaves one plain explanation, built up diagram by diagram. |
| [`/tdd`](./skills/tdd/SKILL.md) | You're fixing a bug and there's a cheap local test path. Write the failing test first, then the fix. |
| [`/no-comments`](./skills/no-comments/SKILL.md) | Strip comments before review; spawns Comment Sicko, fixes accepted findings, offers encodings for claimed constraints. |
| [`/typescript-best-practices`](./skills/typescript-best-practices/SKILL.md) | You're reading or editing TypeScript. Grounds the type-system-discipline principle in syntax. |
| [`/figure-it-out`](./skills/figure-it-out/SKILL.md) | No bundled playbook fits. Designs a rigorous, auditable playbook for the task. |
| [`/show-me-your-work`](./skills/show-me-your-work/SKILL.md) | You want a reviewable decision trail. Logs decisions to a TSV you can commit. |
| [`/create-verification-skill`](./skills/create-verification-skill/SKILL.md) | Your project has no scripted way to prove app behavior. Generates a project-local verify skill with a feature map, for any language or platform. |
| [`/maintain-verification-skill`](./skills/maintain-verification-skill/SKILL.md) | Your verify skill's feature map has drifted from the app. Source wave + one live pass, at most one PR of proven corrections. |
| [`/unslop`](./skills/unslop/SKILL.md) | You're cleaning up writing. Removes AI tells. |
| [`/bro`](./skills/bro/SKILL.md) | You want the last message restated in plain human language, no jargon. |
| [`/technical-writing`](./skills/technical-writing/SKILL.md) | Layered doc standard (Diátaxis + Google developer style + STE + Global English) for docs, RFCs, readmes, PR descriptions, commit messages. |

</details>

### Examples

Mostly you type [`/aileron`](./skills/aileron/SKILL.md) at the start of a task and let it route to a playbook. The other skills fire as the steps need them. A few are worth reaching for directly.

<details>
<summary>All the examples</summary>

```
bug fix:           /aileron this pr has a subtle bug where the scroll drifts every 750ms even
                   when idle. repro first, then fix and verify.
perf:              /aileron a big list takes a second or two to load even though we virtualize.
                   run a cpu trace and tell me why.
feature:           /aileron build a small feature behind a feature flag. verify it really works.
prototype:         /aileron build two prototypes of the markdown renderer so we can compare.
                   spawn an agent for each.
multi-phase:       /aileron open source these skills as a plugin. nothing internal leaks, work
                   in a temp dir, show me the dependency graph first.
overnight run:     /aileron i'm going to bed. land the stack even if ci flakes. i want
                   everything merged by morning.
babysit:           /aileron check on pr 123. anything outstanding?
visual parity:     /aileron the row spacing is too tall when this flag is on. the second image
                   is correct. repro and fix until it matches.
figure it out:     /aileron i'm stepping away. migrate every caller from the synchronous store
                   to the new async one, keeping behavior identical. i want to trust it was done
                   right when i'm back.
how:               /how do we cancel runs? do we have an n+1 when we look up every run to cancel?
why:               /why is this feature flag not on yet?
architect:         design this instrumentation to be high signal with no false positives. /architect
                   this first.
arena:             /arena take my prompt to the arena verbatim. i want to compare their proposals
                   with yours.
swarm:             /swarm check every package under packages/ against its check.sh. one worker per
                   package. one report.
interrogate:       /interrogate review this pr.
tdd:               /tdd implement
unslop:            can we unslop and tighten the new changes?
reflect:           /reflect that took too long. capture what we learned so the next run doesn't
                   repeat it.
show-me-your-work: /show-me-your-work keep a decision trail i can review when i'm back.
automate-me:       /automate-me
```

</details>

## The `aileron-agent` and Comment Sicko subagents

aileron also ships a subagent that runs the aileron style end to end. Spawn it from a parent agent via [`subagent_type: "aileron-agent"`](./agents/aileron-agent.md). It reads `aileron` in full, including its inline principles index, before doing any work. Substituting `general-purpose` skips that read and drifts.

[`/aileron`](./skills/aileron/SKILL.md) and [`subagent_type: "aileron-agent"`](./agents/aileron-agent.md) route through the same wrapper.

aileron also ships [Comment Sicko](./agents/comment-sicko.md), a read-only comment reviewer available as `subagent_type: "comment-sicko"`. Usually invoke it through [`/no-comments`](./skills/no-comments/SKILL.md), not directly.

## Principles

Twenty-one short skills, one principle each. `aileron` indexes them inline and reads that index at task start. The standalone files are there so other skills can reference a principle by name, and so the index can point at the full rule for each.

<details>
<summary>All twenty-one principles</summary>

| Principle | Group | Rule |
|---|---|---|
| [laziness-protocol](./skills/principle-laziness-protocol/SKILL.md) | Core | Bias toward deletion and the smallest change that solves the problem. |
| [foundational-thinking](./skills/principle-foundational-thinking/SKILL.md) | Core | Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the data structures right so downstream code becomes obvious. |
| [redesign-from-first-principles](./skills/principle-redesign-from-first-principles/SKILL.md) | Core | Redesign as if the requirement had been a foundational assumption from day one, instead of bolting it on. |
| [subtract-before-you-add](./skills/principle-subtract-before-you-add/SKILL.md) | Core | Remove dead weight, redundant validators, and stub references first, then build on the simpler base. |
| [minimize-reader-load](./skills/principle-minimize-reader-load/SKILL.md) | Core | Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope. |
| [outcome-oriented-execution](./skills/principle-outcome-oriented-execution/SKILL.md) | Core | Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code. |
| [experience-first](./skills/principle-experience-first/SKILL.md) | Core | Choose user delight over implementation convenience; ship fewer polished features over more rough ones. |
| [exhaust-the-design-space](./skills/principle-exhaust-the-design-space/SKILL.md) | Core | Build 2-3 competing prototypes and compare side by side before committing. |
| [build-the-lever](./skills/principle-build-the-lever/SKILL.md) | Core | Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun. |
| [model-the-domain](./skills/principle-model-the-domain/SKILL.md) | Architecture | Encode the domain in a structure instead of scattered conditionals. |
| [boundary-discipline](./skills/principle-boundary-discipline/SKILL.md) | Architecture | Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions. |
| [type-system-discipline](./skills/principle-type-system-discipline/SKILL.md) | Architecture | Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, refuse to lie to the compiler, exhaust variants, derive from authoritative schemas. |
| [make-operations-idempotent](./skills/principle-make-operations-idempotent/SKILL.md) | Architecture | Converge to the same end state regardless of partial prior runs. |
| [migrate-callers-then-delete-legacy-apis](./skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | Architecture | Migrate callers and delete the old API in the same wave instead of preserving compatibility layers. |
| [separate-before-serializing-shared-state](./skills/principle-separate-before-serializing-shared-state/SKILL.md) | Architecture | Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant. |
| [prove-it-works](./skills/principle-prove-it-works/SKILL.md) | Verification | Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'. |
| [fix-root-causes](./skills/principle-fix-root-causes/SKILL.md) | Verification | Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards that silence crashes. |
| [sequence-verifiable-units](./skills/principle-sequence-verifiable-units/SKILL.md) | Verification | Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer. |
| [guard-the-context-window](./skills/principle-guard-the-context-window/SKILL.md) | Delegation | Route bulk to subagents; keep summaries in the main thread, not raw payloads. |
| [never-block-on-the-human](./skills/principle-never-block-on-the-human/SKILL.md) | Delegation | Proceed, present the result, let the human course-correct after the fact; reserve confirmation for irreversible actions. |
| [encode-lessons-in-structure](./skills/principle-encode-lessons-in-structure/SKILL.md) | Meta | Encode the rule as a lint, metadata flag, runtime check, or script instead of more text. |

</details>

## Make it yours

`aileron` is one style. You may not want exactly that.

Type [`/automate-me`](./skills/automate-me/SKILL.md). It mines your recent transcripts, drafts a `<your-name>-mode` skill from how you've actually worked, and routes through aileron underneath. It writes the skill to `~/.claude/skills/<your-name>-mode/SKILL.md`, so you keep aileron as the base and end up with your own routing skill alongside `/aileron`.

## Models

Models are configurable per role. [`/setup-aileron`](./skills/setup-aileron/SKILL.md) writes a small markdown file at `~/.claude/aileron-models.md` mapping each role to a model. Every skill reads that file by path and falls back to built-in defaults when the file or a role line is absent, so you override only what you want.

The defaults:

| Role | Default |
|---|---|
| Code (precisely specified changes) | `opus` |
| Judgment and prose | `fable` |
| Bulk mechanical work | `sonnet` |
| Panels (critics, arena runners, cross-judges, interrogate reviewers, swarm workers) | `fable`, `opus`, `sonnet` |

Valid values are `fable`, `opus`, `sonnet`, `haiku`, and `inherit`. A role set to `inherit` runs on the parent session's model.

## Credits

aileron is a port of poteto's [pstack](https://github.com/poteto/pstack) to Claude Code. MIT.

## License

MIT
