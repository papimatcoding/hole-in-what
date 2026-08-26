import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelFor } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { drawCourse, drawDynamicCourse } from "../systems/CourseRenderer";
import { GOLF_PHYSICS, GolfSimulation, powerFromPhysicalPull, type SimulationEvent } from "../systems/GolfSimulation";
import type { CourseMechanic, LevelDefinition, RectDef, Vec2 } from "../types";

type EditorTool="wall"|"sand"|"ice"|"void"|"bumper"|"booster"|"fan"|"portal"|"ramp"|"trampoline"|"curve"|"moving-wall"|"moving-bumper"|"ball"|"hole"|"erase";
const TOOLS:EditorTool[]=["wall","sand","ice","void","bumper","booster","fan","portal","ramp","trampoline","curve","moving-wall","moving-bumper","ball","hole","erase"];
const TOOL_LABEL:Record<EditorTool,string>={wall:"MURO",sand:"ARENA",ice:"HIELO",void:"VACÍO",bumper:"BUMPER",booster:"BOOST",fan:"FAN",portal:"PORTAL",ramp:"RAMPA",trampoline:"TRAMP",curve:"CURVA","moving-wall":"MURO MÓVIL","moving-bumper":"BUMPER MÓVIL",ball:"BOLA",hole:"HOYO",erase:"BORRAR"};
const RECT_TOOLS=new Set<EditorTool>(["wall","sand","ice","void","booster","fan","ramp","moving-wall"]);
const DRAFT_KEY="troll-golf-editor-draft-v1";

function clone<T>(x:T):T{return JSON.parse(JSON.stringify(x)) as T;}
function blank():LevelDefinition{return{id:"editor-draft",mode:"classic",group:1,authored:true,primaryMechanic:"wall",ball:{x:270,y:820},hole:{x:270,y:175},threeStar:{maxStrokes:2},twoStar:{maxStrokes:4},walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]};}
function normalRect(a:Vec2,b:Vec2):RectDef{const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return{x,y,w:Math.max(8,Math.abs(b.x-a.x)),h:Math.max(8,Math.abs(b.y-a.y))};}
function direction(index:number):Vec2{return[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}][((index%4)+4)%4]!;}

export class EditorScene extends Phaser.Scene{
  private draft:LevelDefinition=blank();
  private toolIndex=0;
  private orientation=0;
  private history:LevelDefinition[]=[];
  private course!:Phaser.GameObjects.Graphics;
  private dynamic!:Phaser.GameObjects.Graphics;
  private overlay!:Phaser.GameObjects.Graphics;
  private ball!:Phaser.GameObjects.Arc;
  private toolText!:Phaser.GameObjects.Text;
  private statusText!:Phaser.GameObjects.Text;
  private parText!:Phaser.GameObjects.Text;
  private feedbackText!:Phaser.GameObjects.Text;
  private dragStart:Vec2|null=null;
  private portalStart:Vec2|null=null;
  private play=false;
  private sim!:GolfSimulation;
  private strokes=0;
  private aimStart:Vec2|null=null;

