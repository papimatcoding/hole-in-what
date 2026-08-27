import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById } from "../data/cosmetics";
import { levelsForMode } from "../data/campaign";
import { AudioFeedback } from "../systems/AudioFeedback";
import { BetaFeedbackSystem, type BetaFeedbackCategory } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement, requirementMet } from "../systems/StarScoring";
import type { ResultsSceneData } from "../types";

export class ResultsScene extends Phaser.Scene {
  private resultData!:ResultsSceneData;
  private feedbackPanel:Phaser.GameObjects.Container|null=null;
  private surveyPanel:Phaser.GameObjects.Container|null=null;
  private leaderboardPanel:Phaser.GameObjects.Container|null=null;
  private surveyRatings={fun:0,originality:0,difficulty:0,surprise:0};
  private surveyTags=new Set<string>();
  private surveyComment="";
  private runUpload:Promise<void>|null=null;
  constructor(){super("results");}
  init(data:ResultsSceneData):void{this.resultData=data;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    const levels=levelsForMode(this.resultData.mode),level=levels[this.resultData.levelIndex]!,previous=SaveSystem.record(this.resultData.levelId);
    const newStrokeRecord=previous.bestStrokes===null||this.resultData.strokes<previous.bestStrokes;
    const newTimeRecord=previous.bestTimeMs===null||this.resultData.timeMs<previous.bestTimeMs;
    const newStars=this.resultData.stars>previous.stars;
    const reward=SaveSystem.submit(this.resultData.levelId,this.resultData.stars,this.resultData.strokes,this.resultData.timeMs);
    if(BETA_TESTING){BetaTelemetry.beginAttempt(this.resultData.levelId);this.runUpload=BetaTelemetry.submitRun({levelId:this.resultData.levelId,mode:this.resultData.mode,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs,stars:this.resultData.stars});}

    this.add.text(498,54,`◈ ${reward.totalCoins}   ◆ ${reward.totalGems}`,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    const stars="★".repeat(this.resultData.stars)+"☆".repeat(3-this.resultData.stars);
    this.add.text(270,182,stars,{fontFamily:"system-ui, sans-serif",fontSize:"58px",color:"#f1d07a"}).setOrigin(.5);
    this.add.text(270,265,`${this.resultData.strokes} ${this.resultData.strokes===1?"golpe":"golpes"}`,{fontFamily:"system-ui, sans-serif",fontSize:"28px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,305,`${(this.resultData.timeMs/1000).toFixed(1)} s`,{fontFamily:"system-ui, sans-serif",fontSize:"18px",color:"#9eabb9"}).setOrigin(.5);

    const notices:string[]=[];
    if(newStars)notices.push(previous.stars===0?"NUEVAS ESTRELLAS":"NUEVA ESTRELLA");
    if(newStrokeRecord)notices.push("NUEVO RÉCORD DE GOLPES");
    if(newTimeRecord)notices.push("NUEVO RÉCORD DE TIEMPO");
    if(notices.length>0){
      const notice=this.add.text(270,347,notices.join("  ·  "),{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#dfe9ef",align:"center",wordWrap:{width:450}}).setOrigin(.5).setAlpha(0);
      this.tweens.add({targets:notice,alpha:1,y:342,duration:240,ease:"Cubic.easeOut"});
      if(newStars)AudioFeedback.play("star");
    }

    const metThree=requirementMet(level.threeStar,this.resultData.strokes),metTwo=requirementMet(level.twoStar,this.resultData.strokes);
    this.add.rectangle(270,430,400,118,0x121a21).setStrokeStyle(1,0x2d3a47);
    this.add.text(92,389,"MAESTRÍA",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#7e8d9a"}).setOrigin(0,.5);
    this.add.text(108,421,`${metThree?"✓":"·"}  ★★★   ${formatRequirement(level.threeStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:metThree?"#f1d07a":"#82909b"}).setOrigin(0,.5);
    this.add.text(108,455,`${metTwo?"✓":"·"}  ★★     ${formatRequirement(level.twoStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:metTwo?"#c5d0da":"#7b8791"}).setOrigin(0,.5);

    const target=this.resultData.stars>=3?null:this.resultData.stars===2?level.threeStar.maxStrokes:level.twoStar.maxStrokes;
    if(target!==null&&target!==undefined){
      const gap=Math.max(1,this.resultData.strokes-target),goalStars=this.resultData.stars===2?"★★★":"★★";
      this.add.text(270,510,`Te ${gap===1?"faltó 1 golpe":`faltaron ${gap} golpes`} para ${goalStars}`,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#c9d3db"}).setOrigin(.5);
    }else this.add.text(270,510,"Ruta de maestría conseguida",{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f1d07a"}).setOrigin(.5);

    let infoY=552;
    if(reward.coinsEarned>0){const rewardText=this.add.text(270,infoY,`+${reward.coinsEarned} ◈`,{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:"#e4d29d"}).setOrigin(.5).setAlpha(0);this.tweens.add({targets:rewardText,alpha:1,y:infoY-5,duration:230,ease:"Cubic.easeOut"});infoY+=30;}
    if(reward.newlyUnlockedCosmetics.length>0){const names=reward.newlyUnlockedCosmetics.map(id=>cosmeticById(id)?.name).filter((name):name is string=>Boolean(name));this.add.text(270,infoY,`DESBLOQUEADO · ${names.join(" · ")}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",align:"center",color:"#f1d07a",wordWrap:{width:430}}).setOrigin(.5);}

    const canPrev=this.resultData.levelIndex>0;
    const canNext=this.resultData.levelIndex<levels.length-1&&(BETA_TESTING||SaveSystem.isLevelUnlocked(this.resultData.mode,this.resultData.levelIndex+1));
    const retry=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex});
    const prev=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex-1});
    const next=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex+1});
    if(this.resultData.stars<3){this.makeButton("REINTENTAR",640,retry,true);if(canNext)this.makeButton("SIGUIENTE",718,next,false);}
    else{if(canNext)this.makeButton("SIGUIENTE",640,next,true);this.makeButton("REINTENTAR",718,retry,false);}

    if(BETA_TESTING){
      this.betaNavText(126,785,"‹ ANTERIOR",canPrev,prev);
      this.add.text(270,785,`${this.resultData.mode==="troll"?"H":"C"} ${String(this.resultData.levelIndex+1).padStart(2,"0")} / ${String(levels.length).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#8193a1"}).setOrigin(.5);
      this.betaNavText(414,785,"SIGUIENTE ›",canNext,next);
    }

    this.add.text(270,BETA_TESTING?826:810,"NIVELES",{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#aeb9c5"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("level-select",{mode:this.resultData.mode,page:Math.floor(this.resultData.levelIndex/10)}));
    if(BETA_TESTING){
      this.add.text(175,872,"🏆 RANKING",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#e5d293"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>{void this.openLeaderboard();});
      this.add.text(365,872,"⚑ FEEDBACK",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.openFeedback());
    }else this.add.text(270,858,`FEEDBACK BETA · ${BetaFeedbackSystem.count()} guardados`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.openFeedback());
    sharpenSceneText(this);
    if(BETA_TESTING&&!BetaTelemetry.levelSurveyDone(this.resultData.levelId))this.time.delayedCall(350,()=>this.openSurvey());
  }

  private betaNavText(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:enabled?"#a9c3d3":"#46525b"}).setOrigin(.5);
    if(enabled)text.setInteractive({useHandCursor:true}).on("pointerup",action);
  }

  private makeButton(label:string,y:number,action:()=>void,primary:boolean):void{
    const bg=this.add.rectangle(270,y,334,66,primary?0x253847:0x172129).setStrokeStyle(2,primary?0x67869c:0x344454).setInteractive({useHandCursor:true});
    const text=this.add.text(270,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"18px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5).setInteractive({useHandCursor:true});
    bg.on("pointerup",action);text.on("pointerup",action);bg.on("pointerover",()=>bg.setFillStyle(primary?0x30485a:0x22303b));bg.on("pointerout",()=>bg.setFillStyle(primary?0x253847:0x172129));
  }

  private openSurvey():void{
    if(this.surveyPanel)return;
    this.surveyRatings={fun:0,originality:0,difficulty:0,surprise:0};this.surveyTags.clear();this.surveyComment="";
    const children:Phaser.GameObjects.GameObject[]=[];
    const blocker=this.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive();children.push(blocker);
    const hard=this.resultData.mode==="troll";
    const h=hard?548:486;
    const panel=this.add.rectangle(270,480,452,h,0x111a22,.99).setStrokeStyle(2,0x405668);children.push(panel);
    const top=hard?226:258;
    children.push(this.add.text(270,top,"¿QUÉ TAL ESTE HOYO?",{fontFamily:"system-ui, sans-serif",fontSize:"19px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));
    children.push(this.add.text(270,top+30,"Toca y sigue · 5 = mejor / más difícil",{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#8395a3"}).setOrigin(.5));
    let y=top+82;
    this.ratingRow(children,"DIVERSIÓN",y,"fun");y+=68;
    this.ratingRow(children,"ORIGINALIDAD",y,"originality");y+=68;
    this.ratingRow(children,"DIFICULTAD",y,"difficulty");y+=68;
    if(hard){this.ratingRow(children,"TROLEO",y,"surprise");y+=68;}
    const bug=this.add.rectangle(153,y,146,38,0x17242d).setStrokeStyle(1,0x3b5060).setInteractive({useHandCursor:true});
    const bugText=this.add.text(153,y,"⚠ BUG",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);children.push(bug,bugText);
    bug.on("pointerup",()=>{if(this.surveyTags.has("bug")){this.surveyTags.delete("bug");bug.setFillStyle(0x17242d);}else{this.surveyTags.add("bug");bug.setFillStyle(0x5a342f);}});
    const detail=this.add.text(356,y,"+ DETALLE",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5).setInteractive({useHandCursor:true});children.push(detail);
    detail.on("pointerup",()=>{this.surveyComment=window.prompt("Comentario opcional",this.surveyComment)??this.surveyComment;});
    const submitY=y+62;
    const submit=this.add.rectangle(270,submitY,318,54,0x294456).setStrokeStyle(2,0x6f93a8).setInteractive({useHandCursor:true});
    const submitText=this.add.text(270,submitY,"ENVIAR",{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);children.push(submit,submitText);
    submit.on("pointerup",()=>{void this.submitSurvey();});
    const skip=this.add.text(270,submitY+43,"SALTAR",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#748694"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeSurvey());children.push(skip);
    this.surveyPanel=this.add.container(0,0,children).setDepth(300).setAlpha(0);this.tweens.add({targets:this.surveyPanel,alpha:1,duration:120});
  }

  private ratingRow(children:Phaser.GameObjects.GameObject[],label:string,y:number,key:"fun"|"originality"|"difficulty"|"surprise"):void{
    children.push(this.add.text(62,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#c9d5de"}).setOrigin(0,.5));
    for(let i=1;i<=5;i+=1){
      const x=244+(i-1)*48,c=this.add.circle(x,y,18,0x17242d).setStrokeStyle(1,0x496173).setInteractive({useHandCursor:true});
      const t=this.add.text(x,y,String(i),{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#dfe8ee"}).setOrigin(.5);children.push(c,t);
      c.on("pointerup",()=>{this.surveyRatings[key]=i;for(const obj of children){if(obj instanceof Phaser.GameObjects.Arc&&Math.abs(obj.y-y)<1)obj.setFillStyle(obj.x<=x?0x45677a:0x17242d);}});
    }
  }

  private async submitSurvey():Promise<void>{
    const r=this.surveyRatings;if(r.fun<1||r.originality<1||r.difficulty<1||(this.resultData.mode==="troll"&&r.surprise<1)){
      const toast=this.add.text(270,180,"FALTA UNA FILA",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f4d1a5",backgroundColor:"#2a2117",padding:{x:12,y:7}}).setOrigin(.5).setDepth(350);this.tweens.add({targets:toast,alpha:0,delay:650,duration:180,onComplete:()=>toast.destroy()});return;
    }
    const ok=await BetaTelemetry.submitLevelFeedback({levelId:this.resultData.levelId,mode:this.resultData.mode,fun:r.fun,originality:r.originality,difficulty:r.difficulty,surprise:this.resultData.mode==="troll"?r.surprise:null,tags:[...this.surveyTags],comment:this.surveyComment});
    this.closeSurvey();
    const toast=this.add.text(270,170,ok?"✓ ENVIADO":"NO SE PUDO ENVIAR",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:ok?"#d9efde":"#f0c1b7",backgroundColor:ok?"#14231a":"#2b1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(350);this.tweens.add({targets:toast,alpha:0,delay:700,duration:180,onComplete:()=>toast.destroy()});
    if(ok&&this.allCurrentLevelsCompleted()&&!BetaTelemetry.gameSurveyDone())this.time.delayedCall(350,()=>{void this.openGameSurvey();});
  }

  private async openLeaderboard():Promise<void>{
    if(this.leaderboardPanel)return;
    const children:Phaser.GameObjects.GameObject[]=[];
    const blocker=this.add.rectangle(270,480,540,960,0x05080b,.86).setInteractive();children.push(blocker);
    const panel=this.add.rectangle(270,480,438,650,0x111a22,.99).setStrokeStyle(2,0x526878);children.push(panel);
    children.push(this.add.text(270,192,`🏆 ${this.resultData.levelId.toUpperCase()}`,{fontFamily:"system-ui, sans-serif",fontSize:"19px",fontStyle:"bold",color:"#f1d07a"}).setOrigin(.5));
    const loading=this.add.text(270,480,"CARGANDO…",{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#91a2af"}).setOrigin(.5);children.push(loading);
    const close=this.add.text(270,776,"CERRAR",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#8295a3"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeLeaderboard());children.push(close);
    this.leaderboardPanel=this.add.container(0,0,children).setDepth(320);
    await this.runUpload;
    const entries=await BetaTelemetry.leaderboard(this.resultData.levelId);
    if(!this.leaderboardPanel)return;
    loading.destroy();
    if(entries.length===0){children.push(this.add.text(270,470,"AÚN NO HAY MARCAS",{fontFamily:"system-ui, sans-serif",fontSize:"14px",fontStyle:"bold",color:"#91a2af"}).setOrigin(.5));return;}
    children.push(this.add.text(72,246,"#   JUGADOR",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#718695"}).setOrigin(0,.5));
    children.push(this.add.text(468,246,"GOLPES   TIEMPO",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#718695"}).setOrigin(1,.5));
    entries.forEach((e,i)=>{
      const y=286+i*43,color=e.isYou?"#f1d07a":"#dce5eb";
      children.push(this.add.text(72,y,`${e.rank}.  ${e.name}${e.isYou?"  · TÚ":""}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:e.isYou?"bold":"normal",color}).setOrigin(0,.5));
      children.push(this.add.text(468,y,`${e.strokes}       ${(e.timeMs/1000).toFixed(1)}s`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color}).setOrigin(1,.5));
    });
  }

  private closeLeaderboard():void{this.leaderboardPanel?.destroy(true);this.leaderboardPanel=null;}
  private allCurrentLevelsCompleted():boolean{return[...levelsForMode("classic"),...levelsForMode("troll")].every(level=>SaveSystem.record(level.id).completed);}

  private async openGameSurvey():Promise<void>{
    const askRating=(label:string):number=>{const raw=window.prompt(`${label} (1–5)`,"4");const n=Number(raw);return Number.isInteger(n)&&n>=1&&n<=5?n:4;};
    const overallFun=askRating("Diversión general");
    const controls=askRating("Controles / game feel");
    const variety=askRating("Variedad de niveles");
    const difficultyCurve=askRating("Progresión de dificultad");
    const hardMode=askRating("Modo HARD");
    const wouldKeepPlaying=window.confirm("Si hubiera otro bloque de 10 hoyos, ¿seguirías jugando?");
    const favouriteLevel=window.prompt("Nivel favorito (opcional). Ej: classic-07","")??"";
    const worstLevel=window.prompt("Peor nivel (opcional)","")??"";
    const ideas=window.prompt("¿Qué cambiarías o añadirías? Ideas libres","")??"";
    await BetaTelemetry.submitGameFeedback({overallFun,controls,variety,difficultyCurve,hardMode,wouldKeepPlaying,favouriteLevel,worstLevel,ideas});
  }

  private closeSurvey():void{this.surveyPanel?.destroy(true);this.surveyPanel=null;}

  private openFeedback():void{
    if(this.feedbackPanel)return;
    const blocker=this.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive();
    const panel=this.add.rectangle(270,480,430,500,0x111a22,.99).setStrokeStyle(2,0x405668);
    const title=this.add.text(270,285,`FEEDBACK · ${this.resultData.levelId.toUpperCase()}`,{fontFamily:"system-ui, sans-serif",fontSize:"18px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    const sub=this.add.text(270,322,"Reporte rápido adicional",{fontFamily:"system-ui, sans-serif",fontSize:"13px",color:"#aebbc6"}).setOrigin(.5);
    const children:Phaser.GameObjects.GameObject[]=[blocker,panel,title,sub];
    const choices:[string,BetaFeedbackCategory][]=[["BUG","bug"],["MUY FÁCIL","too-easy"],["MUY DIFÍCIL","too-hard"],["REPETITIVO","repetitive"],["OBJETO / MAPA","object"],["OTRO","other"]];
    choices.forEach(([label,category],i)=>{const col=i%2,row=Math.floor(i/2),x=170+col*200,y=382+row*76;const bg=this.add.rectangle(x,y,170,56,0x1a2731).setStrokeStyle(1,0x496173).setInteractive({useHandCursor:true});const text=this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#dfe9ef"}).setOrigin(.5).setInteractive({useHandCursor:true});const choose=()=>this.saveFeedback(category);bg.on("pointerup",choose);text.on("pointerup",choose);children.push(bg,text);});
    const close=this.add.text(270,672,"CERRAR",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#8596a4"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeFeedback());children.push(close);
    this.feedbackPanel=this.add.container(0,0,children).setDepth(200);
  }

  private saveFeedback(category:BetaFeedbackCategory):void{
    const note=window.prompt("Nota opcional. Ej: 'el bumper no sirve para nada'","")??"";
    BetaFeedbackSystem.add({levelId:this.resultData.levelId,mode:this.resultData.mode,levelIndex:this.resultData.levelIndex,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs},category,note);
    this.closeFeedback();
    const toast=this.add.text(270,860,"FEEDBACK GUARDADO",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#e8f5ea",backgroundColor:"#14231a",padding:{x:12,y:8}}).setOrigin(.5).setDepth(220);this.tweens.add({targets:toast,alpha:0,y:850,delay:850,duration:250,onComplete:()=>toast.destroy()});
  }
  private closeFeedback():void{this.feedbackPanel?.destroy(true);this.feedbackPanel=null;}
}
