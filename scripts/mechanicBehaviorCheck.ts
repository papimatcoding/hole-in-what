import { GolfSimulation } from "../src/systems/GolfSimulation";
import type { LevelDefinition, SimulationEvent } from "../src/types";

// NOTE: SimulationEvent is exported by GolfSimulation, not src/types. Kept fixtures tiny and deterministic:
// these are mechanic contracts, not campaign levels or a second physics implementation.
