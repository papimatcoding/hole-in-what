export type TrollConsequence="soft"|"hard"|"terminal";
export type TrollCausalCue="immediate"|"delayed-clear"|"ambiguous";
export type TrollBaitKind="obvious-route"|"mechanic-lure"|"shortcut"|"fake-goal"|"safe-looking"|"paranoia"|"other";

export interface TrollAuditIntent{
  /** How punishing the intended trap is allowed to be. Terminal means a deliberate restart can be valid. */
  consequence:TrollConsequence;
  /** What makes the first-time decision attractive. Tooling-only; never player-facing. */
  bait:TrollBaitKind;
  /** Whether the consequence is intentionally delayed after the triggering decision. */
  delayed?:boolean;
  /** Expected clarity of cause -> effect once the player has been caught. */
  causalCue?:TrollCausalCue;
  /** Optional target band for blind/curious trap activation. Advisory until calibrated with human beta data. */
  expectedFirstTimeTrapRate?:{min:number;max:number};
  /** Optional design note for Audit V3 reports. Never surface this in player UI. */
  note?:string;
}

/**
 * Hidden design intent for HARD levels.
 *
 * This deliberately lives outside LevelDefinition so runtime/preview code cannot accidentally expose
 * trap intent or terminal-state metadata. Audit V3 consumes it as privileged design knowledge while
 * blind/curious/suspicious agents do not.
 */
export const TROLL_AUDIT_INTENT:Readonly<Record<string,TrollAuditIntent>>={
  "troll-01":{consequence:"hard",bait:"obvious-route",causalCue:"immediate",expectedFirstTimeTrapRate:{min:.35,max:.95},note:"Obvious right lane closes; learned route crosses above the divider."},
  "troll-02":{consequence:"hard",bait:"obvious-route",causalCue:"immediate",expectedFirstTimeTrapRate:{min:.30,max:.90},note:"Lower-right read wakes the hidden bumper; learned route exits left."},
  "troll-03":{consequence:"hard",bait:"safe-looking",causalCue:"immediate",expectedFirstTimeTrapRate:{min:.35,max:.95},note:"Centre commitment reveals the false bridge collapse."},
  "troll-04":{consequence:"hard",bait:"obvious-route",causalCue:"immediate",expectedFirstTimeTrapRate:{min:.20,max:.90},note:"Two-stage shutter joke; knowledge should matter more than precision."},
  "troll-05":{consequence:"hard",bait:"mechanic-lure",causalCue:"immediate",expectedFirstTimeTrapRate:{min:.20,max:.90},note:"Late combo mixes visible moving pressure with hidden reactions."}
};
