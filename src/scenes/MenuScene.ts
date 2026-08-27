import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { LiveOps } from "../systems/LiveOpsSystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  constructor(){super("menu");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");
    SaveSystem.claimEligibleStarRewards();

    const online=this.add.text(42,54,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));
    this.events.once("shutdown",stopOnline);

    const wallet=SaveSystem.wallet();
    this.add.text(DESIGN_WIDTH-42,54,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    this.add.text(DESIGN_WIDTH/2,112,"TROLL GOLF",{fontFamily:"system-ui, sans-serif",fontSize:"44px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,158,"MINIGOLF · 3 ESTRELLAS",{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#8f9dab"}).setOrigin(.5);
    if(BETA_TESTING)this.add.text(DESIGN_WIDTH/2,192,"BETA TEST · TODOS LOS HOYOS ABIERTOS",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5);

    this.makeModeButton("CLASSIC","classic",265);
    this.makeModeButton("HARD","troll",370);
    this.makeSimpleButton("PERSONALIZAR",478,()=>this.scene.start("cosmetics"));
    this.makeSimpleButton("TIENDA",540,()=>this.scene.start("shop"));
    this.makeSimpleButton("RECOMPENSAS",602,()=>this.scene.start("rewards"));
    this.makeSimpleButton("COMMUNITY MAPS",674,()=>{void this.openCommunity();},true);

    const equipped=SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH/2,738,`● ${equipped.ball.replace("ball-","")}   ·   ─ ${equipped.trail.replace("trail-","")}`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#718090"}).setOrigin(.5);

    const beta=this.add.rectangle(270,804,390,48,0x111922).setStrokeStyle(2,0x405666);
    const betaText=this.add.text(270,804,`BETA LAB · EDITOR   ·   ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);
    this.wirePress(beta,betaText,804,410,58,()=>this.scene.start("editor"),0x111922,0x1d2b36);

    this.add.text(DESIGN_WIDTH/2,DESIGN_HEIGHT-48,BETA_TESTING?"CAMPAÑA BETA · TESTER MODE":"CAMPAÑA · CORE SLICE",{fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#657282"}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private async openCommunity():Promise<void>{await BetaTelemetry.ensureTester(true);this.scene.start("community-maps");}

  private makeModeButton(label:string,mode:GameMode,y:number):void{
    const levels=levelsForMode(mode),stars=SaveSystem.totalStars(levels.map(level=>level.id));
    const locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const bg=this.add.rectangle(270,y,390,86,locked?0x121820:0x18212a).setStrokeStyle(2,locked?0x27313b:0x3d5060);
    const title=this.add.text(105,y-11,label,{fontFamily:"system-ui, sans-serif",fontSize:"23px",fontStyle:"bold",color:locked?"#697480":"#f5f7fa"}).setOrigin(0,.5);
    if(locked){
      const p=SaveSystem.classicProgress();
      this.add.text(435,y-12,"BLOQUEADO",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#7a8793"}).setOrigin(1,.5);
      this.add.text(105,y+21,`${p.requiredStars}★ o Classic 01–${String(p.requiredCompletions).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#82909d"}).setOrigin(0,.5);
      return;
    }
    const progress=this.add.text(435,y+16,BETA_TESTING?`BETA · ★ ${stars} / ${levels.length*3}`:`★ ${stars} / ${levels.length*3}`,{fontFamily:"system-ui, sans-serif",fontSize:"14px",color:"#c9d4df"}).setOrigin(1,.5);
    const open=():void=>{void(async()=>{if(BETA_TESTING)await BetaTelemetry.ensureTester(true);this.scene.start("level-select",{mode});})();};
    this.wirePress(bg,[title,progress],y,410,96,open,0x18212a,0x25323e);
  }

  private makeSimpleButton(label:string,y:number,action:()=>void,accent=false):void{
    const rest=accent?0x192831:0x151d25,hover=accent?0x294250:0x222f3b;
    const bg=this.add.rectangle(270,y,390,54,rest).setStrokeStyle(2,accent?0x52788c:0x364653);
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8"}).setOrigin(.5);
    this.wirePress(bg,text,y,410,60,action,rest,hover);
  }

  private wirePress(bg:Phaser.GameObjects.Rectangle,labels:Phaser.GameObjects.GameObject|Phaser.GameObjects.GameObject[],y:number,w:number,h:number,action:()=>void,rest:number,hover:number):void{
    const items=Array.isArray(labels)?labels:[labels],zone=this.add.zone(270,y,w,h).setInteractive({useHandCursor:true});
    const scale=(value:number):void=>{bg.setScale(value);for(const item of items)item.setScale(value);};
    zone.on("pointerover",()=>bg.setFillStyle(hover));
    zone.on("pointerdown",()=>{bg.setFillStyle(hover);scale(.985);});
    zone.on("pointerout",()=>{bg.setFillStyle(rest);scale(1);});
    zone.on("pointerup",()=>{bg.setFillStyle(rest);scale(1);action();});
  }
}
