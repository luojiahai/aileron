# aileron

## 0.3.0

### Minor Changes

- [#14](https://github.com/luojiahai/aileron/pull/14) [`8db8216`](https://github.com/luojiahai/aileron/commit/8db8216cf6a152190cb5baf02a791c91eab467b9) Thanks [@luojiahai](https://github.com/luojiahai)! - Sync with pstack at 2f87c85. Models are Opus first: code, prose, and judgment run on `opus@xhigh`, mechanical work and verification on `opus@high`, and panels on `fable@high`, `opus@high`, and `sonnet@high`. Fable runs outside a panel only when you name it or two Opus runs fail. No role runs above `xhigh`, and `/setup-aileron` offers three budgets and migrates an older models file. Every started agent reads the new `worker.md` first. how, why, reflect, and architect are each one short file, and their `how`, `why`, `reflect`, and `architect runners` roles are retired. The Orchestrate playbook, the orch scripts, and `check-plan.mjs` are removed, so program-scale work routes to figure-it-out. Adds the statechart and ketchup-video skills.

## 0.2.0

### Minor Changes

- [#10](https://github.com/luojiahai/aileron/pull/10) [`43848cf`](https://github.com/luojiahai/aileron/commit/43848cf2dd48cefb93eb5b293c19d1a790e2f526) Thanks [@luojiahai](https://github.com/luojiahai)! - Sync with pstack at 88d4751. Stacks, shipping, and the orch frontier now use `gh` and the PR base chain instead of Graphite, so `gt` is no longer needed. The chat that receives `/aileron` runs the playbook, and `aileron-agent` is only for delegates spawned during a run. The models file takes an optional effort per role and a `budget` default, which `/setup-aileron` asks for. Adds ketchup, sharpen, correct, in-your-own-words, benchmark-checklist, create- and maintain-formal-verification-skill, and three principles. Removes how's critique mode and the `how critics` role.

## 0.1.1

### Patch Changes

- [#1](https://github.com/luojiahai/aileron/pull/1) [`0d19601`](https://github.com/luojiahai/aileron/commit/0d19601cd9ed2a8b0d2de7d9e73ce1f6c783ce8b) Thanks [@luojiahai](https://github.com/luojiahai)! - Add changesets for versioning and GitHub releases.
