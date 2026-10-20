# Agents

`agents/` ships two subagents. `aileron-agent` is a delegate only: the chat that receives `/aileron` runs the playbook and spawns `aileron-agent` for code-writing and helper steps, passing the absolute path of the `aileron` skill's SKILL.md in the prompt. The agent reads that file before working. `comment-sicko` is a comment-deleting reviewer. Both register as `aileron:<name>` and are spawned through the `Agent` tool.

## Sub-features

- `agent-registered` both names appear in the session's agent list.
- `agent-spawn` a prompt asking for one by name results in an `Agent` call with that `subagent_type`.
- `agent-path` given the skill's absolute path, `aileron-agent` reads it with `Read` and answers from its contents.
- `agent-no-preload` the skill text is not in the agent's context until it reads the path; without a path or a read, the agent cannot quote it.

## How to get to it (user POV)

- Ask "have comment-sicko review ..." in a session with the plugin loaded.
- Inside an `/aileron` run, the chat spawns `aileron-agent` for delegated steps. `skills/aileron/SKILL.md` tells it to put its own absolute path in every `aileron-agent` prompt. Users do not route `/aileron` itself to the agent.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID` (its `agents:` line already proves `agent-registered`).
- Budget for a subagent run per drive (about $0.10 to $0.20).

- **Registered.** `doctor` prints `agents:   ['aileron:aileron-agent', 'aileron:comment-sicko']`.
- **Spawn comment-sicko.** Run `ALLOWED_TOOLS=Agent MAX_TURNS=4 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive agent-spawn -- 'Use the aileron:comment-sicko subagent to review this snippet and report its verdict verbatim: function add(a, b) { // add the numbers\n return a + b; }'`. `tools.txt` contains a line with `"tool": "Agent"` and `"subagent_type": "aileron:comment-sicko"`. `result.txt` reports one deletion, the `// add the numbers` comment.
- **Path contract (aileron-agent).** Run `ALLOWED_TOOLS="Agent Read" MAX_TURNS=4 ... drive agent-path -- 'Spawn the aileron:aileron-agent subagent with exactly this task: "The aileron skill is at <repo>/skills/aileron/SKILL.md. Follow your instructions for loading it, then quote the first sentence under its Sticky mode heading and the sentence in its Subagents section that says who runs the playbook." Then report its answer verbatim.'`. `tools.txt` has the `Agent` line and a `Read` of `<repo>/skills/aileron/SKILL.md`. `result.txt` quotes "Once `/aileron` is invoked it stays on for the rest of the session." and "The chat that receives `/aileron` runs the playbook."
- **No preload.** Run `ALLOWED_TOOLS=Agent MAX_TURNS=4 ... drive agent-preload -- 'Spawn the aileron:aileron-agent subagent with exactly this task and nothing else: "Without using any tools, quote the first sentence under the Sticky mode heading of the aileron skill if that skill text is already in your context. If it is not, reply exactly NOT IN CONTEXT." Then report its answer verbatim.'`. `result.txt` reports `NOT IN CONTEXT`.
- **Proof.** Quote each `Agent` tool line, the `Read` line, and the verdict or quotes from `result.txt`.

## Gotchas

- Without `ALLOWED_TOOLS=Agent` the spawn is denied headlessly and the model answers itself; `tools.txt` stays empty. That is a permission artifact, not a plugin failure.
- `tools.txt` lists the subagent's tool calls too (the `Read` above comes from the child), but `drive` copies only the parent's transcript. Find the child's under `~/.claude/projects/` by session if you need its turns.
- `NOT IN CONTEXT` is the expected answer, not a failure: the parent's path is what loads the skill. Agent `skills:` frontmatter cannot preload it, because preloading draws only from model-invocable skills and `disable-model-invocation: true` (which keeps `/aileron` typed-only) excludes it under both `aileron` and `aileron:aileron`. A prompt with no path falls back to the newest `skills/aileron/SKILL.md` under `~/.claude/plugins/`, which is the installed cache, not this checkout.
- The model may pick `general-purpose` if the prompt does not name the subagent exactly; keep the `aileron:` prefix in the prompt.