  constructor(){super("editor");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");this.loadDraft();
    this.course=this.add.graphics().setDepth(0);this.dynamic=this.add.graphics().setDepth(4);this.overlay=this.add.graphics().setDepth(20);
    this.ball=this.add.circle(this.draft.ball.x,this.draft.ball.y,GOLF_PHYSICS.ballRadius,0xf5f7fa,1).setStrokeStyle(2,0xaec7d6,.8).setDepth(12);
    this.createUi();this.rebuildPreview();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.pointerDown(p));this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.pointerMove(p));this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.pointerUp(p));
    sharpenSceneText(this);
  }

  update(time:number,deltaMs:number):void{
    drawDynamicCourse(this.dynamic,this.draft,time/1000);
    if(!this.play)return;
    const events=this.sim.state.moving?this.sim.step(Math.min(.033,deltaMs/1000)):[];this.consume(events);
    const b=this.sim.state.ball;this.ball.setPosition(b.x,b.y-Math.max(0,b.z)*.18);
    drawCourse(this.course,this.draft,this.sim.state);
  }

  private createUi():void{
    const bar=this.add.rectangle(270,55,500,78,0x0b1117,.94).setStrokeStyle(1,0x344554,.9).setDepth(40);
    const back=this.textButton("‹",48,52,()=>this.scene.start("menu"),28);
    this.textButton("◀",105,52,()=>this.changeTool(-1),20);this.textButton("▶",225,52,()=>this.changeTool(1),20);
    this.toolText=this.add.text(165,52,TOOL_LABEL[TOOLS[this.toolIndex]!],{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5).setDepth(42);
    this.textButton("↻",263,52,()=>{this.orientation=(this.orientation+1)%4;this.toast(`Orientación ${this.orientation+1}/4`);},20);
    this.textButton("UNDO",315,52,()=>this.undo(),11);this.textButton("TEST",374,52,()=>this.togglePlay(),11);this.textButton("JSON",429,52,()=>void this.exportDraft(),11);this.textButton("LOAD",482,52,()=>this.loadCourse(),11);
    back.setDepth(42);bar.setDepth(40);
    this.statusText=this.add.text(42,101,"EDITOR BETA · arrastra para rectángulos · toca para objetos",{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#afbeca"}).setDepth(42);
    this.parText=this.add.text(498,101,"",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#e5cc82"}).setOrigin(1,0).setDepth(42).setInteractive({useHandCursor:true}).on("pointerup",()=>this.editPar());
    this.textButton("NUEVO",78,914,()=>this.newDraft(),11);this.feedbackText=this.add.text(270,914,"",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#b8c7d2"}).setOrigin(.5).setDepth(42).setInteractive({useHandCursor:true}).on("pointerup",()=>void this.copyFeedback());this.textButton("LIMPIAR",458,914,()=>this.clearObjects(),11);
    this.refreshUi();
  }

  private textButton(label:string,x:number,y:number,action:()=>void,size=12):Phaser.GameObjects.Text{return this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:`${size}px`,fontStyle:"bold",color:"#e7eef4"}).setOrigin(.5).setDepth(42).setInteractive({useHandCursor:true}).on("pointerup",action);}
  private refreshUi():void{this.toolText?.setText(`${TOOL_LABEL[TOOLS[this.toolIndex]!]} ${this.orientation>0?`· ${this.orientation+1}`:""}`);this.parText?.setText(`★★★ ${this.draft.threeStar.maxStrokes??"-"} · ★★ ${this.draft.twoStar.maxStrokes??"-"}`);this.feedbackText?.setText(`FEEDBACK ${BetaFeedbackSystem.count()} · COPIAR`);}
  private changeTool(delta:number):void{this.toolIndex=(this.toolIndex+delta+TOOLS.length)%TOOLS.length;this.portalStart=null;this.overlay.clear();this.refreshUi();}
  private activeTool():EditorTool{return TOOLS[this.toolIndex]!;}

  private pointerDown(pointer:Phaser.Input.Pointer):void{
    const p=pointerToDesign(this,pointer);if(p.y<125||p.y>890)return;
    if(this.play){const b=this.sim.state.ball;if(this.sim.state.moving||this.sim.isAirborne())return;if(Phaser.Math.Distance.Between(p.x,p.y,b.x,b.y)<=62){this.aimStart=p;this.drawAim(p);}return;}
    if(RECT_TOOLS.has(this.activeTool())){this.dragStart=p;this.overlay.clear();}
  }
  private pointerMove(pointer:Phaser.Input.Pointer):void{
    const p=pointerToDesign(this,pointer);if(this.play&&this.aimStart){this.drawAim(p);return;}if(!this.dragStart)return;const r=normalRect(this.dragStart,p);this.overlay.clear();this.overlay.fillStyle(0xdcecff,.16);this.overlay.fillRect(r.x,r.y,r.w,r.h);this.overlay.lineStyle(2,0xdcecff,.8);this.overlay.strokeRect(r.x,r.y,r.w,r.h);
  }
  private pointerUp(pointer:Phaser.Input.Pointer):void{
    const p=pointerToDesign(this,pointer);if(p.y<125||p.y>890)return;
    if(this.play){this.finishAim(p);return;}
    const tool=this.activeTool();
    if(RECT_TOOLS.has(tool)&&this.dragStart){const start=this.dragStart;this.dragStart=null;this.overlay.clear();const r=normalRect(start,p);if(r.w<14||r.h<14)return;this.snapshot();this.addRectTool(tool,r);this.changed();return;}
    this.snapshot();
    if(tool==="ball")this.draft.ball={x:p.x,y:p.y};
    else if(tool==="hole")this.draft.hole={x:p.x,y:p.y};
    else if(tool==="bumper")(this.draft.bumpers??=[]).push({x:p.x,y:p.y,r:32});
    else if(tool==="trampoline")(this.draft.trampolines??=[]).push({x:p.x,y:p.y,r:34,power:440});
    else if(tool==="moving-bumper")(this.draft.movingBumpers??=[]).push({x:p.x,y:p.y,r:30,axis:this.orientation%2===0?"x":"y",amplitude:70,speed:1.1});
    else if(tool==="curve"){const a=this.orientation*Math.PI/2;(this.draft.curves??=[]).push({x:p.x,y:p.y,r:92,startAngle:a,endAngle:a+Math.PI/2,thickness:24});}
    else if(tool==="portal"){if(!this.portalStart){this.history.pop();this.portalStart={x:p.x,y:p.y};this.toast("Portal A colocado · toca salida");return;}else{(this.draft.portals??=[]).push({a:{...this.portalStart,r:28},b:{x:p.x,y:p.y,r:28}});this.portalStart=null;}}
    else if(tool==="erase"){if(!this.eraseAt(p)){this.history.pop();return;}}
    else{this.history.pop();return;}
    this.changed();
  }

  private addRectTool(tool:EditorTool,r:RectDef):void{
    const d=direction(this.orientation);
    if(tool==="wall")(this.draft.walls??=[]).push(r);
    else if(tool==="sand")(this.draft.sand??=[]).push(r);
    else if(tool==="ice")(this.draft.ice??=[]).push(r);
    else if(tool==="void")(this.draft.voids??=[]).push(r);
    else if(tool==="booster")(this.draft.boosters??=[]).push({...r,dx:d.x,dy:d.y,power:1.05});
    else if(tool==="fan")(this.draft.fans??=[]).push({...r,dx:d.x,dy:d.y,strength:285});
    else if(tool==="ramp")(this.draft.ramps??=[]).push({...r,dx:d.x,dy:d.y,lift:350,boost:1.03});
    else if(tool==="moving-wall")(this.draft.movingWalls??=[]).push({...r,axis:this.orientation%2===0?"x":"y",amplitude:72,speed:1});
    const mechanics:Partial<Record<EditorTool,CourseMechanic>>={wall:"wall",sand:"sand",ice:"ice",void:"void",booster:"booster",fan:"fan",ramp:"ramp","moving-wall":"moving"};if(mechanics[tool])this.draft.primaryMechanic=mechanics[tool];
  }

  private eraseAt(p:Vec2):boolean{
    const rectKeys:(keyof LevelDefinition)[]=["walls","sand","ice","voids","boosters","fans","ramps","movingWalls"];
    for(const key of rectKeys){const arr=this.draft[key] as RectDef[]|undefined;if(!arr)continue;for(let i=arr.length-1;i>=0;i--){const r=arr[i]!;if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){arr.splice(i,1);return true;}}}
    const circleSets:[keyof LevelDefinition,number][]=[["bumpers",38],["trampolines",40],["movingBumpers",38]];for(const [key,dist] of circleSets){const arr=this.draft[key] as {x:number;y:number}[]|undefined;if(!arr)continue;for(let i=arr.length-1;i>=0;i--){const q=arr[i]!;if(Phaser.Math.Distance.Between(p.x,p.y,q.x,q.y)<dist){arr.splice(i,1);return true;}}}
    const portals=this.draft.portals??[];for(let i=portals.length-1;i>=0;i--){const q=portals[i]!;if(Math.min(Phaser.Math.Distance.Between(p.x,p.y,q.a.x,q.a.y),Phaser.Math.Distance.Between(p.x,p.y,q.b.x,q.b.y))<40){portals.splice(i,1);return true;}}
    const curves=this.draft.curves??[];for(let i=curves.length-1;i>=0;i--){const c=curves[i]!;if(Math.abs(Phaser.Math.Distance.Between(p.x,p.y,c.x,c.y)-c.r)<30){curves.splice(i,1);return true;}}
    return false;
  }

  private snapshot():void{this.history.push(clone(this.draft));if(this.history.length>40)this.history.shift();}
  private undo():void{const previous=this.history.pop();if(!previous)return;this.draft=previous;this.portalStart=null;this.changed(false);}
  private changed(save=true):void{if(save)this.saveDraft();this.rebuildPreview();this.refreshUi();}
  private rebuildPreview():void{this.sim=new GolfSimulation(this.draft);drawCourse(this.course,this.draft,this.sim.state);drawDynamicCourse(this.dynamic,this.draft,0);this.ball.setPosition(this.draft.ball.x,this.draft.ball.y).setVisible(true);}

  private togglePlay():void{this.play=!this.play;this.overlay.clear();this.aimStart=null;this.strokes=0;this.sim=new GolfSimulation(this.draft);this.ball.setPosition(this.draft.ball.x,this.draft.ball.y);this.statusText.setText(this.play?"PLAYTEST · arrastra desde la bola · TEST para volver":"EDITOR BETA · arrastra para rectángulos · toca para objetos");this.toast(this.play?"PLAYTEST":"EDICIÓN");}
  private drawAim(p:Vec2):void{const b=this.sim.state.ball,dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy)||1,power=powerFromPhysicalPull(len),ux=dx/len,uy=dy/len,pull=Math.min(len,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);this.overlay.clear();this.overlay.lineStyle(4,0x8bc5ff,.9);this.overlay.beginPath();this.overlay.moveTo(b.x,b.y);this.overlay.lineTo(b.x-ux*pull,b.y-uy*pull);this.overlay.strokePath();this.overlay.fillStyle(0xeaf6ff,.65);for(let i=1;i<=7;i++){const q=i/7,reach=70+power*105;this.overlay.fillCircle(b.x+ux*reach*q,b.y+uy*reach*q,3);}}
  private finishAim(p:Vec2):void{if(!this.aimStart)return;this.aimStart=null;this.overlay.clear();const b=this.sim.state.ball,dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy);if(len<12)return;const angle=Math.atan2(dy,dx),power=powerFromPhysicalPull(len);if(this.sim.launch(angle,power)){this.strokes++;this.toast(`Golpe ${this.strokes}`);}}
  private consume(events:SimulationEvent[]):void{for(const e of events){if(e.kind==="void"){this.sim.resetAfterVoid();this.toast("VOID · reset");}else if(e.kind==="hole"){this.play=false;this.overlay.clear();this.toast(`HOYO EN ${this.strokes} ${this.strokes===1?"GOLPE":"GOLPES"}`);this.time.delayedCall(500,()=>{this.rebuildPreview();this.statusText.setText("EDITOR BETA · ajusta y vuelve a probar");});}}}

  private saveDraft():void{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(this.draft));}catch{/* optional */}}
  private loadDraft():void{try{const raw=localStorage.getItem(DRAFT_KEY);if(raw)this.draft=JSON.parse(raw) as LevelDefinition;}catch{this.draft=blank();}}
  private newDraft():void{if(!window.confirm("¿Crear mapa nuevo? El borrador actual se reemplazará."))return;this.snapshot();this.draft=blank();this.changed();this.toast("Mapa nuevo");}
  private clearObjects():void{if(!window.confirm("¿Borrar todos los obstáculos del borrador?"))return;this.snapshot();const keep=blank();keep.id=this.draft.id;keep.ball=clone(this.draft.ball);keep.hole=clone(this.draft.hole);keep.threeStar=clone(this.draft.threeStar);keep.twoStar=clone(this.draft.twoStar);this.draft=keep;this.changed();}
  private loadCourse():void{const raw=window.prompt("Carga un nivel: classic-01 o troll-01",this.draft.id);if(!raw)return;const m=/^(classic|troll)-(\d{1,2})$/i.exec(raw.trim());if(!m){this.toast("ID no válido");return;}const mode=m[1]!.toLowerCase() as "classic"|"troll",index=Math.max(0,Math.min(39,Number(m[2])-1));this.snapshot();this.draft=clone(levelFor(mode,index));this.saveDraft();this.rebuildPreview();this.refreshUi();this.toast(`${this.draft.id} cargado`);}
  private editPar():void{const three=Number(window.prompt("Golpes para ★★★",String(this.draft.threeStar.maxStrokes??2)));if(!Number.isFinite(three)||three<1)return;const two=Number(window.prompt("Golpes para ★★",String(this.draft.twoStar.maxStrokes??three+2)));if(!Number.isFinite(two)||two<three)return;this.snapshot();this.draft.threeStar={maxStrokes:Math.round(three)};this.draft.twoStar={maxStrokes:Math.round(two)};this.changed();}
  private async exportDraft():Promise<void>{const json=JSON.stringify(this.draft,null,2);try{await navigator.clipboard.writeText(json);this.toast("JSON COPIADO");}catch{window.prompt("Copia el JSON",json);}}
  private async copyFeedback():Promise<void>{if(await BetaFeedbackSystem.copyAll())this.toast(`${BetaFeedbackSystem.count()} FEEDBACK COPIADOS`);else window.prompt("Copia el feedback",BetaFeedbackSystem.exportText());}
  private toast(message:string):void{const t=this.add.text(270,860,message,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#f4f7fa",backgroundColor:"#111a22",padding:{x:12,y:8}}).setOrigin(.5).setDepth(100);this.tweens.add({targets:t,alpha:0,y:850,delay:900,duration:260,onComplete:()=>t.destroy()});}
}
