import { levelsForMode } from "../data/campaign";
import { STAR_REWARDS, TROLL_UNLOCK_CLASSIC_COMPLETIONS, TROLL_UNLOCK_STARS, totalStarsFromRecords } from "../data/progression";
import type {
  CosmeticsSave,
  EquippedCosmetics,
  GameMode,
  LevelRecord,
  SaveData,
  SaveDataV1,
  SaveDataV2,
  SaveDataV3,
  SubmitResult,
  WalletSave
} from "../types";

const STORAGE_KEY = "troll-golf-save-beta-step3-v1";
const PREVIOUS_STORAGE_KEYS = ["troll-golf-save-authored-reboot-v1","troll-golf-save-procedural-v1"];
const FRESH_START_COINS = 80;
const LEGACY_DEV_GRANT = 250;

const DEFAULT_EQUIPPED: EquippedCosmetics = { ball: "ball-classic", trail: "trail-none", holeEffect: "hole-default" };
const DEFAULT_OWNED = ["ball-classic", "trail-none", "hole-default"];
const emptyRecord = (): LevelRecord => ({ completed:false, stars:0, bestStrokes:null, bestTimeMs:null });
const defaultCosmetics = (): CosmeticsSave => ({ owned:[...DEFAULT_OWNED], equipped:{...DEFAULT_EQUIPPED} });
const defaultWallet = (coins=FRESH_START_COINS,gems=0):WalletSave => ({coins,gems});
const emptySave = ():SaveData => ({version:4,levels:{},cosmetics:defaultCosmetics(),wallet:defaultWallet()});

function migrate(parsed:SaveData|SaveDataV3|SaveDataV2|SaveDataV1):SaveData{
  if(parsed.version===4)return{version:4,levels:parsed.levels??{},cosmetics:parsed.cosmetics??defaultCosmetics(),wallet:parsed.wallet??defaultWallet()};
  if(parsed.version===3)return{version:4,levels:parsed.levels??{},cosmetics:parsed.cosmetics??defaultCosmetics(),wallet:defaultWallet(parsed.wallet?.coins??FRESH_START_COINS,0)};
  if(parsed.version===2)return{version:4,levels:parsed.levels??{},cosmetics:parsed.cosmetics??defaultCosmetics(),wallet:defaultWallet(LEGACY_DEV_GRANT,0)};
  return{version:4,levels:parsed.levels??{},cosmetics:defaultCosmetics(),wallet:defaultWallet(LEGACY_DEV_GRANT,0)};
}
function parseSave(raw:string):SaveData{
  const parsed=JSON.parse(raw) as SaveData|SaveDataV3|SaveDataV2|SaveDataV1;
  if(![1,2,3,4].includes(parsed.version)||typeof parsed.levels!=="object")throw new Error("Invalid save");
  return migrate(parsed);
}
function load():SaveData{
  try{
    const raw=localStorage.getItem(STORAGE_KEY);if(raw)return parseSave(raw);
    for(const key of PREVIOUS_STORAGE_KEYS){
      const previous=localStorage.getItem(key);
      if(!previous)continue;
      const old=parseSave(previous),fresh:SaveData={version:4,levels:{},cosmetics:old.cosmetics,wallet:old.wallet};
      persist(fresh);return fresh;
    }
    return emptySave();
  }catch{return emptySave();}
}
function persist(save:SaveData):void{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(save));}catch{/* gameplay can continue */}}
function unlockEligibleStarRewards(save:SaveData):string[]{
  const totalStars=totalStarsFromRecords(save.levels),unlocked:string[]=[];
  for(const reward of STAR_REWARDS){if(totalStars<reward.stars||save.cosmetics.owned.includes(reward.cosmeticId))continue;save.cosmetics.owned.push(reward.cosmeticId);unlocked.push(reward.cosmeticId);}
  return unlocked;
}
function trollUnlockedForSave(save:SaveData):boolean{
  const classic=levelsForMode("classic"),stars=classic.reduce((sum,level)=>sum+(save.levels[level.id]?.stars??0),0);
  const firstChapterComplete=classic.slice(0,TROLL_UNLOCK_CLASSIC_COMPLETIONS).every(level=>save.levels[level.id]?.completed===true);
  return stars>=TROLL_UNLOCK_STARS||firstChapterComplete;
}

