import assert from "node:assert/strict";
import { CAMPAIGN_ENTRIES, campaignIndex, levelFor } from "../src/data/campaign";
import { GolfSimulation, simulateShotToRest } from "../src/systems/GolfSimulation";
import { SaveSystem } from "../src/systems/SaveSystem";

// Isolated in-memory storage: never touches the browser's beta save or telemetry.
const memory=new Map<string,string>();
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{
  getItem:(key:string)=>memory.get(key)??null,
  setItem:(key:string,value:string)=>memory.set(key,value),
  removeItem:(key:string)=>memory.delete(key)
}});
assert.equal(SaveSystem.isCampaignLevelUnlocked(0),true);
assert.equal(SaveSystem.isCampaignLevelUnlocked(1),false);
assert.equal(SaveSystem.isCampaignLevelUnlocked(-1),false);
assert.equal(SaveSystem.isCampaignLevelUnlocked(21),false);
SaveSystem.submit(levelFor("classic",15).id,2,4,10000);
assert.equal(SaveSystem.isCampaignLevelUnlocked(16),true,"C16 completion opens former H01");
assert.equal(SaveSystem.isCampaignLevelUnlocked(17),false,"future holes remain locked");
SaveSystem.submit(levelFor("troll",0).id,3,2,5000);
assert.equal(SaveSystem.isCampaignLevelUnlocked(17),true,"H01 completion advances in the same campaign");
assert.equal(SaveSystem.record("troll-01").stars,3,"legacy record remains intact");
const wallet=SaveSystem.wallet();
SaveSystem.isCampaignLevelUnlocked(16);
assert.deepEqual(SaveSystem.wallet(),wallet,"reading campaign access never grants rewards");
SaveSystem.submit("classic-01",3,2,1000);
assert.equal(SaveSystem.isOwned("trail-stardust"),false,"reward stays locked below 10 stars");
const milestone=SaveSystem.submit("classic-02",3,2,1000);
assert(milestone.newlyUnlockedCosmetics.includes("trail-stardust"),"crossing 10 stars grants the reward");
assert.equal(SaveSystem.equip("trail","trail-stardust").trail,"trail-stardust","earned reward can be equipped");
const starsBeforeReplay=SaveSystem.totalStarsAll(),walletBeforeReplay=SaveSystem.wallet();
const replayReward=SaveSystem.submit("classic-02",2,3,1500);
assert.equal(SaveSystem.totalStarsAll(),starsBeforeReplay,"replay does not farm total stars");
assert.deepEqual(SaveSystem.wallet(),walletBeforeReplay,"worse replay does not farm currency");
assert.deepEqual(replayReward.newlyUnlockedCosmetics,[],"milestone is not awarded twice");
assert.deepEqual(SaveSystem.claimEligibleStarRewards(),[],"claiming already owned rewards is idempotent");

const level=levelFor("classic",0);
assert.equal(CAMPAIGN_ENTRIES.length,21);
assert.equal(new Set(CAMPAIGN_ENTRIES.map(entry=>entry.level.id)).size,21);
CAMPAIGN_ENTRIES.forEach((entry,index)=>{
  assert.equal(campaignIndex(entry.mode,entry.levelIndex),index);
  assert.equal(levelFor(entry.mode,entry.levelIndex).id,entry.level.id);
});
assert.equal(CAMPAIGN_ENTRIES[campaignIndex("classic",15)+1]!.level.id,levelFor("troll",0).id);
assert.equal(level.onboarding,true);
assert.equal(level.popWalls?.length,1);
for(const angle of [-Math.PI/2,0,Math.PI/2,Math.PI]){
  for(const power of [.05,.5,1]){
    const sim=new GolfSimulation(level);
    for(let i=0;i<120;i++)sim.step(1/60);
    assert.equal(sim.state.popWalls[0]!.active,false,"must not spoil the wall before a shot");
    const first=simulateShotToRest(level,sim.state,{angle,power});
    assert.equal(first.events.filter(e=>e.kind==="trap-wall").length,1,"first shot reveals exactly once");
    assert.equal(first.state.popWalls[0]!.active,true);
    assert.equal(first.voided,false,"tutorial must not punish with a void");
    if(!first.sunk){
      const second=simulateShotToRest(level,first.state,{angle:0,power:.1});
      assert.equal(second.events.filter(e=>e.kind==="trap-wall").length,0,"no repeated surprise popup");
      assert.equal(second.state.popWalls[0]!.active,true,"wall stays visible");
    }
    assert.equal(new GolfSimulation(level).state.popWalls[0]!.active,false,"retry resets the reveal");
  }
}
const direct=simulateShotToRest(level,new GolfSimulation(level).state,{angle:-Math.PI/2,power:.5});
assert(direct.events.some(e=>e.kind==="wall-hit"),"the apparent straight route must hit the revealed wall");
assert.equal(direct.sunk,false);
console.log("PASS tutorial: hidden while idle, reveal on all first-shot directions/powers, real collision, persistent wall, no repeat, clean retry");
