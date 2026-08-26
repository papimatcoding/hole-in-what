import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement } from "../systems/StarScoring";
import type { CourseMechanic, GameMode } from "../types";

interface LevelSelectData { mode: GameMode; page?: number; }
const PAGE_SIZE=10;
const GLYPHS:Record<CourseMechanic,string>={wall:"↗",bumper:"●",sand:"≈",ice:"◇",booster:"➜",fan:"≋",curve:"◜",portal:"◎",moving:"↔",void:"○",ramp:"↥",trampoline:"⇈"};
const LABELS:Record<CourseMechanic,string>={wall:"REBOTE",bumper:"BUMPER",sand:"ARENA",ice:"HIELO",booster:"IMPULSO",fan:"VIENTO",curve:"CURVA",portal:"PORTAL",moving:"MÓVIL",void:"VACÍO",ramp:"RAMPA",trampoline:"SALTO"};

export class LevelSelectScene extends Phaser.Scene {
  private mode:GameMode="classic";
  private page=0;
  constructor(){super("level-select");}
  init(data:LevelSelectData):void{this.mode=data.mode;this.page=data.page??0;}

  create():void{
    setupDesignCamera(this);
    if(this.mode==="troll"&&!SaveSystem.isTrollUnlocked()){this.scene.start("menu");return;}
    const levels=levelsForMode(this.mode),pageCount=Math.max(1,Math.ceil(levels.length/PAGE_SIZE));
    this.page=Phaser.Math.Clamp(this.page,0,pageCount-1);
    const pageStart=this.page*PAGE_SIZE,visible=levels.slice(pageStart,pageStart+PAGE_SIZE);
    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add.text(34,42,"‹",{fontFamily:"system-ui, sans-serif",fontSize:"40px",color:"#f5f7fa"}).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));
    const modeLabel=this.mode==="troll"?"HARD":"CLASSIC",group=this.page+1;
    this.add.text(270,54,modeLabel,{fontFamily:"system-ui, sans-serif",fontSize:"29px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,88,`GRUPO ${group}  ·  ${pageStart+1}–${Math.min(pageStart+10,levels.length)}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:this.mode==="troll"?"#d5a66d":"#7fa8c2"}).setOrigin(.5);
    const totalStars=SaveSystem.totalStars(levels.map(level=>level.id)),unlocked=SaveSystem.unlockedLevelCount(this.mode);
    this.add.text(270,118,`★ ${totalStars} / ${levels.length*3}    ·    ${unlocked}/${levels.length} desbloqueados`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#9eabb9"}).setOrigin(.5);

    const cols=2,cardW=212,cardH=110,gapX=18,gapY=15,startX=270-(cardW+gapX)/2,startY=205;
    visible.forEach((level,localIndex)=>{
      const index=pageStart+localIndex,col=localIndex%cols,row=Math.floor(localIndex/cols),x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY),record=SaveSystem.record(level.id),isUnlocked=SaveSystem.isLevelUnlocked(this.mode,index);
      const fill=isUnlocked?0x172129:0x11171d,stroke=record.completed?0x607b8d:isUnlocked?0x30404d:0x222b33;
      const card=this.add.rectangle(x,y,cardW,cardH,fill).setStrokeStyle(2,stroke);
      if(isUnlocked)card.setInteractive({useHandCursor:true});

      this.add.text(x-84,y-37,`G${level.group}`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:isUnlocked?"#718292":"#3f4a54"}).setOrigin(0,.5);
      this.add.text(x,y-22,isUnlocked?String(index+1):"·",{fontFamily:"system-ui, sans-serif",fontSize:"25px",fontStyle:"bold",color:isUnlocked?"#f5f7fa":"#4b5660"}).setOrigin(.5);
      if(!isUnlocked)this.add.text(x+72,y-31,"▣",{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#56616b"}).setOrigin(.5);

      const stars="★".repeat(record.stars)+"☆".repeat(3-record.stars);
      this.add.text(x,y+8,stars,{fontFamily:"system-ui, sans-serif",fontSize:"17px",color:record.stars>0?"#f1d07a":isUnlocked?"#566473":"#303941"}).setOrigin(.5);
      const mechanic=level.primaryMechanic??"wall";
      this.add.text(x-72,y+36,`${GLYPHS[mechanic]}  ${LABELS[mechanic]}`,{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:isUnlocked?"#9aabb8":"#45505a"}).setOrigin(0,.5);
      this.add.text(x+78,y+36,`★★★ ${formatRequirement(level.threeStar,true)}`,{fontFamily:"system-ui, sans-serif",fontSize:"10px",color:isUnlocked?"#8999a7":"#414b54"}).setOrigin(1,.5);

      if(isUnlocked){card.on("pointerup",()=>this.scene.start("game",{mode:this.mode,levelIndex:index}));card.on("pointerover",()=>card.setFillStyle(0x202c36));card.on("pointerout",()=>card.setFillStyle(fill));}
    });

    if(pageCount>1){
      this.pageButton(205,835,"‹",this.page>0,()=>this.scene.restart({mode:this.mode,page:this.page-1}));
      this.add.text(270,835,`${this.page+1} / ${pageCount}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#8997a5"}).setOrigin(.5);
      this.pageButton(335,835,"›",this.page<pageCount-1,()=>this.scene.restart({mode:this.mode,page:this.page+1}));
    }
    sharpenSceneText(this);
  }

  private pageButton(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,52,44,enabled?0x1a2530:0x12181f).setStrokeStyle(1,enabled?0x344454:0x252e37),text=this.add.text(x,y-2,label,{fontFamily:"system-ui, sans-serif",fontSize:"29px",color:enabled?"#e6edf4":"#46515c"}).setOrigin(.5);
    if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerup",action);text.setInteractive({useHandCursor:true}).on("pointerup",action);
  }
}
