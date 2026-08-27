import Phaser from "phaser";
import { DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { BetaTelemetry, type BetaSupportCategory } from "../systems/BetaTelemetrySystem";

export class AssistanceScene extends Phaser.Scene{
  private category:BetaSupportCategory="comment";
  private categoryButtons=new Map<BetaSupportCategory,{bg:Phaser.GameObjects.Rectangle;text:Phaser.GameObjects.Text}>();
  private message!:HTMLTextAreaElement;
  private status!:Phaser.GameObjects.Text;
  private desktop=false;

  constructor(){super("assistance");}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();this.cameras.main.setBackgroundColor("#0b0f14");
    this.backButton();
    this.add.text(DESIGN_WIDTH/2,70,"ASISTENCIA AL JUGADOR",{fontFamily:"system-ui",fontSize:uiFontSize(24,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,98,64,3,0x6f98ae,.9);
    this.add.text(DESIGN_WIDTH/2,118,"Perfil, encuesta y contacto directo con la beta",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8799a6"}).setOrigin(.5);

    const alias=BetaTelemetry.alias()??"SIN NOMBRE";
    if(this.desktop){
      this.panelButton(160,174,196,`JUGADOR\n${alias}  ✎`,()=>this.scene.start("player-profile"),true);
      this.panelButton(380,174,196,BetaTelemetry.gameSurveyDone()?"ENCUESTA GENERAL\nYA ENVIADA":"ENCUESTA GENERAL\nABRIR",()=>this.scene.start("global-survey"));
    }else{
      this.panelButton(270,166,414,`JUGADOR · ${alias}   ✎`,()=>this.scene.start("player-profile"),true);
      this.panelButton(270,226,414,BetaTelemetry.gameSurveyDone()?"ENCUESTA GENERAL · YA ENVIADA":"ENCUESTA GENERAL",()=>this.scene.start("global-survey"));
    }

    const sectionY=this.desktop?252:300;
    this.add.text(62,sectionY,"ENVIAR COMENTARIO",{fontFamily:"system-ui",fontSize:uiFontSize(14,2),fontStyle:"bold",color:"#dce6ec"}).setOrigin(0,.5);
    this.add.rectangle(62,sectionY+17,416,1,0x243641,.8).setOrigin(0,.5);
    this.add.text(62,sectionY+42,"Puedes enviar un bug, sugerencia o comentario sin estar dentro de un hoyo.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#7f919e",wordWrap:{width:416}}).setOrigin(0,.5);

    const categoryY=sectionY+96;
    this.categoryButton(92,categoryY,"COMENTARIO","comment");
    this.categoryButton(210,categoryY,"BUG","bug");
    this.categoryButton(326,categoryY,"SUGERENCIA","suggestion");
    this.categoryButton(448,categoryY,"OTRO","other");
    this.refreshCategory();

    const area=document.createElement("textarea");
    area.maxLength=2000;area.placeholder="Escribe aquí. Cuanto más concreto, mejor…";area.spellcheck=true;
    Object.assign(area.style,{width:this.desktop?"420px":"410px",height:this.desktop?"176px":"190px",boxSizing:"border-box",resize:"none",border:"2px solid #405666",borderRadius:"8px",background:"#101820",color:"#eef5f8",font:this.desktop?"500 16px system-ui":"500 14px system-ui",padding:"13px",outline:"none",lineHeight:"1.4"});
    this.message=area;const areaY=categoryY+(this.desktop?134:153);this.add.dom(270,areaY,area);

    const sendY=areaY+(this.desktop?126:131);this.panelButton(270,sendY,414,"ENVIAR A DESARROLLO",()=>{void this.send();},true);
    this.status=this.add.text(270,sendY+50,"",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#8fb8cf",align:"center",wordWrap:{width:410}}).setOrigin(.5);

    const helpY=this.desktop?760:814;
    this.add.rectangle(270,helpY,414,106,0x10171e).setStrokeStyle(1,0x2d3d49);
    this.add.rectangle(67,helpY,4,84,0x6f98ae,.65);
    this.add.text(270,helpY-27,"¿PROBLEMA DE UN HOYO CONCRETO?",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#b7c6cf"}).setOrigin(.5);
    this.add.text(270,helpY+14,"Usa también REPORTAR dentro del hoyo.\nAsí recibimos nivel, golpes y tiempo automáticamente.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#778995",align:"center",lineSpacing:4}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private categoryButton(x:number,y:number,label:string,value:BetaSupportCategory):void{
    const bg=this.add.rectangle(x,y,104,44,0x151d25).setStrokeStyle(1,0x364653).setInteractive({useHandCursor:true}),text=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#aab9c3"}).setOrigin(.5);
    const select=()=>{this.category=value;this.refreshCategory();};bg.on("pointerover",()=>{if(value!==this.category)bg.setFillStyle(0x1d2932);}).on("pointerout",()=>{if(value!==this.category)bg.setFillStyle(0x151d25);}).on("pointerup",select);text.setInteractive({useHandCursor:true}).on("pointerup",select);this.categoryButtons.set(value,{bg,text});
  }
  private refreshCategory():void{for(const [key,item] of this.categoryButtons){const active=key===this.category;item.bg.setFillStyle(active?0x234050:0x151d25).setStrokeStyle(active?2:1,active?0x6f9bb1:0x364653);item.text.setColor(active?"#edf6fa":"#aab9c3");}}
  private async send():Promise<void>{
    const message=this.message.value.trim();if(!message){this.status.setColor("#d99595").setText("Escribe algo antes de enviar.");return;}
    this.status.setColor("#8fb8cf").setText("ENVIANDO…");const ok=await BetaTelemetry.submitSupport({category:this.category,message});
    if(!ok){this.status.setColor("#d99595").setText("No se pudo enviar. Inténtalo otra vez.");return;}
    this.message.value="";this.status.setColor("#82c99e").setText("ENVIADO · gracias por el feedback");
  }
  private backButton():void{const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(0x1e2b35)).on("pointerout",()=>bg.setFillStyle(0x141e26)).on("pointerup",()=>this.scene.start("menu"));}
  private panelButton(x:number,y:number,w:number,label:string,action:()=>void,accent=false):void{const rest=accent?0x192831:0x151d25,hover=accent?0x294250:0x222f3b,bg=this.add.rectangle(x,y,w,52,rest).setStrokeStyle(accent?2:1,accent?0x52788c:0x364653).setInteractive({useHandCursor:true}),text=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(this.desktop?10:11,2),fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8",align:"center",lineSpacing:2}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.985);text.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});}
}
