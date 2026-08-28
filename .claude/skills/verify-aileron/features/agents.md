# Agents

`agents/` ships two subagents: `aileron-agent` (the routing target for "work in the aileron style", with the `aileron` skill preloaded) and `comment-sicko` (a comment-deleting reviewer). Both register as `aileron:<name>` and can be spawned by the model through the `Agent` tool.

## Sub-features

- `agent-registered` both names appear in the session's agent list.
- `agent-spawn` a prompt asking for one by name results in an `Agent` call with that `subagent_type`.
- `agent-preload` `aileron-agent` reads the aileron skill before working (visible in its own transcript).

## How to get to it (user POV)

- Ask "use the aileron-agent to ..." or "have comment-sicko review ..." in a session with the plugin loaded.
- `/aileron` itself routes to `aileron-agent` for delegated work.

## Driving it with aileron-verify

Preconditions:

- Doctor passes for `RUN_ID` (its `agents:` line already proves `agent-registered`).
- Budget for a subagent run.

- **Registered.** `doctor` prints `agents:   ['aileron:aileron-agent', 'aileron:comment-sicko']`.
- **Spawn comment-sicko.** Run `ALLOWED_TOOLS=Agent MAX_TURNS=4 RUN_ID=<id> .claude/skills/verify-aileron/scripts/aileron-verify.sh drive agent-spawn -- 'Use the aileron:comment-sicko subagent to review this snippet and report its verdict verbatim: function add(a, b) { // add the numbers\n return a + b; }'`. `tools.txt` contains a line with `"tool": "Agent"` and `"subagent_type": "aileron:comment-sicko"`.
- **Verdict returned.** `result.txt` reports the subagent's opinion of the comment (it wants it deleted).
- **Preload (aileron-agent).** Run the same drive with `aileron:aileron-agent` and a small task; the subagent's transcript, found via `grep -l aileron-agent ~/.claude/projects/*/*.jsonl` newest-first, contains `Base directory for this skill: <repo>/skills/aileron`.
- **Proof.** Quote the `Agent` tool line and the verdict.

## Gotchas

- Without `ALLOWED_TOOLS=Agent` the spawn is denied headlessly and the model answers itself; `tools.txt` stays empty. That is a permission artifact, not a plugin failure.
- Subagent transcripts are separate session files; `drive` copies only the parent's. Copy the child's by hand if you need `agent-preload` evidence.
- The model may pick `general-purpose` if the prompt does not name the subagent exactly; keep the `aileron:` prefix in the prompt.