export const SaveSystem={
  record(levelId:string):LevelRecord{return load().levels[levelId]??emptyRecord();},
  submit(levelId:string,stars:number,strokes:number,timeMs:number):SubmitResult{
    const save=load(),current=save.levels[levelId]??emptyRecord(),nextStars=Math.max(current.stars,stars),gainedStars=Math.max(0,nextStars-current.stars),coinsEarned=(current.completed?0:10)+gainedStars*20;
    const next:LevelRecord={completed:true,stars:nextStars,bestStrokes:current.bestStrokes===null?strokes:Math.min(current.bestStrokes,strokes),bestTimeMs:current.bestTimeMs===null?timeMs:Math.min(current.bestTimeMs,timeMs)};
    save.levels[levelId]=next;save.wallet.coins+=coinsEarned;const newlyUnlockedCosmetics=unlockEligibleStarRewards(save);persist(save);
    return{record:next,coinsEarned,totalCoins:save.wallet.coins,totalGems:save.wallet.gems,newlyUnlockedCosmetics};
  },
  totalStars(levelIds:string[]):number{const save=load();return levelIds.reduce((sum,id)=>sum+(save.levels[id]?.stars??0),0);},
  totalStarsAll():number{return totalStarsFromRecords(load().levels);},
  wallet():WalletSave{return{...load().wallet};},coins():number{return load().wallet.coins;},gems():number{return load().wallet.gems;},cosmetics():CosmeticsSave{return load().cosmetics;},
  claimEligibleStarRewards():string[]{const save=load(),unlocked=unlockEligibleStarRewards(save);if(unlocked.length>0)persist(save);return unlocked;},
  classicProgress():{stars:number;completed:number;total:number;requiredStars:number;firstChapterCompleted:number;requiredCompletions:number}{
    const save=load(),levels=levelsForMode("classic"),stars=levels.reduce((sum,level)=>sum+(save.levels[level.id]?.stars??0),0),completed=levels.reduce((sum,level)=>sum+(save.levels[level.id]?.completed?1:0),0),firstChapterCompleted=levels.slice(0,TROLL_UNLOCK_CLASSIC_COMPLETIONS).reduce((sum,level)=>sum+(save.levels[level.id]?.completed?1:0),0);
    return{stars,completed,total:levels.length,requiredStars:TROLL_UNLOCK_STARS,firstChapterCompleted,requiredCompletions:TROLL_UNLOCK_CLASSIC_COMPLETIONS};
  },
  isTrollUnlocked():boolean{return trollUnlockedForSave(load());},
  isLevelUnlocked(mode:GameMode,index:number):boolean{
    const levels=levelsForMode(mode);if(index<0||index>=levels.length)return false;const save=load();if(mode==="troll"&&!trollUnlockedForSave(save))return false;if(index===0)return true;
    const current=levels[index]!,previous=levels[index-1]!;return save.levels[current.id]?.completed===true||save.levels[previous.id]?.completed===true;
  },
  unlockedLevelCount(mode:GameMode):number{const levels=levelsForMode(mode);let count=0;for(let i=0;i<levels.length;i++){if(this.isLevelUnlocked(mode,i))count++;else break;}return count;},
  isOwned(cosmeticId:string):boolean{return load().cosmetics.owned.includes(cosmeticId);},
  purchase(cosmeticId:string,price:number):boolean{const save=load();if(save.cosmetics.owned.includes(cosmeticId))return true;if(price<0||save.wallet.coins<price)return false;save.wallet.coins-=price;save.cosmetics.owned.push(cosmeticId);persist(save);return true;},
  equip(slot:keyof EquippedCosmetics,cosmeticId:string):EquippedCosmetics{const save=load();if(!save.cosmetics.owned.includes(cosmeticId))return save.cosmetics.equipped;save.cosmetics.equipped[slot]=cosmeticId;persist(save);return{...save.cosmetics.equipped};},
  reset():void{try{localStorage.removeItem(STORAGE_KEY);}catch{/* no-op */}}
};
