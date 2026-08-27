import { levelsForMode } from "../src/data/campaign";
import { analyzeCourseClearance } from "../src/systems/CourseValidation";
import type { LevelDefinition, RectDef, Vec2 } from "../src/types";

const r = (x: number, y: number, w: number, h: number): RectDef => ({ x, y, w, h });
const pt = (x: number, y: number): Vec2 => ({ x, y });

function fixture(id: string): LevelDefinition {
  return { id, mode: "classic", group: 1, ball: pt(270, 820), hole: pt(270, 160), threeStar: { maxStrokes: 2 }, twoStar: { maxStrokes: 4 }, authored: true, primaryMechanic: "wall" };
}

function fatalStatesFor(level: LevelDefinition): string[] {
  const report = analyzeCourseClearance(level);
  // Moving obstacles can temporarily block a lane. A player can wait, so those states are warnings for the audit, not fatal geometry.
  return report.blockingStates.filter((state) => !state.startsWith("moving@"));
}

const errors: string[] = [];
for (const mode of ["classic", "troll"] as const) {
  for (const level of levelsForMode(mode)) {
    const fatal = fatalStatesFor(level);
    if (fatal.length) errors.push(`${level.id}: unreachable clearance states -> ${fatal.join(", ")}`);
  }
}

const impossibleBumperGate = fixture("regression-impossible-bumper-gate");
impossibleBumperGate.walls = [r(28, 510, 210, 24), r(302, 510, 210, 24)];
impossibleBumperGate.bumpers = [{ x: 270, y: 522, r: 35 }];
if (!fatalStatesFor(impossibleBumperGate).includes("initial")) {
  errors.push("regression-impossible-bumper-gate: expected initial clearance failure");
}

const closingTrapGate = fixture("regression-closing-trap-gate");
closingTrapGate.mode = "troll";
closingTrapGate.walls = [r(28, 510, 210, 24), r(322, 510, 190, 24)];
closingTrapGate.popWalls = [{ x: 238, y: 510, w: 84, h: 24, triggerX: 270, triggerY: 720, triggerRadius: 140 }];
const trapFatal = fatalStatesFor(closingTrapGate);
if (!trapFatal.includes("popWall[0]") && !trapFatal.includes("all-traps")) {
  errors.push("regression-closing-trap-gate: expected post-trap clearance failure");
}

if (errors.length) {
  console.error(`COURSE CLEARANCE FAIL (${errors.length})\n${errors.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("PASS authored campaign remains physically navigable across persistent trap states");
}
