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

[`/setup-aileron`](../../skills/setup-aileron/SKILL.md) shows you each role (code delegates, judgment, the review panels) with its default, and asks what you want. Answer the questions. It writes `~/.claude/aileron-models.md`, a small markdown file every aileron skill reads by path.

You only override what you care about. A role with no line in the file keeps the skill's default. The built-in defaults are `opus` for code, `fable` for prose and judgment, `sonnet` for bulk mechanical work, and a `[fable, opus, sonnet]` panel for the review roles. To restore a default later, delete that role's line, or just run `/setup-aileron` again. If the file is missing entirely, every skill falls back to its defaults.

You might be wondering how to keep a role on whatever model the session is using. Set it to `inherit` and aileron omits the subagent `model` field, so the subagent runs on your session model. `inherit` is not a model slug. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Accept the verification offer, or don't

At the end of setup, `/setup-aileron` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.claude/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

After setup, start a new session so the skills load fresh.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/aileron add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. The first item is always "read the Principles section". The rest are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/aileron` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/aileron` is sticky. It stays on for the session until you opt out by saying so.

Next: [Route work through `/aileron`](./02-aileron.md).
