import Phaser from "phaser";
import { isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { GLOBAL_SURVEY_REWARD_GEMS, GLOBAL_SURVEY_REWARD_ID } from "../config/survey";
import { levelsForMode } from "../data/campaign";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { SaveSystem } from "../systems/SaveSystem";

type RatingKey="overallFun"|"controls"|"variety"|"difficultyCurve"|"hardMode";
type PickerMode="favourite"|"worst";

interface SurveyAnswers{
  overallFun:number;
  controls:number;
  variety:number;
  difficultyCurve:number;
  hardMode:number;
  wouldKeepPlaying:boolean|null;
  favouriteLevel:string;
  worstLevel:string;
}

const LEVELS=[...levelsForMode("classic"),...levelsForMode("troll")].map(level=>level.id);
const IMPROVEMENTS=["MÁS NIVELES","MEJOR BALANCE","MÁS VARIEDAD","HARD","CONTROLES","COMMUNITY"];

export class GlobalSurveyScene extends Phaser.Scene{
  private accepted=false;
  private page=0;
  private pickerMode:PickerMode="favourite";
  private answers:SurveyAnswers={overallFun:0,controls:0,variety:0,difficultyCurve:0,hardMode:0,wouldKeepPlaying:null,favouriteLevel:"",worstLevel:""};
  private improvements=new Set<string>();
  private submitting=false;
  private desktop=false;

  constructor(){super("global-survey");}

  create():void{setupDesignCamera(this);this.desktop=isDesktopUI();this.cameras.main.setBackgroundColor("#0b0f14");this.render();}

  private render():void{
    this.children.removeAll(true);this.cameras.main.setBackgroundColor("#0b0f14");
    if(!this.accepted){this.renderInvite();sharpenSceneText(this);return;}
    this.add.text(270,58,"ENCUESTA GLOBAL",{fontFamily:"system-ui",fontSize:uiFontSize(25,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,86,64,3,0x6f98ae,.9);
    this.add.text(270,111,`BETA · ${this.page+1}/4`,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#7f96a5"}).setOrigin(.5);
    this.add.rectangle(270,468,454,650,0x0f171d,.68).setStrokeStyle(1,0x24343f,.85);
    if(this.page===0)this.pageRatingsOne();else if(this.page===1)this.pageRatingsTwo();else if(this.page===2)this.pageLevels();else this.pagePriorities();
    sharpenSceneText(this);
  }

  private renderInvite():void{
    const rewardAvailable=!SaveSystem.hasBonusClaim(GLOBAL_SURVEY_REWARD_ID);
    this.add.text(270,240,"AYÚDANOS A MEJORAR",{fontFamily:"system-ui",fontSize:uiFontSize(14,2),fontStyle:"bold",color:"#8fa7b6"}).setOrigin(.5);
    this.add.rectangle(270,462,438,388,0x101920,.98).setStrokeStyle(2,0x3d5666);
    this.add.text(270,338,"¿QUIERES CONTESTAR\nUNA ENCUESTA?",{fontFamily:"system-ui",fontSize:uiFontSize(25,2),fontStyle:"bold",color:"#f5f7fa",align:"center",lineSpacing:6}).setOrigin(.5);
    this.add.text(270,424,"Son 4 pantallas cortas. Tus respuestas nos ayudan a decidir\nqué niveles, controles y sistemas mejorar primero.",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#9babb5",align:"center",lineSpacing:5}).setOrigin(.5);
    this.add.rectangle(270,500,300,54,rewardAvailable?0x211f18:0x151b1f).setStrokeStyle(1,rewardAvailable?0x675b38:0x303b42);
    this.add.text(270,500,rewardAvailable?`RECOMPENSA · +${GLOBAL_SURVEY_REWARD_GEMS} ◆` :"RECOMPENSA DE BETA YA RECLAMADA",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:rewardAvailable?"#e4cc86":"#71818c"}).setOrigin(.5);
    this.actionButton(270,580,330,"SÍ, QUIERO AYUDAR",()=>{this.accepted=true;this.render();},true);
    this.actionButton(270,652,250,"AHORA NO",()=>this.scene.start("menu"),false);
    this.add.text(270,714,"La recompensa solo se puede reclamar una vez, aunque haya nuevos parches.",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:"#667985",align:"center",wordWrap:{width:390}}).setOrigin(.5);
  }

  private pageRatingsOne():void{
    this.sectionTitle("¿CÓMO SE SIENTE EL JUEGO?","Puntúa del 1 al 5");
    this.ratingRow("DIVERSIÓN GENERAL",270,"overallFun");
    this.ratingRow("CONTROLES / GAME FEEL",390,"controls");
    this.ratingRow("VARIEDAD",510,"variety");
    this.navButtons(false,this.answers.overallFun>0&&this.answers.controls>0&&this.answers.variety>0);
  }

  private pageRatingsTwo():void{
    this.sectionTitle("BALANCE Y HARD","Cómo se siente la dificultad del bloque actual");
    this.ratingRow("CURVA DE DIFICULTAD",270,"difficultyCurve");
    this.ratingRow("MODO HARD",390,"hardMode");
    this.add.text(270,514,"¿JUGARÍAS OTRO BLOQUE DE NIVELES?",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#c8d5dd"}).setOrigin(.5);
    this.choiceButton(190,574,140,"SÍ",this.answers.wouldKeepPlaying===true,()=>{this.answers.wouldKeepPlaying=true;this.render();});
    this.choiceButton(350,574,140,"NO",this.answers.wouldKeepPlaying===false,()=>{this.answers.wouldKeepPlaying=false;this.render();});
    this.navButtons(true,this.answers.difficultyCurve>0&&this.answers.hardMode>0&&this.answers.wouldKeepPlaying!==null);
  }

  private pageLevels():void{
    const selectingFavourite=this.pickerMode==="favourite";
    this.sectionTitle(selectingFavourite?"ELIGE TU NIVEL FAVORITO":"¿CUÁL ES EL MÁS FLOJO?",selectingFavourite?"Opcional · nos ayuda a entender qué funciona":"Opcional · no significa necesariamente que esté roto");
    LEVELS.forEach((level,i)=>{const col=i%6,row=Math.floor(i/6),x=55+col*86,y=246+row*66,label=level.startsWith("classic")?`C${level.slice(-2)}`:`H${level.slice(-2)}`,selected=(selectingFavourite?this.answers.favouriteLevel:this.answers.worstLevel)===level;this.levelButton(x,y,label,selected,()=>{if(selectingFavourite){this.answers.favouriteLevel=level;this.pickerMode="worst";}else this.answers.worstLevel=level;this.render();});});
    this.add.text(270,466,`FAVORITO · ${this.shortLevel(this.answers.favouriteLevel)}   ·   MÁS FLOJO · ${this.shortLevel(this.answers.worstLevel)}`,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#a8bbc6"}).setOrigin(.5);
    if(selectingFavourite)this.actionButton(270,548,260,"SALTAR FAVORITO",()=>{this.pickerMode="worst";this.render();},false);
    else this.actionButton(270,548,260,"SALTAR / CONTINUAR",()=>{this.page=3;this.render();},true);
    this.actionButton(270,624,220,"‹ ATRÁS",()=>{if(!selectingFavourite){this.pickerMode="favourite";this.render();}else{this.page=1;this.render();}},false);
  }

  private pagePriorities():void{
    this.sectionTitle("¿QUÉ MEJORARÍAS PRIMERO?","Puedes marcar varias opciones");
    IMPROVEMENTS.forEach((label,i)=>{const col=i%2,row=Math.floor(i/2),x=160+col*220,y=268+row*82;this.choiceButton(x,y,196,label,this.improvements.has(label),()=>{if(this.improvements.has(label))this.improvements.delete(label);else this.improvements.add(label);this.render();});});
    this.actionButton(270,596,330,this.submitting?"ENVIANDO…":"ENVIAR ENCUESTA",()=>{if(!this.submitting)void this.submit();},true);
    this.actionButton(270,672,220,"‹ ATRÁS",()=>{this.page=2;this.pickerMode="favourite";this.render();},false);
  }

  private sectionTitle(title:string,subtitle:string):void{
    this.add.text(270,154,title,{fontFamily:"system-ui",fontSize:uiFontSize(15,2),fontStyle:"bold",color:"#dbe6ec"}).setOrigin(.5);
    this.add.text(270,184,subtitle,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#8193a0"}).setOrigin(.5);
  }

  private ratingRow(label:string,y:number,key:RatingKey):void{
    this.add.text(270,y-38,label,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#c8d5dd"}).setOrigin(.5);
    for(let i=1;i<=5;i++){const x=142+(i-1)*64,selected=this.answers[key]===i;this.choiceButton(x,y,this.desktop?56:52,String(i),selected,()=>{this.answers[key]=i;this.render();});}
    this.add.text(270,y+42,"1 · flojo                                      5 · genial",{fontFamily:"system-ui",fontSize:uiFontSize(7,2),color:"#647581"}).setOrigin(.5);
  }

  private navButtons(showBack:boolean,canNext:boolean):void{
    if(showBack)this.actionButton(160,720,180,"‹ ATRÁS",()=>{this.page--;this.render();},false);
    this.actionButton(showBack?380:270,720,showBack?180:300,"SIGUIENTE ›",()=>{if(canNext){this.page++;this.render();}},canNext,canNext);
  }

  private choiceButton(x:number,y:number,w:number,label:string,selected:boolean,action:()=>void):void{
    const rest=selected?0x385d70:0x17242d,hover=selected?0x416b80:0x21333e,bg=this.add.rectangle(x,y,w,52,rest).setStrokeStyle(selected?2:1,selected?0x88b6cd:0x405767).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:selected?"#f2f8fb":"#d8e3e9",align:"center",wordWrap:{width:w-10}}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }

  private levelButton(x:number,y:number,label:string,selected:boolean,action:()=>void):void{this.choiceButton(x,y,68,label,selected,action);}

  private actionButton(x:number,y:number,w:number,label:string,action:()=>void,primary:boolean,enabled=true):void{
    const rest=!enabled?0x10171c:primary?0x294657:0x17232c,hover=primary?0x386177:0x22313a,bg=this.add.rectangle(x,y,w,58,rest).setStrokeStyle(!enabled?1:2,!enabled?0x27313a:primary?0x78a9c2:0x3c5060),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:enabled?"#e6eef3":"#596772"}).setOrigin(.5);if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }

  private shortLevel(level:string):string{if(!level)return"—";return level.startsWith("classic")?`C${level.slice(-2)}`:`H${level.slice(-2)}`;}

  private async submit():Promise<void>{
    if(this.submitting||this.answers.overallFun<1||this.answers.controls<1||this.answers.variety<1||this.answers.difficultyCurve<1||this.answers.hardMode<1||this.answers.wouldKeepPlaying===null)return;
    this.submitting=true;this.render();
    const ok=await BetaTelemetry.submitGameFeedback({overallFun:this.answers.overallFun,controls:this.answers.controls,variety:this.answers.variety,difficultyCurve:this.answers.difficultyCurve,hardMode:this.answers.hardMode,wouldKeepPlaying:this.answers.wouldKeepPlaying,favouriteLevel:this.answers.favouriteLevel,worstLevel:this.answers.worstLevel,ideas:[...this.improvements].join(", ")});
    if(!ok){this.submitting=false;this.render();this.toast("NO SE PUDO ENVIAR",false);return;}
    const gems=SaveSystem.grantGemsOnce(GLOBAL_SURVEY_REWARD_ID,GLOBAL_SURVEY_REWARD_GEMS);
    this.children.removeAll(true);this.add.text(270,382,"✓ GRACIAS",{fontFamily:"system-ui",fontSize:uiFontSize(30,2),fontStyle:"bold",color:"#a5ddb9"}).setOrigin(.5);
    this.add.text(270,438,gems>0?`Encuesta guardada · +${gems} ◆` :"Encuesta guardada para esta versión.",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:gems>0?"bold":"normal",color:gems>0?"#e1c77f":"#b2c1ca"}).setOrigin(.5);
    if(gems===0&&SaveSystem.hasBonusClaim(GLOBAL_SURVEY_REWARD_ID))this.add.text(270,472,"La recompensa de beta solo se puede reclamar una vez.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#778b98"}).setOrigin(.5);
    this.actionButton(270,552,300,"VOLVER AL MENÚ",()=>this.scene.start("menu"),true);sharpenSceneText(this);
  }

  private toast(message:string,ok:boolean):void{const t=this.add.text(270,824,message,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:ok?"#d9efde":"#f0c1b7",backgroundColor:ok?"#14231a":"#2b1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(100);this.tweens.add({targets:t,alpha:0,delay:850,duration:180,onComplete:()=>t.destroy()});}
}
