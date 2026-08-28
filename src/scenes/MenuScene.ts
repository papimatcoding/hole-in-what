import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { I18n, type GameLanguage } from "../systems/I18nSystem";
import { LiveOps } from "../systems/LiveOpsSystem";
import { PatchNotes } from "../systems/PatchNotesSystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  private desktop=false;
  constructor(){super("menu");}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();
    this.cameras.main.setBackgroundColor("#0b0f14");
    SaveSystem.claimEligibleStarRewards();
    void BetaTelemetry.ensureTester(false);

    const online=this.add.text(42,54,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));
    this.events.once("shutdown",stopOnline);

    const wallet=SaveSystem.wallet();
    this.add.text(DESIGN_WIDTH-42,54,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(15,1),fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    this.languageSelector();
    this.add.text(DESIGN_WIDTH/2,106,"HOLE IN WHAT?",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(39,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,139,72,3,0x6f98ae,.95);
    this.add.text(DESIGN_WIDTH/2,160,"MINIGOLF · 3 ESTRELLAS",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#8194a3"}).setOrigin(.5);

    const alias=BetaTelemetry.alias();
    const identityBg=this.add.rectangle(270,194,this.desktop?300:280,36,alias?0x121d24:0x251f15).setStrokeStyle(1,alias?0x314856:0x6b562b).setInteractive({useHandCursor:true});
    const identity=this.add.text(DESIGN_WIDTH/2,194,alias?`JUGADOR · ${alias}   ✎`:"ELIGE TU NOMBRE   ✎",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:alias?"#c9d9e3":"#e7c477"}).setOrigin(.5);
    const editIdentity=()=>this.scene.start("player-profile");identityBg.on("pointerover",()=>identityBg.setFillStyle(alias?0x1c2b34:0x332918)).on("pointerout",()=>identityBg.setFillStyle(alias?0x121d24:0x251f15)).on("pointerup",editIdentity);identity.setInteractive({useHandCursor:true}).on("pointerup",editIdentity);
    if(BETA_TESTING)this.add.text(DESIGN_WIDTH/2,224,"BETA · TODOS LOS HOYOS ABIERTOS",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#769eb5"}).setOrigin(.5);

    const classicY=this.desktop?292:282,hardY=this.desktop?388:376;
    this.makeModeButton("CLASSIC","classic",classicY);
    this.makeModeButton("HARD","troll",hardY);

    if(this.desktop)this.createDesktopActions();else this.createMobileActions();

    sharpenSceneText(this);
  }

  private languageSelector():void{
    const current=I18n.language();
    const select=(next:GameLanguage):void=>{if(next===I18n.language())return;I18n.set(next);this.scene.restart();};
    const left=this.add.rectangle(248,54,42,30,current==="es"?0x29485a:0x111a21).setStrokeStyle(1,current==="es"?0x709bb1:0x2b3a45).setInteractive({useHandCursor:true});
    const right=this.add.rectangle(292,54,42,30,current==="en"?0x29485a:0x111a21).setStrokeStyle(1,current==="en"?0x709bb1:0x2b3a45).setInteractive({useHandCursor:true});
    const es=this.add.text(248,54,"ES",{fontFamily:"system-ui",fontSize:uiFontSize(9,1),fontStyle:"bold",color:current==="es"?"#eef7fb":"#718491"}).setOrigin(.5).setInteractive({useHandCursor:true});
    const en=this.add.text(292,54,"EN",{fontFamily:"system-ui",fontSize:uiFontSize(9,1),fontStyle:"bold",color:current==="en"?"#eef7fb":"#718491"}).setOrigin(.5).setInteractive({useHandCursor:true});
    left.on("pointerup",()=>select("es"));es.on("pointerup",()=>select("es"));right.on("pointerup",()=>select("en"));en.on("pointerup",()=>select("en"));
  }

  private createDesktopActions():void{
    this.add.text(270,452,"JUEGO Y COLECCIÓN",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#667a89"}).setOrigin(.5);
    this.makeCompactButton(125,492,118,"PERSONALIZAR",()=>this.scene.start("cosmetics"));
    this.makeCompactButton(270,492,118,"TIENDA",()=>this.scene.start("shop"));
    this.makeCompactButton(415,492,118,"RECOMPENSAS",()=>this.scene.start("rewards"));

    this.add.text(270,550,"COMUNIDAD",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#667a89"}).setOrigin(.5);
    this.makeCompactButton(165,592,196,"COMMUNITY MAPS",()=>{void this.openCommunity();},true);
    this.makeCompactButton(375,592,196,"ASISTENCIA",()=>this.scene.start("assistance"),true);
    this.makeWideButton(PatchNotes.hasUnread()?"PATCH NOTES   ·   ● NUEVO":"PATCH NOTES",654,()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());

    const equipped=SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH/2,710,`● ${equipped.ball.replace("ball-","")}   ·   ─ ${equipped.trail.replace("trail-","")}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),color:"#718491"}).setOrigin(.5);

    const beta=this.add.rectangle(270,770,390,50,0x101820).setStrokeStyle(1,0x334956);
    const betaText=this.add.text(270,770,`BETA LAB · EDITOR   ·   ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#a9bdc9"}).setOrigin(.5);
    this.wirePress(beta,betaText,270,770,410,58,()=>this.scene.start("editor"),0x101820,0x1d2c36);
    this.add.text(DESIGN_WIDTH/2,DESIGN_HEIGHT-48,BETA_TESTING?"BETA · DESKTOP":"CAMPAÑA · DESKTOP",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),color:"#5e707e"}).setOrigin(.5);
  }

  private createMobileActions():void{
    this.makeWideButton("PERSONALIZAR",472,()=>this.scene.start("cosmetics"));
    this.makeWideButton("TIENDA",528,()=>this.scene.start("shop"));
    this.makeWideButton("RECOMPENSAS",584,()=>this.scene.start("rewards"));
    this.makeWideButton("COMMUNITY MAPS",648,()=>{void this.openCommunity();},true);
    this.makeWideButton("ASISTENCIA AL JUGADOR",708,()=>this.scene.start("assistance"),true);
    this.makeWideButton(PatchNotes.hasUnread()?"PATCH NOTES   ·   ● NUEVO":"PATCH NOTES",768,()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());
    const equipped=SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH/2,814,`● ${equipped.ball.replace("ball-","")}   ·   ─ ${equipped.trail.replace("trail-","")}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,1),color:"#718090"}).setOrigin(.5);
    const beta=this.add.rectangle(270,862,390,48,0x111922).setStrokeStyle(2,0x405666);
    const betaText=this.add.text(270,862,`BETA LAB · EDITOR   ·   ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(11,1),fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);
    this.wirePress(beta,betaText,270,862,410,58,()=>this.scene.start("editor"),0x111922,0x1d2b36);
    this.add.text(DESIGN_WIDTH/2,DESIGN_HEIGHT-25,BETA_TESTING?"CAMPAÑA BETA · TESTER MODE":"CAMPAÑA · CORE SLICE",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,1),color:"#657282"}).setOrigin(.5);
  }

  private async openCommunity():Promise<void>{await BetaTelemetry.ensureTester(false);this.scene.start("community-maps");}

  private makeModeButton(label:string,mode:GameMode,y:number):void{
    const levels=levelsForMode(mode),stars=SaveSystem.totalStars(levels.map(level=>level.id));
    const locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const accent=mode==="troll"?0xc99a61:0x6f98ae,rest=locked?0x11171d:0x162129,hover=mode==="troll"?0x2d2924:0x22323d;
    const bg=this.add.rectangle(270,y,390,82,rest).setStrokeStyle(2,locked?0x27313b:mode==="troll"?0x705943:0x3d5666);
    this.add.rectangle(78,y,4,70,accent,locked?0.25:0.9);
    const title=this.add.text(105,y-10,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(22,1),fontStyle:"bold",color:locked?"#697480":"#f5f7fa"}).setOrigin(0,.5);
    if(locked){
      const p=SaveSystem.classicProgress();
      this.add.text(435,y-12,"BLOQUEADO",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#7a8793"}).setOrigin(1,.5);
      this.add.text(105,y+20,`${p.requiredStars}★ o Classic 01–${String(p.requiredCompletions).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(13,1),color:"#82909d"}).setOrigin(0,.5);
      return;
    }
    const progress=this.add.text(435,y+15,BETA_TESTING?`BETA · ★ ${stars} / ${levels.length*3}`:`★ ${stars} / ${levels.length*3}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),color:"#c9d4df"}).setOrigin(1,.5);
    const open=():void=>{void(async()=>{if(BETA_TESTING)await BetaTelemetry.ensureTester(false);this.scene.start("level-select",{mode});})();};
    this.wirePress(bg,[title,progress],270,y,410,92,open,rest,hover);
  }

  private makeWideButton(label:string,y:number,action:()=>void,accent=false):void{
    const rest=accent?0x192831:0x151d25,hover=accent?0x294250:0x222f3b;
    const bg=this.add.rectangle(270,y,390,50,rest).setStrokeStyle(accent?2:1,accent?0x52788c:0x364653);
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(13,2),fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8"}).setOrigin(.5);
    this.wirePress(bg,text,270,y,410,58,action,rest,hover);
  }

  private makeCompactButton(x:number,y:number,w:number,label:string,action:()=>void,accent=false):void{
    const rest=accent?0x192831:0x141e26,hover=accent?0x294250:0x21303a;
    const bg=this.add.rectangle(x,y,w,54,rest).setStrokeStyle(1,accent?0x52788c:0x344955);
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8",align:"center",wordWrap:{width:w-14}}).setOrigin(.5);
    this.wirePress(bg,text,x,y,w+8,62,action,rest,hover);
  }

  private wirePress(bg:Phaser.GameObjects.Rectangle,labels:Phaser.GameObjects.Text|Phaser.GameObjects.Text[],x:number,y:number,w:number,h:number,action:()=>void,rest:number,hover:number):void{
    const items=Array.isArray(labels)?labels:[labels],zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});
    const scale=(value:number):void=>{bg.setScale(value);for(const item of items)item.setScale(value);};
    zone.on("pointerover",()=>bg.setFillStyle(hover));
    zone.on("pointerdown",()=>{bg.setFillStyle(hover);scale(.985);});
    zone.on("pointerout",()=>{bg.setFillStyle(rest);scale(1);});
    zone.on("pointerup",()=>{bg.setFillStyle(rest);scale(1);action();});
  }
}
