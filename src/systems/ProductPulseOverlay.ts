import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_HEIGHT, DESIGN_WIDTH, uiFontSize } from "../config/display";
import { levelsForMode } from "../data/campaign";
import { BetaTelemetry } from "./BetaTelemetrySystem";
import { I18n } from "./I18nSystem";
import { ProductTelemetry, type PurchaseIntent } from "./ProductTelemetrySystem";
import { SaveSystem } from "./SaveSystem";
import type { GameMode } from "../types";

function eligibleContext():{levelId:string;mode:GameMode}|null{
  const hard=levelsForMode("troll").find(level=>SaveSystem.record(level.id).completed);
  if(hard)return{levelId:hard.id,mode:"troll"};
  const classic=levelsForMode("classic").filter(level=>SaveSystem.record(level.id).completed);
  if(classic.length<3)return null;
  return{levelId:classic[Math.min(2,classic.length-1)]!.id,mode:"classic"};
}

export function maybeOpenProductPulse(scene:Phaser.Scene):void{
  if(!BETA_TESTING||ProductTelemetry.pulseDone()||ProductTelemetry.pulseSnoozed())return;
  if((BetaTelemetry.alias()??"").trim().toUpperCase().startsWith("DEV"))return;
  const context=eligibleContext();if(!context)return;
  scene.time.delayedCall(520,()=>openPulse(scene,context));
}

function openPulse(scene:Phaser.Scene,context:{levelId:string;mode:GameMode}):void{
  if(ProductTelemetry.pulseDone()||ProductTelemetry.pulseSnoozed())return;
  ProductTelemetry.track({eventName:"pulse_view",scene:"menu",levelId:context.levelId,mode:context.mode});
  const es=I18n.language()==="es";
  let keepPlaying:boolean|null=null,purchase:PurchaseIntent|null=null,submitting=false;
  const root=scene.add.container(0,0).setDepth(500);
  const blocker=scene.add.rectangle(DESIGN_WIDTH/2,DESIGN_HEIGHT/2,DESIGN_WIDTH,DESIGN_HEIGHT,0x05080b,.78).setInteractive();
  const card=scene.add.rectangle(270,476,458,470,0x111a22,.995).setStrokeStyle(2,0x496579);
  const title=scene.add.text(270,292,es?"DOS PREGUNTAS Y YA":"TWO QUICK QUESTIONS",{fontFamily:"system-ui",fontSize:uiFontSize(18,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
  const subtitle=scene.add.text(270,326,es?"Esto nos ayuda más que una encuesta larga.":"This helps us more than a long survey.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#8fa3b0"}).setOrigin(.5);
  const q1=scene.add.text(270,382,es?"¿SEGUIRÍAS JUGANDO?":"WOULD YOU KEEP PLAYING?",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#d8e4eb"}).setOrigin(.5);
  const q2=scene.add.text(270,506,es?"SI EL JUEGO COMPLETO COSTARA 4,99 €…":"IF THE FULL GAME COST €4.99…",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#d8e4eb"}).setOrigin(.5);
  const hint=scene.add.text(270,536,es?"¿Lo comprarías?":"Would you buy it?",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#8395a2"}).setOrigin(.5);
  root.add([blocker,card,title,subtitle,q1,q2,hint]);

  const redraw=():void=>{
    root.getAll().filter(obj=>(obj as any).name?.startsWith("pulse-choice-")).forEach(obj=>obj.destroy());
    choice(190,438,140,es?"SÍ":"YES",keepPlaying===true,()=>{keepPlaying=true;redraw();},"keep-yes");
    choice(350,438,140,"NO",keepPlaying===false,()=>{keepPlaying=false;redraw();},"keep-no");
    choice(132,592,112,es?"SÍ":"YES",purchase==="yes",()=>{purchase="yes";redraw();},"buy-yes");
    choice(270,592,112,es?"QUIZÁS":"MAYBE",purchase==="maybe",()=>{purchase="maybe";redraw();},"buy-maybe");
    choice(408,592,112,"NO",purchase==="no",()=>{purchase="no";redraw();},"buy-no");
    const canSend=keepPlaying!==null&&purchase!==null&&!submitting;
    action(270,680,300,submitting?(es?"ENVIANDO…":"SENDING…"):(es?"ENVIAR":"SEND"),canSend,async()=>{
      if(!canSend||keepPlaying===null||purchase===null)return;
      submitting=true;redraw();
      const ok=await ProductTelemetry.submitPulse({wouldKeepPlaying:keepPlaying,purchaseIntent:purchase,contextLevelId:context.levelId,mode:context.mode});
      if(!ok){submitting=false;redraw();return;}
      root.removeAll(true);
      const thanks=scene.add.text(270,476,es?"✓ GRACIAS":"✓ THANK YOU",{fontFamily:"system-ui",fontSize:uiFontSize(18,2),fontStyle:"bold",color:"#a7ddb9",backgroundColor:"#111a22",padding:{x:28,y:18}}).setOrigin(.5).setDepth(501);
      scene.time.delayedCall(700,()=>thanks.destroy());
    },"send");
    action(270,738,180,es?"AHORA NO":"NOT NOW",true,()=>{ProductTelemetry.snoozePulse();root.destroy(true);},"skip",false);
  };

  const choice=(x:number,y:number,w:number,label:string,selected:boolean,fn:()=>void,id:string):void=>{
    const bg=scene.add.rectangle(x,y,w,48,selected?0x355a6d:0x17242d).setStrokeStyle(selected?2:1,selected?0x83b3ca:0x405767).setInteractive({useHandCursor:true}).setName(`pulse-choice-${id}`);
    const text=scene.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:selected?"#f3f9fc":"#d6e0e6"}).setOrigin(.5).setName(`pulse-choice-${id}-text`);
    bg.on("pointerup",fn);root.add([bg,text]);
  };
  const action=(x:number,y:number,w:number,label:string,enabled:boolean,fn:()=>void|Promise<void>,id:string,primary=true):void=>{
    const bg=scene.add.rectangle(x,y,w,50,enabled?(primary?0x29485a:0x17232c):0x10171c).setStrokeStyle(1,enabled?(primary?0x78a9c2:0x40515e):0x27313a).setName(`pulse-choice-${id}`);
    const text=scene.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:enabled?"#e8f0f4":"#596772"}).setOrigin(.5).setName(`pulse-choice-${id}-text`);
    if(enabled)bg.setInteractive({useHandCursor:true}).on("pointerup",()=>{void fn();});root.add([bg,text]);
  };
  redraw();
}
