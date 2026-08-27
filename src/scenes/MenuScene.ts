import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { LiveOps } from "../systems/LiveOpsSystem";
import { PatchNotes } from "../systems/PatchNotesSystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  constructor(){super("menu");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");
    SaveSystem.claimEligibleStarRewards();
    void BetaTelemetry.ensureTester(false);

    const online=this.add.text(42,54,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));
    this.events.once("shutdown",stopOnline);

    const wallet=SaveSystem.wallet();
    this.add.text(DESIGN_WIDTH-42,54,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    this.add.text(DESIGN_WIDTH/2,108,"TROLL GOLF",{fontFamily:"system-ui, sans-serif",fontSize:"42px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,150,"MINIGOLF · 3 ESTRELLAS",{fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#8f9dab"}).setOrigin(.5);

    const alias=BetaTelemetry.alias(),identityRest=alias?0x141f27:0x292317,identityHover=alias?0x20313c:0x3a301d;
    const identityBg=this.add.rectangle(270,184,390,42,identityRest).setStrokeStyle(1,alias?0x3b5362:0x7a6537);
    const identity=this.add.text(DESIGN_WIDTH/2,184,alias?`JUGADOR · ${alias}   ✎`:"ELIGE TU NOMBRE DE JUGADOR   ✎",{fontFamily:"system-ui, sans-serif",fontSize:alias?"13px":"14px",fontStyle:"bold",color:alias?"#c9d9e3":"#f0cd7b"}).setOrigin(.5);
    this.wirePress(identityBg,identity,184,410,50,()=>this.scene.start("player-profile"),identityRest,identityHover);
    if(BETA_TESTING)this.add.text(DESIGN_WIDTH/2,218,"BETA TEST · TODOS LOS HOYOS ABIERTOS",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5);

    this.makeModeButton("CLASSIC","classic",260);
    this.makeModeButton("HARD","troll",354);
    this.makeSimpleButton("PERSONALIZAR",452,()=>this.scene.start("cosmetics"));
    this.makeSimpleButton("TIENDA",508,()=>this.scene.start("shop"));
    this.makeSimpleButton("RECOMPENSAS",564,()=>this.scene.start("rewards"));
    this.makeSimpleButton("COMMUNITY MAPS",628,()=>{void this.openCommunity();},true);
    this.makeSimpleButton("ASISTENCIA AL JUGADOR",688,()=>this.scene.start("assistance"),true);
    this.makeSimpleButton(PatchNotes.hasUnread()?"PATCH NOTES   ·   ● NUEVO":"PATCH NOTES",748,()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());

    const equipped=SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH/2,794,`● ${equipped.ball.replace("ball-","")}   ·   ─ ${equipped.trail.replace("trail-","")}`,{fontFamily:"system-ui, sans-serif",fontSize:"10px",color:"#718090"}).setOrigin(.5);

    const beta=this.add.rectangle(270,842,390,48,0x111922).setStrokeStyle(2,0x405666);
    const betaText=this.add.text(270,842,`BETA LAB · EDITOR   ·   ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);
    this.wirePress(beta,betaText,842,410,58,()=>this.scene.start("editor"),0x111922,0x1d2b36);

    this.add.text(DESIGN_WIDTH/2,DESIGN_HEIGHT-28,BETA_TESTING?"CAMPAÑA BETA · TESTER MODE":"CAMPAÑA · CORE SLICE",{fontFamily:"system-ui, sans-serif",fontSize:"10px",color:"#657282"}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private async openCommunity():Promise<void>{await BetaTelemetry.ensureTester(false);this.scene.start("community-maps");}

  private makeModeButton(label:string,mode:GameMode,y:number):void{
    const levels=levelsForMode(mode),stars=SaveSystem.totalStars(levels.map(level=>level.id));
    const locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const bg=this.add.rectangle(270,y,390,82,locked?0x121820:0x18212a).setStrokeStyle(2,locked?0x27313b:0x3d5060);
    const title=this.add.text(105,y-10,label,{fontFamily:"system-ui, sans-serif",fontSize:"22px",fontStyle:"bold",color:locked?"#697480":"#f5f7fa"}).setOrigin(0,.5);
    if(locked){
      const p=SaveSystem.classicProgress();
      this.add.text(435,y-12,"BLOQUEADO",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#7a8793"}).setOrigin(1,.5);
      this.add.text(105,y+20,`${p.requiredStars}★ o Classic 01–${String(p.requiredCompletions).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#82909d"}).setOrigin(0,.5);
      return;
    }
    const progress=this.add.text(435,y+15,BETA_TESTING?`BETA · ★ ${stars} / ${levels.length*3}`:`★ ${stars} / ${levels.length*3}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#c9d4df"}).setOrigin(1,.5);
    const open=():void=>{void(async()=>{if(BETA_TESTING)await BetaTelemetry.ensureTester(false);this.scene.start("level-select",{mode});})();};
    this.wirePress(bg,[title,progress],y,410,92,open,0x18212a,0x25323e);
  }

  private makeSimpleButton(label:string,y:number,action:()=>void,accent=false):void{
    const rest=accent?0x192831:0x151d25,hover=accent?0x294250:0x222f3b;
    const bg=this.add.rectangle(270,y,390,50,rest).setStrokeStyle(2,accent?0x52788c:0x364653);
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8"}).setOrigin(.5);
    this.wirePress(bg,text,y,410,58,action,rest,hover);
  }

  private wirePress(bg:Phaser.GameObjects.Rectangle,labels:Phaser.GameObjects.Text|Phaser.GameObjects.Text[],y:number,w:number,h:number,action:()=>void,rest:number,hover:number):void{
    const items=Array.isArray(labels)?labels:[labels],zone=this.add.zone(270,y,w,h).setInteractive({useHandCursor:true});
    const scale=(value:number):void=>{bg.setScale(value);for(const item of items)item.setScale(value);};
    zone.on("pointerover",()=>bg.setFillStyle(hover));
    zone.on("pointerdown",()=>{bg.setFillStyle(hover);scale(.985);});
    zone.on("pointerout",()=>{bg.setFillStyle(rest);scale(1);});
    zone.on("pointerup",()=>{bg.setFillStyle(rest);scale(1);action();});
  }
}
