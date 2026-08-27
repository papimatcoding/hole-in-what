import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement } from "../systems/StarScoring";
import type { GameMode } from "../types";

interface LevelSelectData { mode:GameMode; page?:number; }
const PAGE_SIZE=10;

export class LevelSelectScene extends Phaser.Scene {
  private mode:GameMode="classic";
  private page=0;
  private desktop=false;
  constructor(){super("level-select");}
  init(data:LevelSelectData):void{this.mode=data.mode;this.page=data.page??0;}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();
    if(this.mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked()){this.scene.start("menu");return;}
    const levels=levelsForMode(this.mode),pageCount=Math.max(1,Math.ceil(levels.length/PAGE_SIZE));
    this.page=Phaser.Math.Clamp(this.page,0,pageCount-1);
    const pageStart=this.page*PAGE_SIZE,visible=levels.slice(pageStart,pageStart+PAGE_SIZE);
    this.cameras.main.setBackgroundColor("#0b0f14");

    const back=this.add.rectangle(48,52,54,48,0x131d25).setStrokeStyle(1,0x354957).setInteractive({useHandCursor:true});
    const backText=this.add.text(48,49,"‹",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);
    back.on("pointerover",()=>back.setFillStyle(0x1d2a34)).on("pointerout",()=>back.setFillStyle(0x131d25)).on("pointerup",()=>this.scene.start("menu"));

