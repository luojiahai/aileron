---
name: sync-pstack
description: Sync aileron with a newer upstream pstack commit from cursor/plugins. Three-way merges the upstream changes, translates Cursor terms to Claude Code, resolves conflicts, verifies, and opens the PR. Use when asked to sync, update from, or pull in upstream pstack. Also the shared contract for subagents that resolve sync conflicts.
---

# Sync pstack

aileron is a fork of pstack, which lives in the `pstack/` folder of `cursor/plugins`. The local checkout of `cursor/plugins` is `~/code/plugins`. Each sync takes every upstream change since the last synced commit, writes it in Claude Code terms, and keeps aileron's own decisions.

In this file, "base" is the last synced commit and "target" is the upstream commit you sync to.

## Recipe

1. Read the base from the `Last synced with pstack at` line in `README.md`.
2. Run `git -C ~/code/plugins fetch origin`. The target is `origin/main` unless the user named a commit. Take its seven-character sha with `git -C ~/code/plugins rev-parse --short=7 <target>`.
3. Check that the base is an ancestor of the target with `git -C ~/code/plugins merge-base --is-ancestor <base> <target>`. Read the upstream intent with `git -C ~/code/plugins log <base>..<target> -- pstack`. Stop if it lists nothing.
4. Work in a worktree off `main` on the branch `sync-pstack-<target sha>`.
5. Run `node .claude/skills/sync-pstack/scripts/sync-pstack.mjs ~/code/plugins <base> <target>` from the repo root. Save its report to a scratch file, such as `$TMPDIR/sync-pstack-report.txt`, because the run cannot be repeated on the merged tree. The report has these sections:
   - `merged`: clean three-way merges. Cursor terms the script does not rename can still be in them.
   - `conflicted`: each file with its count of conflict hunks and conflict lines.
   - `added`: new upstream files, written with the script's renames. With 40 or more, the report lists only their top two path levels. List the files with `git status --short --untracked-files=all`.
   - `deleted`: files upstream deleted. The script deleted aileron's copy.
   - `skipped`: Cursor-only upstream paths. See [What aileron skips](#what-aileron-skips).
   - `absent`: upstream changed a file that aileron does not have. Port the change only if aileron needs it.
   - `collided`: upstream added a file at a path aileron already uses. Merge it by hand.
6. Resolve every conflict per [Resolving a conflict](#resolving-a-conflict). Resolve the lead files listed under [Fan-out](#fan-out) first, even when you do not fan out, because the other files cite their rules and defaults. With more than about ten conflicted files, fan out.
7. Run `npm run check` and fix each problem it lists, until it reports `0 problems`. It lists leftover Cursor terms, broken links, unknown slash commands, README table drift, and wrong counts. Fix a Cursor term per the [translation table](#translation-table).
8. Make sure no conflict marker is left. `git grep -n -e '^<<<<<<< aileron' -e '^>>>>>>> pstack'` prints nothing.
9. Run the tests. Install dependencies first, because `node_modules/` is gitignored.
   - `cd skills/aileron/scripts && bun install && bun test watch-pr`
   - `cd skills/statechart/scripts && npm install --no-package-lock && TMPDIR="$(cd "$TMPDIR" && pwd -P)/" npm test`. On macOS, `TMPDIR` is a `/var/...` symlink, and one upstream symlink test fails unless `TMPDIR` is the resolved `/private/var/...` path. Tests that need `TLA2TOOLS` skip.
10. Run the verify-aileron doctor per `.claude/skills/verify-aileron/SKILL.md`. For each behavior change, drive the changed skill or agent there too. A behavior change is a new or changed route in `skills/aileron/SKILL.md`, a models-file format change, a kickoff change, or a hook change. If skills or playbooks were added or removed, update the counts in `.claude/skills/verify-aileron/SKILL.md` and its feature map.
11. Update the `Last synced with pstack at` line in `README.md` with the target sha, its commit link, and the target's commit date from `git -C ~/code/plugins log -1 --format=%cs <target>`.
12. Add a changeset at `.changeset/sync-pstack-<target sha>.md`. Use `"aileron": minor` when user-visible behavior changed, `patch` otherwise. Write the summary for plugin users.
13. Before each commit, run the **unslop** skill on the diff's prose and the **no-comments** skill on its comments. Commit in this order, skipping an empty unit:
    1. `chore(sync-pstack): ...` for changes to this skill or its script, such as a new rename or a new skipped path.
    2. `feat(skills): sync skills and agents with pstack <target sha>` for `skills/` and `agents/`.
    3. `docs: sync README and guide with pstack <target sha>` for `README.md` and `docs/`.
    4. `chore: add changeset and refresh verify-aileron for the pstack sync`.
14. Open the PR per `skills/aileron/playbooks/opening-a-pr.md`. Title it `feat(skills): sync with pstack <target sha>`. Put each new divergence from upstream under `## Tradeoffs`, and add it to the [divergence log](#deliberate-divergences) in the same PR. `## Verification` lists the script report counts, `npm run check`, both test runs, the doctor, and each drive.

## Resolving a conflict

The script runs `git merge-file`. A conflict looks like this:

```text
<<<<<<< aileron
aileron's current text
=======
upstream's target text, after the script's renames
>>>>>>> pstack <target>
```

To see what upstream changed in the file, run `git -C ~/code/plugins diff <base> <target> -- pstack/<upstream path>`. Upstream paths are aileron paths before the path map in the script's `PATHS`. To see why upstream changed it, run `git -C ~/code/plugins log <base>..<target> -- pstack/<upstream path>`.

Resolve each conflict with these rules:

- Take upstream's change in meaning and wording, written in aileron's Claude Code terms.
- A passage is one paragraph or one list item.
- Keep aileron-only content that upstream never had. Examples are sticky mode, the `UserPromptSubmit` hook, `/loop`, `isolation: worktree`, and `Explore`. Drop it only when upstream deleted the passage that held it.
- When upstream deleted or shortened a passage, delete or shorten aileron's version the same way. When upstream rewrote a passage, keep an aileron-only sentence that states a rule or a divergence's reason. Drop one that only explained wording upstream replaced.
- An upstream sentence that aileron dropped in an earlier sync stays dropped unless upstream changed it.
- Match the density of upstream's new text.
- Keep each [deliberate divergence](#deliberate-divergences).
- Write the prose you change per the **unslop** skill. Use short declarative sentences, no em dash, and no mid-sentence colon. Leave aileron text that neither side changed.
- A resolved sentence that states what another file does must match that file after its own resolution. When you change a default or a rule, `git grep` it and change every copy together. Model defaults live in the Subagents section of `skills/aileron/SKILL.md`, in steps 3 to 5 of `skills/setup-aileron/SKILL.md`, in `skills/arena/SKILL.md`, `skills/swarm/SKILL.md`, and `skills/interrogate/SKILL.md`, and in `README.md` and `docs/guide/01-setup.md`. A resolver limited to some files lists each copy outside its files in its report, and the lead changes them.
- While a lead file is still conflicted, take the new defaults from its upstream side, translated per [Models](#models).

A clean merge can still carry an upstream Cursor term, and `npm run check` finds most of them.

## Translation table

The script's `TERMS` table renames the entries marked "script" before the merge, in both upstream sides and in added files. Translate the other entries by hand.

| Cursor (pstack) | aileron | |
| --- | --- | --- |
| `poteto-mode`, `/poteto-mode` | `aileron`, `/aileron` | script |
| `poteto-agent` | `aileron-agent` | script |
| `setup-pstack` | `setup-aileron` | script |
| `generalPurpose` | `general-purpose` | script |
| `AskQuestion` | `AskUserQuestion` | script |
| `~/.cursor/rules/pstack-models.mdc` | `~/.claude/aileron-models.md` | script |
| `.cursor/skills/`, `~/.cursor/skills/` | `.claude/skills/`, `~/.claude/skills/` | script |
| `Task` tool, `Task` call, `Task` spawn, `Task` subagent | `Agent` tool, Agent call, Agent spawn, Agent subagent | script |
| "the rule", meaning the models file | "the models file" | |
| `auto`, `inherit-parent` as a model | `inherit`, which means "omit `model`" | |
| "reasoning level" | effort | |
| "fast or standard speed" | drop | |
| spawn `generalPurpose` because `poteto-agent` pins a model | drop. See the divergence log | |
| "pstack", meaning this plugin | "aileron" | |
| `readonly: true`, a readonly subagent | `subagent_type: "Explore"` | |
| `environment: "cloud"` | `isolation: worktree` | |
| `environment: "local"`, `cloud_base_branch` | drop, or tell the worker to check out the branch in its worktree | |
| `/deslop` from `cursor-team-kit` | the **unslop** skill on the diff's prose and the **no-comments** skill on its comments | |
| `control-ui`, `control-cli` from `cursor-team-kit`, "the control skill" | the project's `verify-<app>` skill from **create-verification-skill**, driving the real app | |
| Bugbot | bot reviewers, such as Claude code review and CodeRabbit | |
| Cursor's `/goal` | `/loop` | |
| Cursor's built-in babysit skill | drop the mention | |
| Origin forge, `origin pr ...`, Graphite, `gt` | drop. aileron uses `gh` only | |
| Cursor Automations, Projects, Project workers, cloud agents as workers | drop, or say Agent subagents | |
| `.cursor-plugin/plugin.json` | `.claude-plugin/plugin.json` | |
| transcripts under `agent-transcripts/` or `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.claude/projects/<slug>/<session>.jsonl`. The layouts differ, so rewrite the whole path, including in `skills/aileron/scripts/worktree-audit.sh` | |
| cloud-agent URL | cloud session URL | |
| "todolist tool" | "todolist" | |
| a model slug such as `claude-opus-5-5-xhigh-fast` | a tier, per [Models](#models) | |

When a new Cursor term has exactly one aileron spelling and is a whole token, add it to `TERMS` in the script and mark it "script" here. Keep anything that needs judgment out of `TERMS`. Add a term that `npm run check` should catch to `CURSOR_TERMS` in `scripts/check-aileron-docs.mjs`.

## Models

Upstream names Cursor model slugs. aileron names Claude Code tiers. Translate each upstream model change with these rules, then read the current values in the Subagents section of `skills/aileron/SKILL.md` and in `skills/setup-aileron/SKILL.md`. Never copy values from this file.

- A model is `<tier>` or `<tier>@<effort>`, in the models file and in defaults written in prose. The tiers are `fable`, `opus`, `sonnet`, `haiku`, and `inherit`. Effort is a value the Agent tool accepts, such as `low`, `medium`, `high`, or `xhigh`. Never write a slug.
- A Claude slug becomes its tier and effort. `claude-opus-5-5-xhigh-fast` becomes `opus@xhigh`. There is no `-fast`.
- `auto` and `inherit-parent` become `inherit`, which means "omit `model`".
- A seat on another vendor's model in a panel becomes `sonnet` at the seat's effort. aileron panels get their variety from different tiers.
- A rule about a different vendor becomes a rule about a different tier from the parent session's.
- A model family is a tier. "The nearest valid slug of the same family" becomes "another tier".
- A cross-judge pool lists every panel tier, so some entry differs from any parent session's tier.
- Take upstream's caps, budgets, and gates in tier terms. An example is upstream's rule that its top model runs outside a panel only on request.
- Take upstream's role renames and retirements. Keep the aileron-only roles `code` and `bulk`.
- aileron's `# defaults: N` marker counts aileron's own default generations, not upstream's. When a sync changes a default that the models file pins, bump the marker. Add the old values to the replacement list in `skills/setup-aileron/SKILL.md`.

## Deliberate divergences

Keep these unless the user decides otherwise. Add a row for each new divergence, with its reason.

| aileron | upstream | Reason |
| --- | --- | --- |
| `aileron-agent` has `model: inherit` | pins Opus | aileron passes `model` on every spawn. |
| Arena's cross-judge is the first pool entry whose tier differs from the parent session's | first entry from another vendor | Every aileron model is Claude, so a vendor rule has no meaning. |
| `code` and `bulk` roles | neither role | aileron routes generic code delegates and trivial mechanical edits on their own lines. |
| Panels seat `sonnet` | seat Gemini | Claude Code runs Claude models only. |
| `how`, `why`, `unslop`, and `typescript-best-practices` are model-invocable | user-invoked | Kept since the 88d4751 sync, so the model loads them without a slash command. |
| The models file has a `# defaults: N` marker that counts aileron's own generations | counts upstream's | aileron's default history differs from upstream's. |
| Sticky mode and its `UserPromptSubmit` hook | neither | `/aileron` stays on for the session, and the hook repeats the reminder on each prompt. |
| Claude Code terms throughout, Opus-first defaults | Cursor terms | aileron is a Claude Code plugin. |

## What aileron skips

`SKIPPED` and `PATHS` in the script are the source of truth. When upstream adds a Cursor-only part, add it to `SKIPPED` and to this list.

- `.cursor-plugin/` and `plugin.json`: Cursor manifests. aileron has `.claude-plugin/`.
- `assets/`: Cursor marketplace art.
- `automations/`: Cursor Automations.
- `docs/harness/`: notes on running pstack in other harnesses.
- `skills/poteto-help/` and `skills/make-bot-ui/`: Cursor-only skills.

The script maps `skills/poteto-mode/` to `skills/aileron/`, `skills/setup-pstack/` to `skills/setup-aileron/`, `agents/poteto-agent.md` to `agents/aileron-agent.md`, and `docs/guide/02-poteto-mode.md` to `docs/guide/02-aileron.md`. Every other path is the same in both trees.

## Fan-out

Split the conflicted and Cursor-term files into disjoint groups. This skill is every resolver's contract.

- The lead keeps `skills/aileron/SKILL.md`, `skills/setup-aileron/`, `skills/arena/`, `skills/swarm/`, `skills/interrogate/`, and `agents/`. These files hold the model and subagent rules that the other files cite.
- Group 1 is `skills/aileron/playbooks/` and `skills/aileron/scripts/`.
- Group 2 is every other file under `skills/`, new skills included.
- Group 3 is `README.md` and `docs/`.

Resolve the lead's files first, so the groups can match the new rules. Then start one subagent per group in the background, in this worktree, without `isolation: worktree`. The merge results are uncommitted, so a new worktree would not have them. Use the `judgment and prose` model from `~/.claude/aileron-models.md`. Each kickoff starts with the worker line from the aileron skill and then says:

```text
Read <repo>/.claude/skills/sync-pstack/SKILL.md. It is your contract.
Base is <base>. Target is <target>. Upstream checkout is ~/code/plugins.
Resolve every conflict and every Cursor term in these files: <list>.
Edit only these files. Do not commit.
Done means no conflict marker is left and `npm run check` lists no problem in your files.
```

When the groups finish, read each group's diff with `git diff -- <files>` before you continue with step 7.
