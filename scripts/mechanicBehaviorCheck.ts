import {
  GolfSimulation,
  type SimulationEvent
} from "../src/systems/GolfSimulation";
import type { LevelDefinition } from "../src/types";

type FixtureOverrides = Partial<Omit<LevelDefinition,"id"|"mode"|"group"|"ball"|"hole"|"threeStar"|"twoStar">> & {
  ball?: LevelDefinition["ball"];
  hole?: LevelDefinition["hole"];
};

function fixture(id:string,overrides:FixtureOverrides={}):LevelDefinition {
  return {
    id,
    mode:"classic",
    group:99,
    ball:overrides.ball??{x:270,y:780},
    hole:overrides.hole??{x:486,y:86},
    threeStar:{maxStrokes:3},
    twoStar:{maxStrokes:5},
    authored:true,
    ...overrides
  };
}

function simulateFrames(level:LevelDefinition,angle:number,power:number,frames:number):{sim:GolfSimulation;events:SimulationEvent[]} {
  const sim=new GolfSimulation(level);
  if(!sim.launch(angle,power))throw new Error(`${level.id}: launch rejected`);
  const events:SimulationEvent[]=[];
  for(let i=0;i<frames&&sim.state.moving&&!sim.state.sunk&&!sim.state.voided;i++)events.push(...sim.step(1/60));
  return{sim,events};
}

function speed(sim:GolfSimulation):number{return Math.hypot(sim.state.ball.vx,sim.state.ball.vy);}
function hasEvent(events:SimulationEvent[],kind:SimulationEvent["kind"]):boolean{return events.some(event=>event.kind===kind);}
function pass(label:string):void{console.log(`PASS ${label}`);}
function assert(condition:boolean,label:string,detail:string):void{
  if(!condition)throw new Error(`FAIL ${label}: ${detail}`);
  pass(label);
}

// ICE — same input should retain materially more speed than grass, while surfacing telemetry.
{
  const grass=simulateFrames(fixture("fixture-grass"),-Math.PI/2,.20,30);
  const ice=simulateFrames(fixture("fixture-ice",{ice:[{x:28,y:28,w:484,h:904}]}),-Math.PI/2,.20,30);
  assert(ice.sim.state.touchedMechanics.includes("ice"),"ice telemetry","ice was not recorded in touchedMechanics");
  assert(hasEvent(ice.events,"surface-ice"),"ice event","surface-ice event was not emitted");
  assert(speed(ice.sim)>speed(grass.sim)*1.22,"ice friction","ice does not preserve enough speed versus grass");
}

// BOOSTER — a directional pad must create a measurable displacement/speed advantage and report itself.
{
  const common={ball:{x:120,y:700},hole:{x:486,y:86}};
  const control=simulateFrames(fixture("fixture-booster-control",common),0,.12,18);
  const boosted=simulateFrames(fixture("fixture-booster",{
    ...common,
    boosters:[{x:80,y:650,w:280,h:100,dx:1,dy:0,power:1}]
  }),0,.12,18);
  assert(boosted.sim.state.touchedMechanics.includes("booster"),"booster telemetry","booster was not recorded in touchedMechanics");
  assert(hasEvent(boosted.events,"booster"),"booster event","booster event was not emitted");
  assert(boosted.sim.state.ball.x>control.sim.state.ball.x+18,"booster displacement","booster does not materially change the route");
  assert(speed(boosted.sim)>speed(control.sim)*1.18,"booster velocity","booster does not materially accelerate the ball");
}

// PORTAL — entering one endpoint must teleport once, preserve travel direction and respect cooldown.
{
  const level=fixture("fixture-portal",{
    ball:{x:150,y:700},
    hole:{x:486,y:86},
    portals:[{a:{x:170,y:700,r:30},b:{x:400,y:260,r:30}}]
  });
  const result=simulateFrames(level,0,.20,8);
  const portalEvents=result.events.filter(event=>event.kind==="portal");
  assert(result.sim.state.touchedMechanics.includes("portal"),"portal telemetry","portal was not recorded in touchedMechanics");
  assert(portalEvents.length===1,"portal cooldown",`expected exactly one portal event, got ${portalEvents.length}`);
  assert(result.sim.state.ball.y<340,"portal destination","ball did not arrive near the destination portal");
  assert(result.sim.state.ball.vx>0,"portal direction","portal did not preserve forward travel direction");
}

console.log("PASS block 2 mechanic behavior contracts: ice · booster · portal");
