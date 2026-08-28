import Phaser from "phaser";
import { BetaFeedbackSystem, type BetaFeedbackCategory } from "./BetaFeedbackSystem";
import { BetaTelemetry } from "./BetaTelemetrySystem";
import { I18n } from "./I18nSystem";
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
  let selected:BetaFeedbackCategory|null=null;
  let submitting=false;
  let closed=false;
  const categoryButtons:Array<{bg:Phaser.GameObjects.Rectangle;category:BetaFeedbackCategory}>=[];

  const area=document.createElement("textarea");
  area.maxLength=400;
  area.placeholder="Escribe aquí…";
  area.setAttribute("aria-label","Detalle del reporte");
  Object.assign(area.style,{width:"330px",height:"118px",resize:"none",boxSizing:"border-box",border:"1px solid #496173",borderRadius:"8px",background:"#0d151b",color:"#e5eef3",padding:"12px",font:"14px system-ui",outline:"none"});
  I18n.localizeDom(area);

  let panel!:Phaser.GameObjects.Container;
  const close=():void=>{
    if(closed)return;
    closed=true;
    panel.destroy(true);
    onClose?.();
  };
  const submit=async(status:Phaser.GameObjects.Text):Promise<void>=>{
    if(submitting)return;
    if(!selected){status.setText("ELIGE UNA CATEGORÍA");return;}
    submitting=true;
    const category=selected;
    const note=area.value.trim().slice(0,400);
    status.setText("ENVIANDO…");
    BetaFeedbackSystem.add({
      levelId:context.levelId,
      mode:context.mode,
      levelIndex:context.levelIndex,
      strokes:context.strokes??0,
      timeMs:context.timeMs??0
    },category,note);
    // Close before awaiting the network so repeated taps cannot create duplicate submissions.
    close();
    const sent=await BetaTelemetry.submitReport({
      levelId:context.levelId,
      mode:context.mode,
      category,
      note,
      strokes:context.strokes??null,
      timeMs:context.timeMs??null
    });
    const toast=scene.add.text(270,164,sent?"✓ REPORTE ENVIADO":"✓ GUARDADO LOCAL · SIN RED",{
      fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#d9efde",backgroundColor:"#14231a",padding:{x:12,y:7}
    }).setOrigin(.5).setDepth(1000);
    scene.tweens.add({targets:toast,alpha:0,delay:850,duration:180,onComplete:()=>toast.destroy()});
  };

  children.push(scene.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive());
  children.push(scene.add.rectangle(270,480,448,640,0x111a22,.99).setStrokeStyle(2,0x496173));
  children.push(scene.add.text(270,194,`REPORTAR · ${context.levelId.toUpperCase()}`,{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));
  children.push(scene.add.text(270,224,"No hace falta completar el hoyo.",{fontFamily:"system-ui",fontSize:"10px",color:"#8da0ad"}).setOrigin(.5));
  CHOICES.forEach(([label,category],i)=>{
    const x=170+(i%2)*200,y=294+Math.floor(i/2)*66;
    const bg=scene.add.rectangle(x,y,180,52,0x1a2731).setStrokeStyle(1,0x52697a).setInteractive({useHandCursor:true});
    const t=scene.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#e2ebf1"}).setOrigin(.5);
    categoryButtons.push({bg,category});
    bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);});
    bg.on("pointerout",()=>{bg.setScale(1);t.setScale(1);});
    bg.on("pointerup",()=>{
      bg.setScale(1);t.setScale(1);selected=category;
      for(const item of categoryButtons)item.bg.setFillStyle(item.category===category?0x345368:0x1a2731);
    });
    children.push(bg,t);
  });
  children.push(scene.add.text(270,470,"DETALLE DEL REPORTE",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#c9d5de"}).setOrigin(.5));
  children.push(scene.add.text(270,490,"Detalle opcional · máximo 400 caracteres",{fontFamily:"system-ui",fontSize:"9px",color:"#8da0ad"}).setOrigin(.5));
  children.push(scene.add.dom(270,566,area));
  const status=scene.add.text(270,644,"",{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#efc08d"}).setOrigin(.5);children.push(status);

  const closeBg=scene.add.rectangle(170,704,180,50,0x141d24).setStrokeStyle(1,0x354652).setInteractive({useHandCursor:true});
  const closeText=scene.add.text(170,704,"CERRAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#94a5b1"}).setOrigin(.5);
  closeBg.on("pointerdown",()=>{closeBg.setScale(.98);closeText.setScale(.98);}).on("pointerout",()=>{closeBg.setScale(1);closeText.setScale(1);}).on("pointerup",()=>{closeBg.setScale(1);closeText.setScale(1);close();});
  const sendBg=scene.add.rectangle(370,704,180,50,0x29485a).setStrokeStyle(1,0x5c7e91).setInteractive({useHandCursor:true});
  const sendText=scene.add.text(370,704,"ENVIAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#e3f1f7"}).setOrigin(.5);
  sendBg.on("pointerdown",()=>{sendBg.setScale(.98);sendText.setScale(.98);}).on("pointerout",()=>{sendBg.setScale(1);sendText.setScale(1);}).on("pointerup",()=>{sendBg.setScale(1);sendText.setScale(1);void submit(status);});
  children.push(closeBg,closeText,sendBg,sendText);

  panel=scene.add.container(0,0,children).setDepth(900);
  return panel;
}
