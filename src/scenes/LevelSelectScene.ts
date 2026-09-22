import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_WIDTH, VIEW_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { CAMPAIGN_ENTRIES } from "../data/campaign";
import { CAMPAIGN_CHAPTER_SIZE, campaignChapterDefinition } from "../data/progression";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement } from "../systems/StarScoring";
import type { GameMode } from "../types";

interface LevelSelectData { mode:GameMode; page?:number; }
const PAGE_SIZE=CAMPAIGN_CHAPTER_SIZE;

export class LevelSelectScene extends Phaser.Scene {
  private mode:GameMode="classic";
  private page=0;
  private desktop=false;

  constructor(){super("level-select");}
  init(data:LevelSelectData):void{this.mode=data.mode;this.page=data.page??0;}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();
    const levels=CAMPAIGN_ENTRIES.map(entry=>entry.level),pageCount=Math.max(1,Math.ceil(levels.length/PAGE_SIZE));
    this.page=Phaser.Math.Clamp(this.page,0,pageCount-1);
    const pageStart=this.page*PAGE_SIZE,visible=levels.slice(pageStart,pageStart+PAGE_SIZE),chapter=campaignChapterDefinition(this.page);
    const accent=chapter.id==="grassland"?0x8fce72:chapter.id==="metropolis"?0x72a8d8:0xc2ef63;
    const accentText=chapter.id==="grassland"?"#aee897":chapter.id==="metropolis"?"#9ec9ee":"#c2ef63";
    this.cameras.main.setBackgroundColor(chapter.id==="grassland"?"#0c1510":chapter.id==="metropolis"?"#10131a":"#0b0f14");
    this.drawBackground(accent);

    const left=DESIGN_WIDTH/2-VIEW_WIDTH/2,headerX=this.desktop?left+70:48;
    const back=this.add.rectangle(headerX,52,54,48,0x131d25).setStrokeStyle(1,0x354957).setInteractive({useHandCursor:true});
    const backText=this.add.text(headerX,49,"‹",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);
    back.on("pointerover",()=>back.setFillStyle(0x1d2a34)).on("pointerout",()=>back.setFillStyle(0x131d25)).on("pointerup",()=>this.scene.start("menu"));

