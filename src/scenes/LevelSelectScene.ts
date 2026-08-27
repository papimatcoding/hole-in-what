import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement } from "../systems/StarScoring";
import type { GameMode } from "../types";

interface LevelSelectData { mode:GameMode; page?:number; }
const PAGE_SIZE=10;

export class LevelSelectScene extends Phaser.Scene {
  private mode:GameMode="classic";
  private page=0;
  constructor(){super("level-select");}
  init(data:LevelSelectData):void{this.mode=data.mode;this.page=data.page??0;}

  create():void{
    setupDesignCamera(this);
    if(this.mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked()){this.scene.start("menu");return;}
    const levels=levelsForMode(this.mode),pageCount=Math.max(1,Math.ceil(levels.length/PAGE_SIZE));
    this.page=Phaser.Math.Clamp(this.page,0,pageCount-1);
    const pageStart=this.page*PAGE_SIZE,visible=levels.slice(pageStart,pageStart+PAGE_SIZE);
    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add.text(34,42,"‹",{fontFamily:"system-ui, sans-serif",fontSize:"40px",color:"#f5f7fa"}).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));
    const modeLabel=this.mode==="troll"?"HARD":"CLASSIC",group=this.page+1;
    this.add.text(270,52,modeLabel,{fontFamily:"system-ui, sans-serif",fontSize:"29px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,84,`GRUPO ${group}  ·  ${pageStart+1}–${Math.min(pageStart+10,levels.length)}`,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:this.mode==="troll"?"#d5a66d":"#7fa8c2"}).setOrigin(.5);
    const totalStars=SaveSystem.totalStars(levels.map(level=>level.id)),unlocked=BETA_TESTING?levels.length:SaveSystem.unlockedLevelCount(this.mode);
    this.add.text(270,112,BETA_TESTING?`BETA · TODOS ABIERTOS    ·    ★ ${totalStars} / ${levels.length*3}`:`★ ${totalStars} / ${levels.length*3}    ·    ${unlocked}/${levels.length} desbloqueados`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:BETA_TESTING?"bold":"normal",color:BETA_TESTING?"#94b8cb":"#a7b3bf"}).setOrigin(.5);

    this.modeButton(182,151,"CLASSIC","classic");
    this.modeButton(358,151,"HARD","troll");

    const cols=2,cardW=212,cardH=112,gapX=18,gapY=15,startX=270-(cardW+gapX)/2,startY=230;
    visible.forEach((level,localIndex)=>{
      const index=pageStart+localIndex,col=localIndex%cols,row=Math.floor(localIndex/cols),x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY),record=SaveSystem.record(level.id),isUnlocked=BETA_TESTING||SaveSystem.isLevelUnlocked(this.mode,index);
      const fill=isUnlocked?0x172129:0x11171d,stroke=record.completed?0x607b8d:isUnlocked?0x30404d:0x222b33;
      const card=this.add.rectangle(x,y,cardW,cardH,fill).setStrokeStyle(2,stroke);
      if(isUnlocked)card.setInteractive({useHandCursor:true});

      this.add.text(x-84,y-38,`G${level.group}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:isUnlocked?"#7f91a1":"#3f4a54"}).setOrigin(0,.5);
      this.add.text(x,y-22,isUnlocked?String(index+1):"·",{fontFamily:"system-ui, sans-serif",fontSize:"25px",fontStyle:"bold",color:isUnlocked?"#f5f7fa":"#4b5660"}).setOrigin(.5);
      if(!isUnlocked)this.add.text(x+72,y-31,"▣",{fontFamily:"system-ui, sans-serif",fontSize:"14px",color:"#56616b"}).setOrigin(.5);

      const stars="★".repeat(record.stars)+"☆".repeat(3-record.stars);
      this.add.text(x,y+9,stars,{fontFamily:"system-ui, sans-serif",fontSize:"18px",color:record.stars>0?"#f1d07a":isUnlocked?"#566473":"#303941"}).setOrigin(.5);
      const best=record.bestStrokes===null?"RÉCORD —":`RÉCORD ${record.bestStrokes}`;
      this.add.text(x-82,y+39,best,{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:isUnlocked?"#9baab6":"#45505a"}).setOrigin(0,.5);
      this.add.text(x+82,y+39,`★★★ ${formatRequirement(level.threeStar,true)}`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:isUnlocked?"#9baab6":"#414b54"}).setOrigin(1,.5);

      if(isUnlocked){card.on("pointerup",()=>this.scene.start("game",{mode:this.mode,levelIndex:index}));card.on("pointerover",()=>card.setFillStyle(0x202c36));card.on("pointerout",()=>card.setFillStyle(fill));}
    });

    if(pageCount>1){
      this.pageButton(205,842,"‹",this.page>0,()=>this.scene.restart({mode:this.mode,page:this.page-1}));
      this.add.text(270,842,`${this.page+1} / ${pageCount}`,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:"#8997a5"}).setOrigin(.5);
      this.pageButton(335,842,"›",this.page<pageCount-1,()=>this.scene.restart({mode:this.mode,page:this.page+1}));
    }

    if(BETA_TESTING){
      this.add.text(182,902,"PREVIEWS",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#829eb0"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("level-previews",{mode:this.mode}));
      this.add.text(358,902,"EDITOR",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#829eb0"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("editor"));
    }
    sharpenSceneText(this);
  }

  private modeButton(x:number,y:number,label:string,mode:GameMode):void{
    const active=this.mode===mode,locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const bg=this.add.rectangle(x,y,154,42,active?0x263745:0x141d25).setStrokeStyle(1,active?0x68879c:0x2c3945);
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:locked?"#4d5963":active?"#f4f7fa":"#95a4b0"}).setOrigin(.5);
    if(locked||active)return;
    const open=()=>this.scene.restart({mode,page:0});bg.setInteractive({useHandCursor:true}).on("pointerup",open);text.setInteractive({useHandCursor:true}).on("pointerup",open);
  }

  private pageButton(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,52,44,enabled?0x1a2530:0x12181f).setStrokeStyle(1,enabled?0x344454:0x252e37),text=this.add.text(x,y-2,label,{fontFamily:"system-ui, sans-serif",fontSize:"29px",color:enabled?"#e6edf4":"#46515c"}).setOrigin(.5);
    if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerup",action);text.setInteractive({useHandCursor:true}).on("pointerup",action);
  }
}
