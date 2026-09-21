import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PRODUCT_FEATURES, TROLL_MENU_ENABLED } from "../config/product";
import { levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { I18n, type GameLanguage } from "../systems/I18nSystem";
import { LiveOps } from "../systems/LiveOpsSystem";
import { PatchNotes } from "../systems/PatchNotesSystem";
import { ProductTelemetry } from "../systems/ProductTelemetrySystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  private desktop=false;
  constructor(){super("menu");}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();
    this.cameras.main.setBackgroundColor("#0b0f14");
    if(TROLL_MENU_ENABLED)this.drawTrollIdentity();
    if(PRODUCT_FEATURES.cosmetics)SaveSystem.claimEligibleStarRewards();
    void BetaTelemetry.ensureTester(false);
    void ProductTelemetry.ensureSession();
    ProductTelemetry.track({eventName:"menu_view",scene:"menu"});

    const online=this.add.text(42,54,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));
    this.events.once("shutdown",stopOnline);

    this.languageSelector();
    this.add.text(DESIGN_WIDTH/2,116,"HOLE IN WHAT?",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(39,2),fontStyle:"bold",color:TROLL_MENU_ENABLED?"#c2ef63":"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(244,154,52,3,TROLL_MENU_ENABLED?0xb68cff:0x6f98ae,.92);
    this.add.rectangle(296,154,52,3,TROLL_MENU_ENABLED?0xc2ef63:0x6f98ae,.76);

    const alias=BetaTelemetry.alias();
    const identityBg=this.add.rectangle(270,202,this.desktop?300:280,36,alias?0x151522:0x211b18).setStrokeStyle(1,alias?0x3a3349:0x65562f).setInteractive({useHandCursor:true});
    const identity=this.add.text(DESIGN_WIDTH/2,202,alias?`JUGADOR · ${alias}   ✎`:"ELIGE TU NOMBRE   ✎",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:alias?"#cfd2dc":"#e7c477"}).setOrigin(.5);
    const editIdentity=()=>this.scene.start("player-profile");identityBg.on("pointerover",()=>identityBg.setFillStyle(alias?0x201c2c:0x302718)).on("pointerout",()=>identityBg.setFillStyle(alias?0x151522:0x211b18)).on("pointerup",editIdentity);identity.setInteractive({useHandCursor:true}).on("pointerup",editIdentity);

    this.makeWideButton("JUGAR",282,()=>this.scene.start("level-select",{mode:"classic",page:0}),true);

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

  private drawTrollIdentity():void{
    this.cameras.main.setBackgroundColor("#0e0c17");
    const g=this.add.graphics();
    g.fillStyle(0x6e4b92,.08);g.fillCircle(505,130,190);
    g.fillStyle(0xc2ef63,.045);g.fillCircle(18,850,150);
    g.lineStyle(1,0xb68cff,.09);g.lineBetween(46,342,494,342);
  }

  private createDesktopActions():void{
    this.add.text(270,370,"PROGRESO",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#766c86"}).setOrigin(.5);
    this.add.rectangle(270,424,454,92,0x12101b,.82).setStrokeStyle(1,0x30283d);
    if(PRODUCT_FEATURES.cosmetics)this.makeCompactButton(125,424,118,"PERSONALIZAR",()=>this.scene.start("cosmetics"));else this.makeLockedCompactButton(125,424,118,"PERSONALIZAR");
    this.makeCompactButton(270,424,118,"PRESTIGIO",()=>this.scene.start("rewards"),true);
    if(PRODUCT_FEATURES.shop)this.makeCompactButton(415,424,118,"TIENDA",()=>this.scene.start("shop"));else this.makeLockedCompactButton(415,424,118,"TIENDA");

    this.add.text(270,500,"MENÚ",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#766c86"}).setOrigin(.5);
    this.makeWideButton(PatchNotes.hasUnread()?"PATCH NOTES   ·   ● NUEVO":"PATCH NOTES",548,()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());
    this.makeCompactButton(165,614,196,"ASISTENCIA",()=>this.scene.start("assistance"));
    if(PRODUCT_FEATURES.communityMaps)this.makeCompactButton(375,614,196,"COMMUNITY MAPS",()=>{void this.openCommunity();});else this.makeLockedCompactButton(375,614,196,"COMMUNITY MAPS");

    if(BETA_TESTING){
      const beta=this.add.rectangle(270,704,250,38,0x0e141a).setStrokeStyle(1,0x293744);
      const betaText=this.add.text(270,704,`BETA LAB · ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#718390"}).setOrigin(.5);
      this.wirePress(beta,betaText,270,704,270,46,()=>this.scene.start("editor"),0x0e141a,0x17222a);
    }
  }

  private createMobileActions():void{
    this.add.text(270,364,"PROGRESO",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#766c86"}).setOrigin(.5);
    if(PRODUCT_FEATURES.cosmetics)this.makeWideButton("PERSONALIZAR",408,()=>this.scene.start("cosmetics"));else this.makeLockedWideButton("PERSONALIZAR",408);
    this.makeWideButton("PRESTIGIO",466,()=>this.scene.start("rewards"),true);
    if(PRODUCT_FEATURES.shop)this.makeWideButton("TIENDA",524,()=>this.scene.start("shop"));else this.makeLockedWideButton("TIENDA",524);

    this.add.text(270,590,"MENÚ",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#766c86"}).setOrigin(.5);
    this.makeWideButton(PatchNotes.hasUnread()?"PATCH NOTES   ·   ● NUEVO":"PATCH NOTES",634,()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());
    this.makeWideButton("ASISTENCIA AL JUGADOR",692,()=>this.scene.start("assistance"));
    if(PRODUCT_FEATURES.communityMaps)this.makeWideButton("COMMUNITY MAPS",750,()=>{void this.openCommunity();});else this.makeLockedWideButton("COMMUNITY MAPS",750);
    if(BETA_TESTING){
      const beta=this.add.rectangle(270,826,250,38,0x0e141a).setStrokeStyle(1,0x293744);
      const betaText=this.add.text(270,826,`BETA LAB · ${BetaFeedbackSystem.count()} FB`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#718390"}).setOrigin(.5);
      this.wirePress(beta,betaText,270,826,270,46,()=>this.scene.start("editor"),0x0e141a,0x17222a);
    }
  }

  private async openCommunity():Promise<void>{await BetaTelemetry.ensureTester(false);this.scene.start("community-maps");}

  private makeModeButton(label:string,mode:GameMode,y:number):void{
    const levels=levelsForMode(mode),stars=SaveSystem.totalStars(levels.map(level=>level.id));
    const locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const accent=TROLL_MENU_ENABLED?(mode==="troll"?0xb68cff:0xc2ef63):mode==="troll"?0xc99a61:0x6f98ae,rest=locked?0x11171d:TROLL_MENU_ENABLED?0x211b30:0x162129,hover=TROLL_MENU_ENABLED?0x352846:mode==="troll"?0x2d2924:0x22323d;
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
    const open=():void=>{void(async()=>{
      ProductTelemetry.track({eventName:"mode_open",scene:"menu",mode});
      if(mode==="troll")ProductTelemetry.trackOnce({eventName:"hard_discovered",scene:"menu",mode:"troll"});
      if(BETA_TESTING)await BetaTelemetry.ensureTester(false);
      this.scene.start("level-select",{mode});
    })();};
    this.wirePress(bg,[title,progress],270,y,410,92,open,rest,hover);
  }

  private lockedCopy():string{return I18n.language()==="es"?"PRÓXIMAMENTE":"COMING SOON";}

  private makeLockedWideButton(label:string,y:number):void{
    const bg=this.add.rectangle(270,y,390,50,0x10161c).setStrokeStyle(1,0x293641);
    this.add.text(108,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#687987"}).setOrigin(0,.5);
    this.add.text(432,y,this.lockedCopy(),{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#786e7f"}).setOrigin(1,.5);
    bg.setAlpha(.9);
  }

  private makeLockedCompactButton(x:number,y:number,w:number,label:string):void{
    this.add.rectangle(x,y,w,54,0x10161c).setStrokeStyle(1,0x293641).setAlpha(.9);
    this.add.text(x,y-7,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#687987",align:"center",wordWrap:{width:w-12}}).setOrigin(.5);
    this.add.text(x,y+13,this.lockedCopy(),{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(6,2),fontStyle:"bold",color:"#786e7f"}).setOrigin(.5);
  }

  private makeWideButton(label:string,y:number,action:()=>void,accent=false):void{
    const rest=TROLL_MENU_ENABLED?(accent?0x2a3430:0x211b30):accent?0x192831:0x151d25,hover=TROLL_MENU_ENABLED?0x3d354e:accent?0x294250:0x222f3b;
    const bg=this.add.rectangle(270,y,390,50,rest).setStrokeStyle(accent?2:1,TROLL_MENU_ENABLED?(accent?0xc2ef63:0x65517c):accent?0x52788c:0x364653);
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(13,2),fontStyle:"bold",color:TROLL_MENU_ENABLED&&accent?"#c2ef63":accent?"#d9eef8":"#d7e0e8"}).setOrigin(.5);
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
