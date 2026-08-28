#!/usr/bin/env bash
# Drives the aileron plugin through headless Claude Code, loaded from this checkout.
#
#   aileron-verify.sh doctor                         read-only: is this checkout loadable and the only aileron in the session?
#   aileron-verify.sh drive <label> [--] <prompt>    one headless session; evidence lands in $ARTIFACTS/<label>.*
#   aileron-verify.sh cleanup                        remove scratch cwd + copied transcripts' source; evidence stays
#
# Env: RUN_ID (default: pid), MODEL (default sonnet), MAX_TURNS (default 3),
#      ALLOWED_TOOLS (space-separated, default none), ARTIFACTS (default <skill>/artifacts/<RUN_ID>)
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$SKILL_DIR/../../.." && pwd)"
RUN_ID="${RUN_ID:-$$}"
ARTIFACTS="${ARTIFACTS:-$SKILL_DIR/artifacts/$RUN_ID}"
SCRATCH="${TMPDIR%/}/aileron-verify-$RUN_ID"
SCRATCH="${SCRATCH:-/tmp/aileron-verify-$RUN_ID}"
CWD="$SCRATCH/cwd"
MODEL="${MODEL:-sonnet}"
MAX_TURNS="${MAX_TURNS:-3}"

expected_version() { node -e 'console.log(require(process.argv[1]).version)' "$REPO/.claude-plugin/plugin.json"; }

init_probe() {
  # One-turn haiku session; prints the system/init event only.
  mkdir -p "$CWD"
  (cd "$CWD" && claude --plugin-dir "$REPO" -p 'Reply with exactly PONG.' \
      --output-format stream-json --verbose --max-turns 1 --model haiku < /dev/null) \
    | grep -m1 '"subtype":"init"' || true
}

doctor() {
  echo "repo:     $REPO"
  echo "scratch:  $SCRATCH"
  echo "artifacts:$ARTIFACTS"
  claude plugin validate "$REPO" >/dev/null && echo "manifest: valid" || { echo "manifest: INVALID"; exit 1; }
  local want; want="$(expected_version)"
  local init; init="$(init_probe)"
  [ -n "$init" ] || { echo "probe:    no init event (not logged in? run: claude /login)"; exit 1; }
  printf '%s' "$init" > "$SCRATCH/init.json"
  python3 - "$want" "$REPO" "$SCRATCH/init.json" <<'PY'
import json,sys
want, repo, path = sys.argv[1], sys.argv[2], sys.argv[3]
m = json.load(open(path))
ps = m.get("plugins", [])
ok = True
mine = [p for p in ps if p.get("name") == "aileron"]
print("plugins:  " + str([(p["name"], p["version"], p["path"]) for p in ps]))
if len(mine) != 1: print("FAIL: expected exactly one aileron plugin"); ok = False
elif mine[0]["path"] != repo: print("FAIL: aileron loaded from " + mine[0]["path"] + ", not this checkout"); ok = False
elif mine[0]["version"] != want: print("FAIL: loaded version " + mine[0]["version"] + " != plugin.json " + want); ok = False
cmds = [c for c in m.get("slash_commands", []) if c.startswith("aileron:")]
ags = [a for a in m.get("agents", []) if a.startswith("aileron:")]
print("skills:   %d aileron:* slash commands" % len(cmds))
print("agents:   " + str(ags))
if not cmds or set(ags) != {"aileron:aileron-agent", "aileron:comment-sicko"}: print("FAIL: skills/agents not registered"); ok = False
print("doctor:   OK" if ok else "doctor:   FAIL")
sys.exit(0 if ok else 1)
PY
}

drive() {
  local label="$1"; shift
  [ "${1:-}" = "--" ] && shift
  local prompt="$*"
  mkdir -p "$CWD" "$ARTIFACTS"
  local stream="$ARTIFACTS/$label.stream.jsonl"
  local args=(--plugin-dir "$REPO" -p "$prompt" --output-format stream-json --verbose --max-turns "$MAX_TURNS" --model "$MODEL")
  [ -n "${ALLOWED_TOOLS:-}" ] && args+=(--allowedTools $ALLOWED_TOOLS)
  printf '%s\n' "$prompt" > "$ARTIFACTS/$label.prompt.txt"
  (cd "$CWD" && claude "${args[@]}" < /dev/null) > "$stream" 2> "$ARTIFACTS/$label.stderr.txt" || true
  local session; session="$(grep -o '"session_id":"[^"]*"' "$stream" | head -1 | cut -d'"' -f4)"
  python3 - "$stream" "$ARTIFACTS/$label" <<'PY'
import json,sys
stream,out=sys.argv[1],sys.argv[2]
res=None
with open(out+".tools.txt","w") as tools:
    for line in open(stream):
        try: m=json.loads(line)
        except: continue
        if m.get("type")=="assistant":
            for b in m["message"]["content"]:
                if b.get("type")=="tool_use": tools.write(json.dumps({"tool":b["name"],"input":b.get("input")})[:2000]+"\n")
        if m.get("type")=="result": res=m
open(out+".result.txt","w").write((res or {}).get("result","") if res else "NO RESULT EVENT")
print(f"session:  {(res or {}).get('session_id')}")
print(f"turns:    {(res or {}).get('num_turns')}  error: {(res or {}).get('is_error')}  cost_usd: {(res or {}).get('total_cost_usd')}")
PY
  # The full transcript (user turns, hook output, expanded skill bodies) lives under ~/.claude/projects.
  local src; src="$(find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects" -name "$session.jsonl" 2>/dev/null | head -1)"
  if [ -n "$src" ]; then cp "$src" "$ARTIFACTS/$label.transcript.jsonl"; echo "transcript: $ARTIFACTS/$label.transcript.jsonl"; else echo "transcript: NOT FOUND for $session"; fi
  echo "result:   $ARTIFACTS/$label.result.txt"
}

cleanup() {
  # Kill only what we started: drives are synchronous, so normally nothing is running. Then remove scratch state.
  pkill -f -- "--plugin-dir $REPO -p " 2>/dev/null && echo "killed leftover headless sessions" || true
  if [ -d "$SCRATCH" ]; then
    # Claude Code's own transcript dir for the scratch cwd (slug: path separators become dashes).
    rm -rf "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/projects/*"aileron-verify-$RUN_ID-cwd"
    rm -rf "$SCRATCH"
    echo "removed:  $SCRATCH (+ its transcript dir)"
  fi
  echo "kept:     $ARTIFACTS"
}

case "${1:-}" in
  doctor) doctor ;;
  drive) shift; drive "$@" ;;
  cleanup) cleanup ;;
  *) sed -n '2,10p' "$0"; exit 2 ;;
esac
