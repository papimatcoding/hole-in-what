import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelFor, levelsForMode } from "../data/campaign";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { drawCourse, drawDynamicCourse } from "../systems/CourseRenderer";
import { GOLF_PHYSICS, GolfSimulation, powerFromPhysicalPull, type SimulationEvent } from "../systems/GolfSimulation";
import type { CourseMechanic, CurveDef, LevelDefinition, PortalPairDef, RectDef, Vec2 } from "../types";

type EditorTool="select"|"wall"|"sand"|"ice"|"void"|"bumper"|"booster"|"fan"|"portal"|"ramp"|"trampoline"|"curve"|"moving-wall"|"moving-bumper"|"ball"|"hole";
type RectKey="walls"|"sand"|"ice"|"voids"|"boosters"|"fans"|"ramps"|"movingWalls";
type CircleKey="bumpers"|"trampolines"|"movingBumpers";
type Selection=
  |{kind:"rect";key:RectKey;index:number}
  |{kind:"circle";key:CircleKey;index:number}
  |{kind:"curve";index:number}
  |{kind:"portal";index:number}
  |{kind:"ball"}
  |{kind:"hole"};

type TransformMode="move"|"resize";

const TOOLS:EditorTool[]=["select","wall","sand","ice","void","bumper","booster","fan","portal","ramp","trampoline","curve","moving-wall","moving-bumper","ball","hole"];
const TOOL_LABEL:Record<EditorTool,string>={select:"SELECCIONAR",wall:"MURO",sand:"ARENA",ice:"HIELO",void:"VACÍO",bumper:"BUMPER",booster:"BOOST",fan:"FAN",portal:"PORTAL",ramp:"RAMPA",trampoline:"TRAMP",curve:"CURVA","moving-wall":"MURO MÓVIL","moving-bumper":"BUMPER MÓVIL",ball:"BOLA",hole:"HOYO"};
const RECT_TOOLS=new Set<EditorTool>(["wall","sand","ice","void","booster","fan","ramp","moving-wall"]);
const RECT_KEYS:RectKey[]=["walls","sand","ice","voids","boosters","fans","ramps","movingWalls"];
const CIRCLE_KEYS:CircleKey[]=["bumpers","trampolines","movingBumpers"];
const DRAFT_KEY="troll-golf-editor-draft-v2";
const GRID_KEY="troll-golf-editor-grid-v1";
const GRID=20;
const EDIT_TOP=132,EDIT_BOTTOM=888;

function clone<T>(x:T):T{return JSON.parse(JSON.stringify(x)) as T;}
function blank():LevelDefinition{return{id:"editor-draft",mode:"classic",group:1,authored:true,primaryMechanic:"wall",ball:{x:270,y:820},hole:{x:270,y:175},threeStar:{maxStrokes:2},twoStar:{maxStrokes:4},designPath:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]};}
function normalRect(a:Vec2,b:Vec2):RectDef{const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return{x,y,w:Math.max(8,Math.abs(b.x-a.x)),h:Math.max(8,Math.abs(b.y-a.y))};}
function direction(index:number):Vec2{return[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}][((index%4)+4)%4]!;}
function rotateVector(v:{dx:number;dy:number}):void{const dx=v.dx;v.dx=-v.dy;v.dy=dx;}
function clampToField(p:Vec2):Vec2{const f=GOLF_PHYSICS.field;return{x:Phaser.Math.Clamp(p.x,f.x+8,f.x+f.w-8),y:Phaser.Math.Clamp(p.y,EDIT_TOP,f.y+f.h-8)};}

