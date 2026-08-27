import Phaser from "phaser";
import { BetaFeedbackSystem, type BetaFeedbackCategory } from "./BetaFeedbackSystem";
import { BetaTelemetry } from "./BetaTelemetrySystem";
import type { GameMode } from "../types";

export interface BetaReportContext{
  levelId:string;
  mode:GameMode;
  levelIndex:number;
  strokes?:number|null;
  timeMs?:number|null;
}

const CHOICES:Array<[string,BetaFeedbackCategory]>=[
  ["BUG","bug"],
  ["MUY FÁCIL","too-easy"],
  ["MUY DIFÍCIL","too-hard"],
  ["REPETITIVO","repetitive"],
  ["OBJETO SOBRA","object"],
  ["OTRO","other"]
];

export function openBetaReport(scene:Phaser.Scene,context:BetaReportContext,onClose?:()=>void):Phaser.GameObjects.Container{
  const children:Phaser.GameObjects.GameObject[]=[];
  const close=():void=>{panel.destroy(true);onClose?.();};
  const submit=async(category:BetaFeedbackCategory):Promise<void>=>{
    const note=category==="other"?(window.prompt("Cuéntanos qué pasó","")??""):"";
    BetaFeedbackSystem.add({
      levelId:context.levelId,
      mode:context.mode,
      levelIndex:context.levelIndex,
      strokes:context.strokes??0,
      timeMs:context.timeMs??0
    },category,note);
    const sent=await BetaTelemetry.submitReport({
      levelId:context.levelId,
      mode:context.mode,
      category,
      note,
      strokes:context.strokes??null,
      timeMs:context.timeMs??null
    });
    close();
    const toast=scene.add.text(270,164,sent?"✓ REPORTE ENVIADO":"✓ GUARDADO LOCAL · SIN RED",{
      fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#d9efde",backgroundColor:"#14231a",padding:{x:12,y:7}
    }).setOrigin(.5).setDepth(1000);
    scene.tweens.add({targets:toast,alpha:0,delay:850,duration:180,onComplete:()=>toast.destroy()});
  };

  children.push(scene.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive());
  children.push(scene.add.rectangle(270,480,438,438,0x111a22,.99).setStrokeStyle(2,0x496173));
  children.push(scene.add.text(270,296,`REPORTAR · ${context.levelId.toUpperCase()}`,{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));
  children.push(scene.add.text(270,326,"No hace falta completar el hoyo.",{fontFamily:"system-ui",fontSize:"10px",color:"#8da0ad"}).setOrigin(.5));
  CHOICES.forEach(([label,category],i)=>{
    const x=170+(i%2)*200,y=390+Math.floor(i/2)*70;
    const bg=scene.add.rectangle(x,y,174,52,0x1a2731).setStrokeStyle(1,0x52697a).setInteractive({useHandCursor:true});
    const t=scene.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#e2ebf1"}).setOrigin(.5);
    bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);});
    bg.on("pointerout",()=>{bg.setScale(1);t.setScale(1);});
    bg.on("pointerup",()=>{bg.setScale(1);t.setScale(1);void submit(category);});
    children.push(bg,t);
  });
  const closeBg=scene.add.rectangle(270,642,164,42,0x141d24).setStrokeStyle(1,0x354652).setInteractive({useHandCursor:true});
  const closeText=scene.add.text(270,642,"CERRAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#94a5b1"}).setOrigin(.5);
  closeBg.on("pointerup",close);children.push(closeBg,closeText);

  const panel=scene.add.container(0,0,children).setDepth(900);
  return panel;
}