    const modeLabel=this.mode==="troll"?"HARD":"CLASSIC",group=this.page+1,accent=this.mode==="troll"?0xd0a266:0x719ab2,accentText=this.mode==="troll"?"#d9ad73":"#83aec6";
    this.add.text(270,51,modeLabel,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(29,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,80,80,3,accent,.9);
    this.add.text(270,99,`GRUPO ${group}  ·  ${pageStart+1}–${Math.min(pageStart+10,levels.length)}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:accentText}).setOrigin(.5);
    const totalStars=SaveSystem.totalStars(levels.map(level=>level.id)),unlocked=BETA_TESTING?levels.length:SaveSystem.unlockedLevelCount(this.mode);
    this.add.text(270,126,BETA_TESTING?`BETA · TODOS ABIERTOS   ·   ★ ${totalStars} / ${levels.length*3}`:`★ ${totalStars} / ${levels.length*3}   ·   ${unlocked}/${levels.length} desbloqueados`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(11,2),fontStyle:BETA_TESTING?"bold":"normal",color:BETA_TESTING?"#9ebdce":"#a7b3bf"}).setOrigin(.5);

    this.modeButton(182,164,"CLASSIC","classic");
    this.modeButton(358,164,"HARD","troll");

    const cols=2,cardW=212,cardH=112,gapX=18,gapY=15,startX=270-(cardW+gapX)/2,startY=240;
    visible.forEach((level,localIndex)=>{
      const index=pageStart+localIndex,col=localIndex%cols,row=Math.floor(localIndex/cols),x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY),record=SaveSystem.record(level.id),isUnlocked=BETA_TESTING||SaveSystem.isLevelUnlocked(this.mode,index);
      const fill=isUnlocked?0x151f27:0x10161c,hover=0x202f3a,stroke=record.completed?0x58758a:isUnlocked?0x2f424f:0x222b33;
      const card=this.add.rectangle(x,y,cardW,cardH,fill).setStrokeStyle(record.completed?2:1,stroke);
      const stripe=this.add.rectangle(x-cardW/2+4,y,4,cardH-8,record.completed?accent:0x2b3a45,.95).setOrigin(.5);

      this.add.text(x-84,y-38,`G${level.group}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:isUnlocked?"#7f91a1":"#3f4a54"}).setOrigin(0,.5);
      this.add.text(x,y-23,isUnlocked?String(index+1):"·",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(25,2),fontStyle:"bold",color:isUnlocked?"#f5f7fa":"#4b5660"}).setOrigin(.5);
      if(!isUnlocked)this.add.text(x+72,y-31,"▣",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(14,1),color:"#56616b"}).setOrigin(.5);

      const stars="★".repeat(record.stars)+"☆".repeat(3-record.stars);
      this.add.text(x,y+9,stars,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(18,1),color:record.stars>0?"#f1d07a":isUnlocked?"#566473":"#303941"}).setOrigin(.5);
      const best=record.bestStrokes===null?"RÉCORD —":`RÉCORD ${record.bestStrokes}`;
      this.add.text(x-82,y+39,best,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),fontStyle:"bold",color:isUnlocked?"#a6b4bf":"#45505a"}).setOrigin(0,.5);
      this.add.text(x+82,y+39,`★★★ ${formatRequirement(level.threeStar,true)}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,2),color:isUnlocked?"#a6b4bf":"#414b54"}).setOrigin(1,.5);

      if(isUnlocked){
        card.setInteractive({useHandCursor:true});
        card.on("pointerover",()=>{card.setFillStyle(hover);card.setScale(1.015);stripe.setScale(1,1.015);}).on("pointerout",()=>{card.setFillStyle(fill);card.setScale(1);stripe.setScale(1);}).on("pointerdown",()=>card.setScale(.995)).on("pointerup",()=>{card.setScale(1);this.scene.start("game",{mode:this.mode,levelIndex:index});});
      }
    });

    if(pageCount>1){
      this.pageButton(205,850,"‹",this.page>0,()=>this.scene.restart({mode:this.mode,page:this.page-1}));
      this.add.text(270,850,`${this.page+1} / ${pageCount}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#9aa8b4"}).setOrigin(.5);
      this.pageButton(335,850,"›",this.page<pageCount-1,()=>this.scene.restart({mode:this.mode,page:this.page+1}));
    }

    if(BETA_TESTING){
      this.utilityButton(182,906,"PREVIEWS",()=>this.scene.start("level-previews",{mode:this.mode}));
      this.utilityButton(358,906,"EDITOR",()=>this.scene.start("editor"));
    }
    backText.setDepth(2);sharpenSceneText(this);
  }

  private modeButton(x:number,y:number,label:string,mode:GameMode):void{
    const active=this.mode===mode,locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const bg=this.add.rectangle(x,y,154,44,active?0x263b48:0x131c23).setStrokeStyle(active?2:1,active?0x6e96aa:0x2c3945);
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(11,2),fontStyle:"bold",color:locked?"#4d5963":active?"#f4f7fa":"#95a4b0"}).setOrigin(.5);
    if(locked||active)return;
    const open=()=>this.scene.restart({mode,page:0});bg.setInteractive({useHandCursor:true}).on("pointerover",()=>bg.setFillStyle(0x1d2a33)).on("pointerout",()=>bg.setFillStyle(0x131c23)).on("pointerup",open);text.setInteractive({useHandCursor:true}).on("pointerup",open);
  }

  private pageButton(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,54,44,enabled?0x192630:0x11171d).setStrokeStyle(1,enabled?0x3b5060:0x252e37),text=this.add.text(x,y-2,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(27,2),color:enabled?"#e6edf4":"#46515c"}).setOrigin(.5);
    if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerover",()=>bg.setFillStyle(0x243541)).on("pointerout",()=>bg.setFillStyle(0x192630)).on("pointerup",action);text.setInteractive({useHandCursor:true}).on("pointerup",action);
  }

  private utilityButton(x:number,y:number,label:string,action:()=>void):void{
    const bg=this.add.rectangle(x,y,150,42,0x121b22).setStrokeStyle(1,0x314451).setInteractive({useHandCursor:true});
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#9eb4c3"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(0x1d2b35)).on("pointerout",()=>bg.setFillStyle(0x121b22)).on("pointerdown",()=>{bg.setScale(.985);text.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});
  }
}