export class EditorScene extends Phaser.Scene{
  private draft:LevelDefinition=blank();
  private requestedLevelId:string|null=null;
  private toolIndex=0;
  private orientation=0;
  private gridEnabled=true;
  private history:LevelDefinition[]=[];
  private selection:Selection|null=null;
  private transformMode:TransformMode|null=null;
  private transformStart:Vec2|null=null;
  private transformBase:LevelDefinition|null=null;
  private course!:Phaser.GameObjects.Graphics;
  private dynamic!:Phaser.GameObjects.Graphics;
  private gridView!:Phaser.GameObjects.Graphics;
  private overlay!:Phaser.GameObjects.Graphics;
  private ball!:Phaser.GameObjects.Arc;
  private toolText!:Phaser.GameObjects.Text;
  private statusText!:Phaser.GameObjects.Text;
  private parText!:Phaser.GameObjects.Text;
  private gridText!:Phaser.GameObjects.Text;
  private playText!:Phaser.GameObjects.Text;
  private feedbackText!:Phaser.GameObjects.Text;
  private dragStart:Vec2|null=null;
  private portalStart:Vec2|null=null;
  private play=false;
  private sim!:GolfSimulation;
  private strokes=0;
  private aimStart:Vec2|null=null;

  constructor(){super("editor");}
  init(data?:{loadLevelId?:string}):void{this.requestedLevelId=data?.loadLevelId??null;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");this.loadDraft();this.loadGridPreference();
    if(this.requestedLevelId)this.loadCourseById(this.requestedLevelId,false);
    this.course=this.add.graphics().setDepth(0);this.gridView=this.add.graphics().setDepth(2);this.dynamic=this.add.graphics().setDepth(4);this.overlay=this.add.graphics().setDepth(20);
    this.ball=this.add.circle(this.draft.ball.x,this.draft.ball.y,GOLF_PHYSICS.ballRadius,0xf5f7fa,1).setStrokeStyle(2,0xaec7d6,.8).setDepth(12);
    this.createUi();this.bindDesktopInput();this.rebuildPreview();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.pointerDown(p));this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.pointerMove(p));this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.pointerUp(p));
    const prevent=(e:MouseEvent):void=>e.preventDefault();this.game.canvas.addEventListener("contextmenu",prevent);this.events.once("shutdown",()=>this.game.canvas.removeEventListener("contextmenu",prevent));
    sharpenSceneText(this);
  }

  update(time:number,deltaMs:number):void{
    drawDynamicCourse(this.dynamic,this.draft,time/1000);
    if(!this.play)return;
    const events=this.sim.state.moving?this.sim.step(Math.min(.033,deltaMs/1000)):[];this.consume(events);
    const b=this.sim.state.ball;this.ball.setPosition(b.x,b.y-Math.max(0,b.z)*.18);drawCourse(this.course,this.draft,this.sim.state);
  }

  private createUi():void{
    this.add.rectangle(270,58,510,104,0x0b1117,.96).setStrokeStyle(1,0x344554,.9).setDepth(40);
    this.textButton("‹",42,42,()=>this.scene.start("menu"),28);
    this.textButton("◀",84,42,()=>this.changeTool(-1),18);
    this.toolText=this.add.text(170,42,"",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5).setDepth(42);
    this.textButton("▶",255,42,()=>this.changeTool(1),18);
    this.textButton("ROTAR",310,42,()=>this.rotateSelected(),10);
    this.textButton("DUP",360,42,()=>this.duplicateSelected(),10);
    this.textButton("UNDO",405,42,()=>this.undo(),10);
    this.playText=this.textButton("TEST",455,42,()=>this.togglePlay(),10);
    this.textButton("JSON",500,42,()=>void this.exportDraft(),10);

    this.gridText=this.textButton("GRID",72,83,()=>this.toggleGrid(),10);
    this.textButton("PREVIEWS",145,83,()=>this.scene.start("level-previews",{mode:this.draft.mode}),10);
    this.textButton("LOAD",220,83,()=>this.loadCoursePrompt(),10);
    this.textButton("NUEVO",275,83,()=>this.newDraft(),10);
    this.textButton("LIMPIAR",337,83,()=>this.clearObjects(),10);
    this.feedbackText=this.textButton("FEEDBACK",425,83,()=>void this.copyFeedback(),10);
    this.parText=this.add.text(500,83,"",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#e5cc82"}).setOrigin(1,.5).setDepth(42).setInteractive({useHandCursor:true}).on("pointerup",()=>this.editPar());
    this.statusText=this.add.text(42,112,"",{fontFamily:"system-ui, sans-serif",fontSize:"10px",color:"#afbeca"}).setDepth(42);
    this.refreshUi();
  }

  private textButton(label:string,x:number,y:number,action:()=>void,size=11):Phaser.GameObjects.Text{return this.add.text(x,y,label,{fontFamily:"system-ui, sans-serif",fontSize:`${size}px`,fontStyle:"bold",color:"#e7eef4"}).setOrigin(.5).setDepth(42).setInteractive({useHandCursor:true}).on("pointerup",action);}
  private refreshUi():void{
    this.toolText?.setText(`${TOOL_LABEL[TOOLS[this.toolIndex]!]}${this.activeTool()==="select"&&this.selection?" · ACTIVO":""}`);
    this.gridText?.setText(this.gridEnabled?"GRID ON":"GRID OFF");this.gridText?.setColor(this.gridEnabled?"#d9edff":"#74818c");
    this.playText?.setText(this.play?"SALIR":"TEST");this.parText?.setText(`★★★ ${this.draft.threeStar.maxStrokes??"-"} · ★★ ${this.draft.twoStar.maxStrokes??"-"}`);
    this.feedbackText?.setText(`FB ${BetaFeedbackSystem.count()}`);
    this.statusText?.setText(this.play?`PLAYTEST · ${this.strokes} golpes · SPACE resetea · TEST sale`:`${this.draft.id} · V seleccionar · R rotar · D duplicar · Del borrar · G grid · P previews`);
    this.drawGrid();this.drawSelection();
  }

  private bindDesktopInput():void{
    const k=this.input.keyboard;if(!k)return;
    k.on("keydown-V",()=>this.setTool("select"));k.on("keydown-G",()=>this.toggleGrid());k.on("keydown-R",()=>this.rotateSelected());k.on("keydown-D",()=>this.duplicateSelected());
    k.on("keydown-DELETE",()=>this.deleteSelected());k.on("keydown-BACKSPACE",()=>this.deleteSelected());k.on("keydown-ESC",()=>{this.selection=null;this.drawSelection();});
    k.on("keydown-P",()=>{if(!this.play)this.scene.start("level-previews",{mode:this.draft.mode});});
    k.on("keydown-SPACE",()=>{if(this.play)this.resetPlaytest();else this.togglePlay();});
    k.on("keydown-Z",(e:KeyboardEvent)=>{if(e.ctrlKey||e.metaKey)this.undo();});
  }

  private setTool(tool:EditorTool):void{const i=TOOLS.indexOf(tool);if(i>=0){this.toolIndex=i;this.portalStart=null;this.dragStart=null;this.overlay.clear();this.refreshUi();}}
  private changeTool(delta:number):void{this.toolIndex=(this.toolIndex+delta+TOOLS.length)%TOOLS.length;this.portalStart=null;this.dragStart=null;this.overlay.clear();this.refreshUi();}
  private activeTool():EditorTool{return TOOLS[this.toolIndex]!;}
  private snapPoint(p:Vec2):Vec2{const q=clampToField(p);return this.gridEnabled?{x:Math.round(q.x/GRID)*GRID,y:Math.round(q.y/GRID)*GRID}:q;}

  private pointerDown(pointer:Phaser.Input.Pointer):void{
    const raw=pointerToDesign(this,pointer),p=this.snapPoint(raw);if(raw.y<EDIT_TOP||raw.y>EDIT_BOTTOM)return;
    if(this.play){const b=this.sim.state.ball;if(this.sim.state.moving||this.sim.isAirborne())return;if(Phaser.Math.Distance.Between(raw.x,raw.y,b.x,b.y)<=62){this.aimStart=raw;this.drawAim(raw);}return;}
    if(pointer.button===2){this.selection=this.hitTest(raw);if(this.selection)this.deleteSelected();return;}
    if(this.activeTool()==="select"){
      this.selection=this.hitTest(raw);this.drawSelection();if(!this.selection)return;
      this.snapshot();this.transformBase=clone(this.draft);this.transformStart=p;this.transformMode=this.isResizeHandle(raw)?"resize":"move";return;
    }
    if(RECT_TOOLS.has(this.activeTool())){this.dragStart=p;this.overlay.clear();}
  }

  private pointerMove(pointer:Phaser.Input.Pointer):void{
    const raw=pointerToDesign(this,pointer),p=this.snapPoint(raw);
    if(this.play&&this.aimStart){this.drawAim(raw);return;}
    if(this.transformMode&&this.transformStart&&this.transformBase&&this.selection){this.applyTransform(p);this.rebuildPreview(false);return;}
    if(!this.dragStart)return;const r=normalRect(this.dragStart,p);this.overlay.clear();this.overlay.fillStyle(0xdcecff,.16);this.overlay.fillRect(r.x,r.y,r.w,r.h);this.overlay.lineStyle(2,0xdcecff,.8);this.overlay.strokeRect(r.x,r.y,r.w,r.h);
  }

  private pointerUp(pointer:Phaser.Input.Pointer):void{
    const raw=pointerToDesign(this,pointer),p=this.snapPoint(raw);if(raw.y<EDIT_TOP||raw.y>EDIT_BOTTOM)return;
    if(this.play){this.finishAim(raw);return;}
    if(this.transformMode){this.transformMode=null;this.transformStart=null;this.transformBase=null;this.saveDraft();this.rebuildPreview();return;}
    const tool=this.activeTool();
    if(tool==="select")return;
    if(RECT_TOOLS.has(tool)&&this.dragStart){const start=this.dragStart;this.dragStart=null;this.overlay.clear();const r=normalRect(start,p);if(r.w<14||r.h<14)return;this.snapshot();this.addRectTool(tool,r);this.changed();return;}
    this.snapshot();
    if(tool==="ball")this.draft.ball=p;
    else if(tool==="hole")this.draft.hole=p;
    else if(tool==="bumper"){(this.draft.bumpers??=[]).push({x:p.x,y:p.y,r:32});this.draft.primaryMechanic="bumper";}
    else if(tool==="trampoline"){(this.draft.trampolines??=[]).push({x:p.x,y:p.y,r:34,power:440});this.draft.primaryMechanic="trampoline";}
    else if(tool==="moving-bumper"){(this.draft.movingBumpers??=[]).push({x:p.x,y:p.y,r:30,axis:this.orientation%2===0?"x":"y",amplitude:70,speed:1.1});this.draft.primaryMechanic="moving";}
    else if(tool==="curve"){const a=this.orientation*Math.PI/2;(this.draft.curves??=[]).push({x:p.x,y:p.y,r:92,startAngle:a,endAngle:a+Math.PI/2,thickness:24});this.draft.primaryMechanic="curve";}
    else if(tool==="portal"){
      if(!this.portalStart){this.history.pop();this.portalStart=p;this.toast("Portal A · coloca la salida");return;}
      (this.draft.portals??=[]).push({a:{...this.portalStart,r:28},b:{...p,r:28}});this.portalStart=null;this.draft.primaryMechanic="portal";
    }else{this.history.pop();return;}
    this.changed();
  }

  private addRectTool(tool:EditorTool,r:RectDef):void{
    const d=direction(this.orientation),mechanics:Partial<Record<EditorTool,CourseMechanic>>={wall:"wall",sand:"sand",ice:"ice",void:"void",booster:"booster",fan:"fan",ramp:"ramp","moving-wall":"moving"};
    if(tool==="wall")(this.draft.walls??=[]).push(r);else if(tool==="sand")(this.draft.sand??=[]).push(r);else if(tool==="ice")(this.draft.ice??=[]).push(r);else if(tool==="void")(this.draft.voids??=[]).push(r);
    else if(tool==="booster")(this.draft.boosters??=[]).push({...r,dx:d.x,dy:d.y,power:1.05});else if(tool==="fan")(this.draft.fans??=[]).push({...r,dx:d.x,dy:d.y,strength:285});else if(tool==="ramp")(this.draft.ramps??=[]).push({...r,dx:d.x,dy:d.y,lift:350,boost:1.03});else if(tool==="moving-wall")(this.draft.movingWalls??=[]).push({...r,axis:this.orientation%2===0?"x":"y",amplitude:72,speed:1});
    const m=mechanics[tool];if(m)this.draft.primaryMechanic=m;
  }

  private rectArray(level:LevelDefinition,key:RectKey):RectDef[]{return (level[key]??[]) as RectDef[];}
  private circleArray(level:LevelDefinition,key:CircleKey):Array<{x:number;y:number;r:number}>{return (level[key]??[]) as Array<{x:number;y:number;r:number}>;}

  private hitTest(p:Vec2):Selection|null{
    if(Phaser.Math.Distance.Between(p.x,p.y,this.draft.ball.x,this.draft.ball.y)<24)return{kind:"ball"};
    if(Phaser.Math.Distance.Between(p.x,p.y,this.draft.hole.x,this.draft.hole.y)<25)return{kind:"hole"};
    const portals=this.draft.portals??[];for(let i=portals.length-1;i>=0;i--){const q=portals[i]!;if(Math.min(Phaser.Math.Distance.Between(p.x,p.y,q.a.x,q.a.y),Phaser.Math.Distance.Between(p.x,p.y,q.b.x,q.b.y))<38)return{kind:"portal",index:i};}
    const curves=this.draft.curves??[];for(let i=curves.length-1;i>=0;i--){const c=curves[i]!;if(Math.abs(Phaser.Math.Distance.Between(p.x,p.y,c.x,c.y)-c.r)<24)return{kind:"curve",index:i};}
    for(const key of CIRCLE_KEYS){const arr=this.circleArray(this.draft,key);for(let i=arr.length-1;i>=0;i--){const q=arr[i]!;if(Phaser.Math.Distance.Between(p.x,p.y,q.x,q.y)<=q.r+10)return{kind:"circle",key,index:i};}}
    for(const key of [...RECT_KEYS].reverse()){const arr=this.rectArray(this.draft,key);for(let i=arr.length-1;i>=0;i--){const r=arr[i]!;if(p.x>=r.x-5&&p.x<=r.x+r.w+5&&p.y>=r.y-5&&p.y<=r.y+r.h+5)return{kind:"rect",key,index:i};}}
    return null;
  }

  private selectionBounds(level=this.draft):RectDef|null{
    const s=this.selection;if(!s)return null;
    if(s.kind==="ball"){const p=level.ball;return{x:p.x-18,y:p.y-18,w:36,h:36};}
    if(s.kind==="hole"){const p=level.hole;return{x:p.x-20,y:p.y-20,w:40,h:40};}
    if(s.kind==="rect")return this.rectArray(level,s.key)[s.index]??null;
    if(s.kind==="circle"){const q=this.circleArray(level,s.key)[s.index];return q?{x:q.x-q.r,y:q.y-q.r,w:q.r*2,h:q.r*2}:null;}
    if(s.kind==="curve"){const c=level.curves?.[s.index];return c?{x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2}:null;}
    const p=level.portals?.[s.index];if(!p)return null;const rr=Math.max(p.a.r??28,p.b.r??28);return{x:Math.min(p.a.x,p.b.x)-rr,y:Math.min(p.a.y,p.b.y)-rr,w:Math.abs(p.a.x-p.b.x)+rr*2,h:Math.abs(p.a.y-p.b.y)+rr*2};
  }

  private isResizeHandle(p:Vec2):boolean{const b=this.selectionBounds();if(!b||this.selection?.kind==="ball"||this.selection?.kind==="hole"||this.selection?.kind==="portal")return false;return Phaser.Math.Distance.Between(p.x,p.y,b.x+b.w,b.y+b.h)<18;}

  private applyTransform(p:Vec2):void{
    if(!this.selection||!this.transformBase||!this.transformStart)return;this.draft=clone(this.transformBase);const s=this.selection,dx=p.x-this.transformStart.x,dy=p.y-this.transformStart.y;
    if(this.transformMode==="move"){
      if(s.kind==="ball")this.draft.ball={x:this.transformBase.ball.x+dx,y:this.transformBase.ball.y+dy};
      else if(s.kind==="hole")this.draft.hole={x:this.transformBase.hole.x+dx,y:this.transformBase.hole.y+dy};
      else if(s.kind==="rect"){const q=this.rectArray(this.draft,s.key)[s.index];const b=this.rectArray(this.transformBase,s.key)[s.index];if(q&&b){q.x=b.x+dx;q.y=b.y+dy;}}
      else if(s.kind==="circle"){const q=this.circleArray(this.draft,s.key)[s.index],b=this.circleArray(this.transformBase,s.key)[s.index];if(q&&b){q.x=b.x+dx;q.y=b.y+dy;}}
      else if(s.kind==="curve"){const q=this.draft.curves?.[s.index],b=this.transformBase.curves?.[s.index];if(q&&b){q.x=b.x+dx;q.y=b.y+dy;}}
      else if(s.kind==="portal"){const q=this.draft.portals?.[s.index],b=this.transformBase.portals?.[s.index];if(q&&b){q.a.x=b.a.x+dx;q.a.y=b.a.y+dy;q.b.x=b.b.x+dx;q.b.y=b.b.y+dy;}}
    }else{
      if(s.kind==="rect"){const q=this.rectArray(this.draft,s.key)[s.index],b=this.rectArray(this.transformBase,s.key)[s.index];if(q&&b){q.w=Math.max(16,p.x-b.x);q.h=Math.max(16,p.y-b.y);}}
      else if(s.kind==="circle"){const q=this.circleArray(this.draft,s.key)[s.index],b=this.circleArray(this.transformBase,s.key)[s.index];if(q&&b)q.r=Math.max(14,Phaser.Math.Distance.Between(b.x,b.y,p.x,p.y));}
      else if(s.kind==="curve"){const q=this.draft.curves?.[s.index],b=this.transformBase.curves?.[s.index];if(q&&b)q.r=Math.max(30,Phaser.Math.Distance.Between(b.x,b.y,p.x,p.y));}
    }
  }

  private rotateSelected():void{
    if(this.play||!this.selection)return;this.snapshot();const s=this.selection;
    if(s.kind==="rect"){
      const q=this.rectArray(this.draft,s.key)[s.index];if(!q){this.history.pop();return;}const cx=q.x+q.w/2,cy=q.y+q.h/2,w=q.w;q.w=q.h;q.h=w;q.x=cx-q.w/2;q.y=cy-q.h/2;
      if(s.key==="boosters"||s.key==="fans"||s.key==="ramps")rotateVector(q as RectDef&{dx:number;dy:number});
      if(s.key==="movingWalls"){const m=q as RectDef&{axis:"x"|"y"};m.axis=m.axis==="x"?"y":"x";}
    }else if(s.kind==="circle"&&s.key==="movingBumpers"){
      const q=this.circleArray(this.draft,s.key)[s.index] as {axis?:"x"|"y"}|undefined;if(q?.axis)q.axis=q.axis==="x"?"y":"x";
    }else if(s.kind==="curve"){
      const q=this.draft.curves?.[s.index];if(q){q.startAngle+=Math.PI/2;q.endAngle+=Math.PI/2;}
    }else if(s.kind==="portal"){
      const q=this.draft.portals?.[s.index];if(q){const cx=(q.a.x+q.b.x)/2,cy=(q.a.y+q.b.y)/2;for(const p of[q.a,q.b]){const x=p.x-cx,y=p.y-cy;p.x=cx-y;p.y=cy+x;}}
    }else{this.history.pop();return;}
    this.orientation=(this.orientation+1)%4;this.changed();
  }

  private duplicateSelected():void{
    if(this.play||!this.selection)return;const s=this.selection;if(s.kind==="ball"||s.kind==="hole")return;this.snapshot();
    if(s.kind==="rect"){const arr=this.rectArray(this.draft,s.key),q=arr[s.index];if(!q)return;arr.push({...clone(q),x:q.x+GRID,y:q.y+GRID});this.selection={...s,index:arr.length-1};}
    else if(s.kind==="circle"){const arr=this.circleArray(this.draft,s.key),q=arr[s.index];if(!q)return;arr.push({...clone(q),x:q.x+GRID,y:q.y+GRID});this.selection={...s,index:arr.length-1};}
    else if(s.kind==="curve"){const arr=this.draft.curves??=[],q=arr[s.index];if(!q)return;arr.push({...clone(q),x:q.x+GRID,y:q.y+GRID});this.selection={kind:"curve",index:arr.length-1};}
    else if(s.kind==="portal"){const arr=this.draft.portals??=[],q=arr[s.index];if(!q)return;const copy=clone(q);copy.a.x+=GRID;copy.a.y+=GRID;copy.b.x+=GRID;copy.b.y+=GRID;arr.push(copy);this.selection={kind:"portal",index:arr.length-1};}
    this.changed();
  }

  private deleteSelected():void{
    if(this.play||!this.selection)return;const s=this.selection;if(s.kind==="ball"||s.kind==="hole"){this.toast("Bola y hoyo se mueven, no se borran");return;}this.snapshot();
    if(s.kind==="rect")this.rectArray(this.draft,s.key).splice(s.index,1);else if(s.kind==="circle")this.circleArray(this.draft,s.key).splice(s.index,1);else if(s.kind==="curve")this.draft.curves?.splice(s.index,1);else if(s.kind==="portal")this.draft.portals?.splice(s.index,1);
    this.selection=null;this.changed();
  }

  private drawGrid():void{
    if(!this.gridView)return;this.gridView.clear();if(!this.gridEnabled||this.play)return;const f=GOLF_PHYSICS.field;this.gridView.lineStyle(1,0xd7e8f4,.075);
    for(let x=Math.ceil(f.x/GRID)*GRID;x<f.x+f.w;x+=GRID){this.gridView.beginPath();this.gridView.moveTo(x,EDIT_TOP);this.gridView.lineTo(x,EDIT_BOTTOM);this.gridView.strokePath();}
    for(let y=Math.ceil(EDIT_TOP/GRID)*GRID;y<EDIT_BOTTOM;y+=GRID){this.gridView.beginPath();this.gridView.moveTo(f.x,y);this.gridView.lineTo(f.x+f.w,y);this.gridView.strokePath();}
  }

  private drawSelection():void{
    if(!this.overlay||this.dragStart||this.play)return;this.overlay.clear();const b=this.selectionBounds();if(!b)return;this.overlay.lineStyle(2,0x9dd7ff,.95);this.overlay.strokeRect(b.x-4,b.y-4,b.w+8,b.h+8);this.overlay.fillStyle(0x9dd7ff,.95);this.overlay.fillRect(b.x+b.w-6,b.y+b.h-6,12,12);
  }

  private toggleGrid():void{this.gridEnabled=!this.gridEnabled;try{localStorage.setItem(GRID_KEY,this.gridEnabled?"1":"0");}catch{/* optional */}this.refreshUi();}
  private loadGridPreference():void{try{const x=localStorage.getItem(GRID_KEY);if(x!==null)this.gridEnabled=x!=="0";}catch{/* default */}}
  private snapshot():void{this.history.push(clone(this.draft));if(this.history.length>60)this.history.shift();}
  private undo():void{if(this.play)return;const previous=this.history.pop();if(!previous)return;this.draft=previous;this.selection=null;this.portalStart=null;this.changed(false);}
  private changed(save=true):void{if(save)this.saveDraft();this.rebuildPreview();this.refreshUi();}
  private rebuildPreview(selection=true):void{this.sim=new GolfSimulation(this.draft);drawCourse(this.course,this.draft,this.sim.state);drawDynamicCourse(this.dynamic,this.draft,0);this.ball.setPosition(this.draft.ball.x,this.draft.ball.y).setVisible(true);this.drawGrid();if(selection)this.drawSelection();}

  private togglePlay():void{if(this.play){this.play=false;this.rebuildPreview();this.refreshUi();return;}this.play=true;this.selection=null;this.overlay.clear();this.gridView.clear();this.resetPlaytest();this.refreshUi();}
  private resetPlaytest():void{if(!this.play)return;this.aimStart=null;this.overlay.clear();this.strokes=0;this.sim=new GolfSimulation(this.draft);this.ball.setPosition(this.draft.ball.x,this.draft.ball.y).setVisible(true);this.refreshUi();}
  private drawAim(p:Vec2):void{const b=this.sim.state.ball,dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy)||1,power=powerFromPhysicalPull(len),ux=dx/len,uy=dy/len,pull=Math.min(len,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);this.overlay.clear();this.overlay.lineStyle(4,0x8bc5ff,.9);this.overlay.beginPath();this.overlay.moveTo(b.x,b.y);this.overlay.lineTo(b.x-ux*pull,b.y-uy*pull);this.overlay.strokePath();this.overlay.fillStyle(0xeaf6ff,.65);for(let i=1;i<=7;i++){const q=i/7,reach=70+power*105;this.overlay.fillCircle(b.x+ux*reach*q,b.y+uy*reach*q,3);}}
  private finishAim(p:Vec2):void{if(!this.aimStart)return;this.aimStart=null;this.overlay.clear();const b=this.sim.state.ball,dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy);if(len<12)return;const angle=Math.atan2(dy,dx),power=powerFromPhysicalPull(len);if(this.sim.launch(angle,power)){this.strokes++;this.refreshUi();}}
  private consume(events:SimulationEvent[]):void{for(const e of events){if(e.kind==="void"){this.sim.resetAfterVoid();this.toast("VOID · reset");}else if(e.kind==="hole"){this.toast(`HOYO EN ${this.strokes}`);this.time.delayedCall(450,()=>this.resetPlaytest());}}}

  private saveDraft():void{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(this.draft));}catch{/* optional */}}
  private loadDraft():void{try{const raw=localStorage.getItem(DRAFT_KEY);if(raw)this.draft=JSON.parse(raw) as LevelDefinition;}catch{this.draft=blank();}}
  private newDraft():void{if(this.play||!window.confirm("¿Mapa nuevo?"))return;this.snapshot();this.draft=blank();this.selection=null;this.changed();}
  private clearObjects():void{if(this.play||!window.confirm("¿Borrar todos los obstáculos?"))return;this.snapshot();const keep=blank();keep.id=this.draft.id;keep.mode=this.draft.mode;keep.ball=clone(this.draft.ball);keep.hole=clone(this.draft.hole);keep.threeStar=clone(this.draft.threeStar);keep.twoStar=clone(this.draft.twoStar);this.draft=keep;this.selection=null;this.changed();}
  private loadCoursePrompt():void{if(this.play)return;const raw=window.prompt("Nivel: classic-01 o troll-01",this.draft.id);if(raw)this.loadCourseById(raw,true);}
  private loadCourseById(raw:string,notify=true):void{const m=/^(classic|troll)-(\d{1,2})$/i.exec(raw.trim());if(!m){if(notify)this.toast("ID no válido");return;}const mode=m[1]!.toLowerCase() as "classic"|"troll",index=Number(m[2])-1,levels=levelsForMode(mode);if(index<0||index>=levels.length){if(notify)this.toast("Ese nivel no existe");return;}this.draft=clone(levelFor(mode,index));this.selection=null;this.saveDraft();if(this.course)this.rebuildPreview();if(notify)this.toast(`${this.draft.id} cargado`);}
  private editPar():void{const three=Number(window.prompt("Golpes para ★★★",String(this.draft.threeStar.maxStrokes??2)));if(!Number.isFinite(three)||three<1)return;const two=Number(window.prompt("Golpes para ★★",String(this.draft.twoStar.maxStrokes??three+2)));if(!Number.isFinite(two)||two<three)return;this.snapshot();this.draft.threeStar={maxStrokes:Math.round(three)};this.draft.twoStar={maxStrokes:Math.round(two)};this.changed();}
  private async exportDraft():Promise<void>{const json=JSON.stringify(this.draft,null,2);try{await navigator.clipboard.writeText(json);this.toast("JSON COPIADO");}catch{window.prompt("Copia el JSON",json);}}
  private async copyFeedback():Promise<void>{if(await BetaFeedbackSystem.copyAll())this.toast(`${BetaFeedbackSystem.count()} FEEDBACK COPIADOS`);else window.prompt("Copia el feedback",BetaFeedbackSystem.exportText());}
  private toast(message:string):void{const t=this.add.text(270,858,message,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#f4f7fa",backgroundColor:"#111a22",padding:{x:12,y:8}}).setOrigin(.5).setDepth(100);this.tweens.add({targets:t,alpha:0,y:848,delay:900,duration:260,onComplete:()=>t.destroy()});}
}
