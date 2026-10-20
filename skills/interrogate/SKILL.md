---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-lens review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Several independent reviewers challenge changes from distinct lenses."
disable-model-invocation: true
---

# Interrogate

Spawn one reviewer per configured panel entry to adversarially review code changes. The adversarial signal comes from independent contexts and distinct primary lenses, not assigned personas. Configured model tiers can add more diversity. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message with the Agent tool, one per entry on the `interrogate reviewers` line in `~/.claude/aileron-models.md`, labeled Reviewer A, B, and so on to match the entry count. If the file or that line is missing, use the table defaults. Lenses cycle through the table in order when the panel is longer than three.

| Subagent | Primary lens | Default model |
|----------|--------------|---------------|
| Reviewer A | correctness and edge cases | `fable` |
| Reviewer B | security and failure modes | `opus` |
| Reviewer C | code quality and maintainability | `sonnet` |

Each reviewer gets `subagent_type: Explore`, `run_in_background: true`, and `model` set to its configured entry, or its table default when there is no configured line. Omit `model` for an `inherit` entry, so that reviewer runs on the parent session model.

If the Agent tool rejects a configured entry, run that reviewer on its table default and say so. Do not block the review on it. Every reviewer still reads the full rubric. The primary lens is where it starts and digs deepest, not a fence.

Read `references/reviewer-prompt.md` and fill in the same template for every reviewer with the stated intent, the diff or file contents, the rubric from `references/rubric.md`, and the code-quality lens from `references/code-quality-review.md`. Fill the primary lens line per reviewer. Set `effort` on each Agent call from the role's entry in the models file, matched to the job, per the Subagents section of the **aileron** skill.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which reviewers raised each one. Findings two or more reviewers raised independently are the highest signal. Read a lone reviewer's finding, but weight it accordingly. Note disagreements. If one reviewer flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the reviewer(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [lens], [model], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which reviewers raised it, why it matters.]

### Consider
[Each: description, which reviewers raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where reviewers agreed and diverged, and what that pattern tells us.]
