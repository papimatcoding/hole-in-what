import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { GOLF_PHYSICS } from "../systems/GolfSimulation";
import type { GameMode, LevelDefinition, RectDef } from "../types";

interface PreviewSceneData{mode?:GameMode;}

export class LevelPreviewScene extends Phaser.Scene{
  private mode:GameMode="classic";
  constructor(){super("level-previews");}
  init(data:PreviewSceneData):void{this.mode=data.mode??"classic";}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.add.text(42,42,"‹ MENU",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#f4f7fa"}).setOrigin(0,.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));
    this.add.text(498,42,"EDITOR ›",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#8da5b7"}).setOrigin(1,.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("editor"));
    this.add.text(270,45,"PREVISUALIZADOR",{fontFamily:"system-ui, sans-serif",fontSize:"20px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.modeButton("CLASSIC",180,this.mode==="classic",()=>{this.mode="classic";this.scene.restart({mode:this.mode});});
    this.modeButton("HARD",360,this.mode==="troll",()=>{this.mode="troll";this.scene.restart({mode:this.mode});});

    const levels=levelsForMode(this.mode);
    levels.forEach((level,index)=>this.card(level,index));
    this.add.text(270,920,this.mode==="troll"?"HARD · PREVIEW SIN SPOILERS · JUEGA PARA DESCUBRIR LA TRAMPA":"CLICK = ABRIR EN EDITOR",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#718392",align:"center",wordWrap:{width:470}}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private modeButton(label:string,x:number,active:boolean,action:()=>void):void{
    this.add.text(x,86,label,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:active?"#f0d37e":"#82909d"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",action);
  }

  private card(level:LevelDefinition,index:number):void{
    const col=index%2,row=Math.floor(index/2),x=30+col*250,y=126+row*150,w=230,h=132,spoilerSafe=this.mode==="troll";
    const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x131c23).setStrokeStyle(1,0x344553);
    if(!spoilerSafe){bg.setInteractive({useHandCursor:true});bg.on("pointerover",()=>bg.setFillStyle(0x1b2832));bg.on("pointerout",()=>bg.setFillStyle(0x131c23));bg.on("pointerup",()=>this.scene.start("editor",{loadLevelId:level.id}));}
    this.drawMini(level,x+12,y+9,72,114,spoilerSafe);
    this.add.text(x+96,y+20,level.id.toUpperCase(),{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f3f6f8"});
    this.add.text(x+96,y+47,`★★★ ${level.threeStar.maxStrokes??"-"} · ★★ ${level.twoStar.maxStrokes??"-"}`,{fontFamily:"system-ui, sans-serif",fontSize:"10px",color:"#d7c27c"});
    this.add.text(x+96,y+70,spoilerSafe?"TRAMPA OCULTA":(level.primaryMechanic??"geometría").toUpperCase(),{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:spoilerSafe?"#a78d71":"#8da5b7"});
    const objects=(level.walls?.length??0)+(level.bumpers?.length??0)+(level.sand?.length??0)+(level.ice?.length??0)+(level.movingWalls?.length??0)+(spoilerSafe?0:(level.popWalls?.length??0)+(level.popBumpers?.length??0)+(level.popVoids?.length??0));
    this.add.text(x+96,y+94,spoilerSafe?`${objects} visibles`:`${objects} elementos`,{fontFamily:"system-ui, sans-serif",fontSize:"9px",color:"#657583"});
  }

  private drawMini(level:LevelDefinition,x:number,y:number,w:number,h:number,spoilerSafe=false):void{
    const g=this.add.graphics();g.fillStyle(0x67b965,1);g.fillRoundedRect(x,y,w,h,8);g.lineStyle(1,0xa4d79c,.3);g.strokeRoundedRect(x,y,w,h,8);
    const f=GOLF_PHYSICS.field,sx=w/f.w,sy=h/f.h,px=(v:number)=>x+(v-f.x)*sx,py=(v:number)=>y+(v-f.y)*sy;
    const rect=(r:RectDef,color:number,alpha=1):void=>{g.fillStyle(color,alpha);g.fillRect(px(r.x),py(r.y),Math.max(1,r.w*sx),Math.max(1,r.h*sy));};
    for(const r of level.voids??[])rect(r,0x071019,.95);for(const r of level.sand??[])rect(r,0xd9bd79,.9);for(const r of level.ice??[])rect(r,0xa8e4ef,.9);
    for(const r of level.walls??[])rect(r,0x334756,1);for(const r of level.movingWalls??[])rect(r,0x6f8798,1);
    if(!spoilerSafe)for(const r of level.popWalls??[])rect(r,0x8f6042,.72);
    for(const b of level.bumpers??[]){g.fillStyle(0xe5a347,1);g.fillCircle(px(b.x),py(b.y),Math.max(2,b.r*Math.min(sx,sy)));}
    if(!spoilerSafe){
      for(const b of level.popBumpers??[]){g.fillStyle(0xe5a347,.55);g.fillCircle(px(b.x),py(b.y),Math.max(2,b.r*Math.min(sx,sy)));}
      for(const v of level.popVoids??[])rect(v,0x172936,.7);
    }
    for(const p of level.portals??[]){g.lineStyle(2,0x9dcbff,.8);g.strokeCircle(px(p.a.x),py(p.a.y),3);g.strokeCircle(px(p.b.x),py(p.b.y),3);}
    g.fillStyle(0xf7fbff,1);g.fillCircle(px(level.ball.x),py(level.ball.y),3);g.fillStyle(0x101519,1);g.fillCircle(px(level.hole.x),py(level.hole.y),3.5);
  }
}
