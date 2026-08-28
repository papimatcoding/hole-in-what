# Audit V3 · Hole in What?

Audit V3 is the next-generation internal QA/design model for Hole in What?. It is **tooling only**: it runs against the same `GolfSimulation` authority as the game but is not shipped in the player bundle.

## Goal

Keep every useful V2 signal while adding three new reasoning layers:

1. **Troll cognition / trap lifecycle** — first-time bait, consequence, causal clarity, learned fairness, bypass resistance, intentional terminal states and knowledge gain.
2. **Human + artificial metric fusion** — synthetic execution acts as a prior; real beta telemetry increasingly dominates as sample size grows. Disagreement is treated as evidence that the model is missing something, not that players are wrong.
3. **Map intelligence** — spatial density, hazards, hidden-trap footprint, connectivity, entropy, symmetry and structural similarity to neighbouring maps.

V3 is intended to become our internal design assistant for Classic, HARD and eventually Community Maps.

## Rollout policy

### Shadow mode — default

`npm run audit:v3:full`

- inherits the authoritative PASS/REVIEW/BLOCKER status from Audit 2;
- emits V3 advisories without automatically rejecting a previously certified level;
- is the default while belief agents and human-fusion priors are being calibrated.

### Strict mode

`npm run audit:v3:strict`

Strict mode may promote robust V3 findings into gates. Initially only high-confidence categories should gate, especially accidental terminal/softlock states. Expand strict gating only after human beta evidence shows the proxy is reliable.

## Evidence hierarchy

Audit V3 never treats one model as truth.

**Physics authority → adversarial solvability → synthetic execution → belief-agent behaviour → real beta telemetry → human qualitative feedback**

When artificial and real-human evidence diverge materially, V3 should flag the disagreement for investigation rather than silently averaging it away.

## Belief agents

The V3 troll layer deliberately separates privileged design intent from what an agent can know.

- **blind** — sees the initial player-visible state and aims for plausible direct progress; receives no `designPath`, hidden trigger position or trap intent;
- **curious** — is attracted to visible interactables such as bumpers, trampolines, boosters and portals;
- **suspicious** — samples less-obvious and off-axis choices to model a player who has learned not to trust HARD;
- **learned** — inherited from Audit 2 execution evidence; represents the post-joke solution;
- adversarial/solver evidence remains provided by the existing course audit and Audit 2 explorer/search layers.

Future V3 iterations can add explicit mastery and memory-across-attempt agents once the declarative trigger/action engine exists.

## Troll lifecycle

A good HARD joke is evaluated as:

**BAIT → CONSEQUENCE → COMPREHENSION → MASTERY**

Current V3 proxies:

- `baitStrength` — blind/curious trigger probability blended with V2 naive-trap evidence;
- `consequence` — how materially the trap changes the resulting run compared with a counterfactual copy with hidden pop traps removed;
- `causalClarity` — declared design cue for immediate/delayed/ambiguous cause-effect;
- `learnedFairness` — V2 touch robustness + shot-window tolerance on the learned route;
- `bypassResistance` — broad HIO search for solutions that avoid all traps;
- `trapOriginality` — distance from the trap signatures used by other HARD levels;
- `knowledgeGainPotential` — bait × clarity × learned fairness;
- `trollScore` — an advisory composite, **not an objective fun score**.

The score is a design alarm, never a substitute for players laughing, swearing or rating the level.

## Intentional terminal traps

`src/data/trollAuditIntent.ts` stores tooling-only design intent outside `LevelDefinition`, so runtime/preview UI cannot accidentally expose it.

Consequences:

- `soft` — normal recovery expected;
- `hard` — major punishment but the run normally remains alive;
- `terminal` — a deliberate wrong decision may force a restart.

V3 runs shallow post-trigger search probes. A likely terminal state that is **not** declared terminal is `POSSIBLE_ACCIDENTAL_TERMINAL`; in strict mode that is a blocker. A declared terminal trap is not automatically good: later V3 versions must also verify alternative pre-trigger choice, restart availability, causal clarity and robust learned avoidance.

## Human telemetry fusion

Optional input: `AUDIT3_HUMAN_FILE`, default `artifacts/audit3-human.json`.

The accepted shape is the JSON output of `scripts/betaTelemetryAggregate.sql`. The file contains aggregate level statistics only, no tester IDs.

For completion, V3 treats synthetic touch success as a Bayesian-style prior and updates it with real completed/attempt counts. The prior is intentionally small so real players take over quickly.

For subjective difficulty, artificial difficulty is blended with the 1–5 post-hole difficulty rating as feedback sample size grows.

Confidence bands are based on players/attempts. Large model-human disagreement becomes an advisory; in strict mode a sufficiently confident disagreement can promote a level to REVIEW.

## Map intelligence

V3 rasterises each authored map independently of its intended route and computes:

- visible blocked footprint;
- visible hazard footprint;
- hidden trap footprint;
- open-space connectivity from the ball;
- spatial entropy of authored objects;
- left/right symmetry;
- decision/object density;
- rough layout class (`open`, `mixed`, `corridor`);
- nearest structural neighbour in the same mode, including mirrored similarity.

These metrics are descriptive. A corridor or symmetric map can be excellent; the purpose is to detect repetition and provide context to design review.

## Outputs

- `artifacts/audit3-report.json` — machine-readable complete report;
- `artifacts/audit3-report.md` — compact human report with per-level diagnostics;
- console summary for CI.

## Current boundary

V3 currently understands the existing pop-trap grammar (`popWalls`, `popBumpers`, `popVoids`) plus ordinary visible mechanics. The next major enabling feature is a declarative **Trigger → Action** world-state system supporting events such as landing zones, false holes, delayed actions, object state swaps and terminal cages. When that exists, V3 belief/state search must consume the exact same engine rather than reimplementing trap behaviour.