    this.add.text(DESIGN_WIDTH/2,48,"CAMPAÑA",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(this.desktop?28:27,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(DESIGN_WIDTH/2,79,80,3,accent,.9);
    this.add.text(DESIGN_WIDTH/2,104,`${chapter.name}  ·  ${pageStart+1}–${pageStart+visible.length}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(13,2),fontStyle:"bold",color:accentText}).setOrigin(.5);

    const isOpen=(index:number):boolean=>SaveSystem.isCampaignLevelUnlocked(index);
    const chapterStars=SaveSystem.totalStars(visible.map(level=>level.id));
    const chapterUnlocked=BETA_TESTING?visible.length:visible.filter((_,localIndex)=>isOpen(pageStart+localIndex)).length;
    const chapterProgress=SaveSystem.campaignChapterProgress(pageStart);
    const status=BETA_TESTING
      ?`BETA · TODOS ABIERTOS · ★ ${chapterStars} / ${visible.length*3}`
      :chapterProgress.eligible&&!chapterProgress.claimed
        ?`LISTO PARA RECLAMAR · ${chapter.name}`
        :!chapterProgress.unlocked
          ?`CAPÍTULO BLOQUEADO · ★ ${chapterProgress.totalStars} / ${chapterProgress.requiredStars}`
          :`★ ${chapterStars} / ${visible.length*3}   ·   ${chapterUnlocked}/${visible.length} DESBLOQUEADOS`;
    this.add.text(DESIGN_WIDTH/2,133,status,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:BETA_TESTING||!chapterProgress.unlocked?"bold":"normal",color:BETA_TESTING?"#9ebdce":chapterProgress.unlocked?"#a7b3bf":"#e6ce80"}).setOrigin(.5);

    if(!BETA_TESTING&&chapterProgress.eligible&&!chapterProgress.claimed){
      const claimBg=this.add.rectangle(DESIGN_WIDTH/2,174,220,38,0x392f1e).setStrokeStyle(1,0xe0bd69).setInteractive({useHandCursor:true});
      const claimText=this.add.text(DESIGN_WIDTH/2,174,"RECLAMAR EN PRESTIGIO",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#f4dda0"}).setOrigin(.5);
      const openPrestige=()=>this.scene.start("menu",{section:"prestige",carouselOffset:0});
      claimBg.on("pointerover",()=>claimBg.setFillStyle(0x4a3d25)).on("pointerout",()=>claimBg.setFillStyle(0x392f1e)).on("pointerup",openPrestige);
      claimText.setInteractive({useHandCursor:true}).on("pointerup",openPrestige);
    }

    if(this.desktop)this.renderDesktopCards(visible,pageStart,isOpen,accent);
    else this.renderMobileCards(visible,pageStart,isOpen,accent);

    if(BETA_TESTING){
      this.utilityButton(DESIGN_WIDTH/2-88,906,"PREVIEWS",()=>this.scene.start("level-previews",{mode:this.mode}));
      this.utilityButton(DESIGN_WIDTH/2+88,906,"EDITOR",()=>this.scene.start("editor"));
    }
    backText.setDepth(2);sharpenSceneText(this);
  }

  private drawBackground(accent:number):void{
    if(!this.desktop)return;
    const left=DESIGN_WIDTH/2-VIEW_WIDTH/2,right=DESIGN_WIDTH/2+VIEW_WIDTH/2,g=this.add.graphics();
    g.fillStyle(accent,.035);g.fillCircle(left+140,900,390);g.fillCircle(right-80,110,300);
    g.lineStyle(1,accent,.055);
    for(let y=184;y<850;y+=96)g.lineBetween(left+42,y,right-42,y);
    g.fillStyle(0x070a0d,.3);g.fillRoundedRect(left+42,166,VIEW_WIDTH-84,684,22);
    g.lineStyle(1,accent,.18);g.strokeRoundedRect(left+42,166,VIEW_WIDTH-84,684,22);
  }

  private renderDesktopCards(levels:typeof CAMPAIGN_ENTRIES[number]["level"][],pageStart:number,isOpen:(index:number)=>boolean,accent:number):void{
    const cols=5,cardW=250,cardH=244,gapX=26,gapY=26,startX=DESIGN_WIDTH/2-2*(cardW+gapX),startY=326;
    levels.forEach((level,localIndex)=>{
      const index=pageStart+localIndex,col=localIndex%cols,row=Math.floor(localIndex/cols),x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY);
      this.addDesktopLevelCard(level,index,x,y,cardW,cardH,BETA_TESTING||isOpen(index),accent);
    });
  }

  private addDesktopLevelCard(level:typeof CAMPAIGN_ENTRIES[number]["level"],index:number,x:number,y:number,w:number,h:number,isUnlocked:boolean,accent:number):void{
    const record=SaveSystem.record(level.id),fill=isUnlocked?0x111920:0x0d1217,hover=0x1b2932,stroke=record.completed?accent:isUnlocked?0x344953:0x222b33;
    const card=this.add.rectangle(x,y,w,h,fill,.98).setStrokeStyle(record.completed?2:1,stroke,.94);
    const top=this.add.rectangle(x,y-h/2+4,w-8,6,record.completed?accent:0x2b3a45,.95);
    this.add.text(x-w/2+20,y-h/2+28,`NIVEL ${String(index+1).padStart(2,"0")}`,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:isUnlocked?"#8799a6":"#45505a"}).setOrigin(0,.5);
    this.add.text(x+w/2-20,y-h/2+28,`G${level.group}`,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:isUnlocked?"#6f8491":"#3b454e"}).setOrigin(1,.5);
    this.add.text(x,y-42,isUnlocked?String(index+1):"▣",{fontFamily:"system-ui",fontSize:"45px",fontStyle:"bold",color:isUnlocked?"#f3f7f8":"#46515b"}).setOrigin(.5);
    const stars="★".repeat(record.stars)+"☆".repeat(3-record.stars);
    this.add.text(x,y+12,stars,{fontFamily:"system-ui",fontSize:"23px",color:record.stars>0?"#f1d07a":isUnlocked?"#566473":"#303941"}).setOrigin(.5);
    const best=record.bestStrokes===null?"RÉCORD —":`RÉCORD ${record.bestStrokes}`;
    this.add.text(x-w/2+20,y+49,best,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:isUnlocked?"#a6b4bf":"#45505a"}).setOrigin(0,.5);
    this.add.text(x+w/2-20,y+49,record.completed?`★★★ ${formatRequirement(level.threeStar,true)}`:"",{fontFamily:"system-ui",fontSize:"9px",color:"#a6b4bf"}).setOrigin(1,.5);
    const footer=this.add.rectangle(x,y+h/2-26,w-10,42,isUnlocked?0x18252c:0x11171c);
    const footerText=this.add.text(x,y+h/2-26,isUnlocked?"JUGAR  ›":"BLOQUEADO",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:isUnlocked?"#cfe5d0":"#46515a"}).setOrigin(.5);
    if(!isUnlocked)return;
    const open=():void=>{const entry=CAMPAIGN_ENTRIES[index]!;this.scene.start("game",{mode:entry.mode,levelIndex:entry.levelIndex});};
    const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});
    zone.on("pointerover",()=>{card.setFillStyle(hover);card.setScale(1.015);top.setScale(1.015,1);footer.setFillStyle(0x23383f);});
    zone.on("pointerout",()=>{card.setFillStyle(fill);card.setScale(1);top.setScale(1);footer.setFillStyle(0x18252c);});
    zone.on("pointerdown",()=>{card.setScale(.995);footerText.setScale(.98);});
    zone.on("pointerup",()=>{card.setScale(1);footerText.setScale(1);open();});
  }

  private renderMobileCards(levels:typeof CAMPAIGN_ENTRIES[number]["level"][],pageStart:number,isOpen:(index:number)=>boolean,accent:number):void{
    const cols=2,cardW=212,cardH=112,gapX=18,gapY=15,startX=DESIGN_WIDTH/2-(cardW+gapX)/2,startY=238;
    levels.forEach((level,localIndex)=>{
      const index=pageStart+localIndex,col=localIndex%cols,row=Math.floor(localIndex/cols),x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY),record=SaveSystem.record(level.id),isUnlocked=BETA_TESTING||isOpen(index);
      const fill=isUnlocked?0x151f27:0x10161c,hover=0x202f3a,stroke=record.completed?0x58758a:isUnlocked?0x2f424f:0x222b33;
      const card=this.add.rectangle(x,y,cardW,cardH,fill).setStrokeStyle(record.completed?2:1,stroke);
      const stripe=this.add.rectangle(x-cardW/2+4,y,4,cardH-8,record.completed?accent:0x2b3a45,.95);
      this.add.text(x-84,y-38,`G${level.group}`,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:isUnlocked?"#7f91a1":"#3f4a54"}).setOrigin(0,.5);
      this.add.text(x,y-23,isUnlocked?String(index+1):"·",{fontFamily:"system-ui",fontSize:uiFontSize(25,2),fontStyle:"bold",color:isUnlocked?"#f5f7fa":"#4b5660"}).setOrigin(.5);
      const stars="★".repeat(record.stars)+"☆".repeat(3-record.stars);
      this.add.text(x,y+9,stars,{fontFamily:"system-ui",fontSize:uiFontSize(18,1),color:record.stars>0?"#f1d07a":isUnlocked?"#566473":"#303941"}).setOrigin(.5);
      const best=record.bestStrokes===null?"RÉCORD —":`RÉCORD ${record.bestStrokes}`;
      this.add.text(x-82,y+39,best,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:isUnlocked?"#a6b4bf":"#45505a"}).setOrigin(0,.5);
      this.add.text(x+82,y+39,record.completed?`★★★ ${formatRequirement(level.threeStar,true)}`:"",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:isUnlocked?"#a6b4bf":"#414b54"}).setOrigin(1,.5);
      if(!isUnlocked)return;
      card.setInteractive({useHandCursor:true});
      card.on("pointerover",()=>{card.setFillStyle(hover);card.setScale(1.015);stripe.setScale(1,1.015);}).on("pointerout",()=>{card.setFillStyle(fill);card.setScale(1);stripe.setScale(1);}).on("pointerdown",()=>card.setScale(.995)).on("pointerup",()=>{card.setScale(1);const entry=CAMPAIGN_ENTRIES[index]!;this.scene.start("game",{mode:entry.mode,levelIndex:entry.levelIndex});});
    });
  }

  private utilityButton(x:number,y:number,label:string,action:()=>void):void{
    const bg=this.add.rectangle(x,y,150,42,0x121b22).setStrokeStyle(1,0x314451).setInteractive({useHandCursor:true});
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#9eb4c3"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(0x1d2b35)).on("pointerout",()=>bg.setFillStyle(0x121b22)).on("pointerdown",()=>{bg.setScale(.985);text.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});
  }
}
