import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  constructor(){super("menu");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");
    SaveSystem.claimEligibleStarRewards();

    const wallet=SaveSystem.wallet();
    this.add.text(DESIGN_WIDTH-42,54,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{
      fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#d9e4ee"
    }).setOrigin(1,.5);

    this.add.text(DESIGN_WIDTH/2,125,"TROLL GOLF",{
      fontFamily:"system-ui, sans-serif",fontSize:"46px",fontStyle:"bold",color:"#f5f7fa"
    }).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,172,"MINIGOLF · 3 ESTRELLAS",{
      fontFamily:"system-ui, sans-serif",fontSize:"14px",color:"#8f9dab"
    }).setOrigin(.5);

    if(BETA_TESTING)this.add.text(DESIGN_WIDTH/2,207,"BETA TEST · TODOS LOS HOYOS ABIERTOS",{
      fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#8fb8cf"
    }).setOrigin(.5);

    this.makeModeButton("CLASSIC","classic",285);
    this.makeModeButton("HARD","troll",400);
    this.makeSimpleButton("PERSONALIZAR",520,()=>this.scene.start("cosmetics"));
    this.makeSimpleButton("TIENDA",595,()=>this.scene.start("shop"));
    this.makeSimpleButton("RECOMPENSAS",670,()=>this.scene.start("rewards"));

    const equipped=SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH/2,748,`● ${equipped.ball.replace("ball-","")}   ·   ─ ${equipped.trail.replace("trail-","")}`,{
      fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#718090"
    }).setOrigin(.5);

    const beta=this.add.rectangle(270,818,390,50,0x111922).setStrokeStyle(1,0x334554).setInteractive({useHandCursor:true});
    const betaText=this.add.text(270,818,`BETA LAB · EDITOR   ·   ${BetaFeedbackSystem.count()} FB`,{
      fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#b9c9d4"
    }).setOrigin(.5).setInteractive({useHandCursor:true});
    const openBeta=()=>this.scene.start("editor");beta.on("pointerup",openBeta);betaText.on("pointerup",openBeta);
    beta.on("pointerover",()=>beta.setFillStyle(0x1a2631));beta.on("pointerout",()=>beta.setFillStyle(0x111922));

    this.add.text(DESIGN_WIDTH/2,DESIGN_HEIGHT-48,BETA_TESTING?"CAMPAÑA BETA · TESTER MODE":"CAMPAÑA · CORE SLICE",{
      fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#657282"
    }).setOrigin(.5);
    sharpenSceneText(this);
  }

  private makeModeButton(label:string,mode:GameMode,y:number):void{
    const levels=levelsForMode(mode),stars=SaveSystem.totalStars(levels.map(level=>level.id));
    const locked=mode==="troll"&&!BETA_TESTING&&!SaveSystem.isTrollUnlocked();
    const bg=this.add.rectangle(270,y,390,92,locked?0x121820:0x18212a).setStrokeStyle(2,locked?0x27313b:0x2d3a47);
    const title=this.add.text(105,y-12,label,{
      fontFamily:"system-ui, sans-serif",fontSize:"24px",fontStyle:"bold",color:locked?"#697480":"#f5f7fa"
    }).setOrigin(0,.5);

    if(locked){
      const p=SaveSystem.classicProgress();
      this.add.text(435,y-13,"BLOQUEADO",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#7a8793"}).setOrigin(1,.5);
      this.add.text(105,y+23,`${p.requiredStars}★ o Classic 01–${String(p.requiredCompletions).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#82909d"}).setOrigin(0,.5);
      this.add.text(435,y+23,`${p.stars}/${p.requiredStars}★ · ${p.firstChapterCompleted}/${p.requiredCompletions}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#9aa6b1"}).setOrigin(1,.5);
      return;
    }

    const progress=this.add.text(435,y+16,BETA_TESTING?`BETA · ★ ${stars} / ${levels.length*3}`:`★ ${stars} / ${levels.length*3}`,{
      fontFamily:"system-ui, sans-serif",fontSize:"14px",color:"#c9d4df"
    }).setOrigin(1,.5);
    const open=():void=>{this.scene.start("level-select",{mode});};
    bg.setInteractive({useHandCursor:true}).on("pointerup",open);
    title.setInteractive({useHandCursor:true}).on("pointerup",open);
    progress.setInteractive({useHandCursor:true}).on("pointerup",open);
    bg.on("pointerover",()=>bg.setFillStyle(0x202b36));
    bg.on("pointerout",()=>bg.setFillStyle(0x18212a));
  }

  private makeSimpleButton(label:string,y:number,action:()=>void):void{
    const bg=this.add.rectangle(270,y,390,60,0x151d25).setStrokeStyle(1,0x2b3744).setInteractive({useHandCursor:true});
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:"#d7e0e8"}).setOrigin(.5).setInteractive({useHandCursor:true});
    bg.on("pointerup",action);text.on("pointerup",action);
    bg.on("pointerover",()=>bg.setFillStyle(0x1e2934));bg.on("pointerout",()=>bg.setFillStyle(0x151d25));
  }
}
