# Set up aileron

In this page you install the plugin, pick which models aileron uses, and run your first task. Setup is two commands plus a short conversation.

## Install the plugin

In a Claude Code session, add the marketplace and install the plugin:

```text
/plugin marketplace add luojiahai/aileron
/plugin install aileron@aileron
```

Claude Code confirms the plugin is installed. Its skills are available as `/aileron:<skill>`, and the short form `/<skill>` also works whenever the name is unambiguous. This guide writes the short form.

## Pick your models

Run:

```text
/setup-aileron
```

[`/setup-aileron`](../../skills/setup-aileron/SKILL.md) asks for a reasoning budget, shows you each role (code delegates, judgment, the review panels) with its default, and asks what you want. Answer the questions. It writes `~/.claude/aileron-models.md`, a small markdown file every aileron skill reads by path.

The defaults are the same as the `large` budget. Code, prose, and judgment run on `opus@xhigh`. Trivial mechanical edits and swarm workers run on `opus@high`. The review panels run one seat each on `fable@high`, `opus@high`, and `sonnet@high`. No role runs above `xhigh`. Outside a review panel, fable runs only when you name it for a task or after two `opus@xhigh` runs of the same brief fail their check. `medium` lowers each role one level and `small` lowers it two, and both spend fewer tokens. A single entry can set its own effort with an `@effort` suffix, as in `opus@high`.

You only override what you care about. A role with no line in the file keeps the skill's default. To restore a default, delete that role's line. If the file is missing entirely, every skill falls back to its defaults. A rerun of `/setup-aileron` keeps any role whose tier differs from the default. When a default changes, a file written before the change still pins the old default until you run `/setup-aileron` again. That run replaces the old defaults it recognizes, tells you which, and keeps your other choices. To drop a pin it does not recognize, delete that role's line or the file first.

You might be wondering how to keep a role on whatever model the session is using. Set it to `inherit` and aileron omits the subagent `model` field, so the subagent runs on your session model. `inherit` is not a model slug. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Accept the verification offers, or don't

At the end of setup, `/setup-aileron` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.claude/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers it in depth.

If you're new to aileron, say yes. An agent that can check its own work keeps going until the check passes. An agent that can't hands every result back to you to check by hand. Of everything in this guide, the verification skill pays off the most.

Then setup offers once to generate a formal verification skill with [`/create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md), unless the project already has one. Tests check the cases someone thought to write. A formal verification skill checks one key property of your code, such as "a job never runs twice at once", in every case within a stated scope. Say yes when your code has concurrency, retries, a state machine, or a parser, where a bug is costly and tests rarely reach the case that breaks. Otherwise say no, and run it later if that changes. [Verify and ship](./06-verify-and-ship.md#prove-a-property-with-a-formal-verification-skill) covers it.

After setup, start a new session so the skills load fresh.

## Keep the cost in check

aileron spends extra tokens on subagents and review panels. That's the price of the rigor. To spend fewer:

- Rerun `/setup-aileron` and pick a smaller reasoning budget or cheaper models. A strong model in the main chat with cheaper, faster models in the code roles is a good split.
- Set a role to `inherit` so it runs on the session's own model.
- Shorten a panel list. Each entry runs one subagent.
- Save `/aileron` for work that needs rigor. A small, obvious edit doesn't.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/aileron add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt.

From here you can type normal follow-ups. `/aileron` is sticky. It stays on for the session until you opt out by saying so.

Next: [Route work through `/aileron`](./02-aileron.md).
