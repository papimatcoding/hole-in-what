import Phaser from "phaser";
import { DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { BetaTelemetry, type BetaSupportCategory } from "../systems/BetaTelemetrySystem";

export class AssistanceScene extends Phaser.Scene{
  private category:BetaSupportCategory="comment";
  private categoryButtons=new Map<BetaSupportCategory,{bg:Phaser.GameObjects.Rectangle;text:Phaser.GameObjects.Text}>();
  private message!:HTMLTextAreaElement;
  private status!:Phaser.GameObjects.Text;

  constructor(){super("assistance");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.backButton();
    this.add.text(DESIGN_WIDTH/2,70,"ASISTENCIA AL JUGADOR",{fontFamily:"system-ui",fontSize:"24px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,104,"Perfil, encuesta general y comentarios directos para la beta.",{fontFamily:"system-ui",fontSize:"11px",color:"#8799a6"}).setOrigin(.5);

    const alias=BetaTelemetry.alias()??"SIN NOMBRE";
    this.panelButton(270,166,`JUGADOR · ${alias}   ✎`,()=>this.scene.start("player-profile"),true);
    this.panelButton(270,226,BetaTelemetry.gameSurveyDone()?"ENCUESTA GENERAL · YA ENVIADA":"ENCUESTA GENERAL",()=>this.scene.start("global-survey"));

    this.add.text(62,300,"ENVIAR COMENTARIO",{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:"#dce6ec"}).setOrigin(0,.5);
    this.add.text(62,326,"No hace falta estar dentro de un nivel. Lo recibimos ligado a tu tester ID.",{fontFamily:"system-ui",fontSize:"10px",color:"#7f919e",wordWrap:{width:410}}).setOrigin(0,.5);
    this.categoryButton(92,382,"COMENTARIO","comment");
    this.categoryButton(210,382,"BUG","bug");
    this.categoryButton(326,382,"SUGERENCIA","suggestion");
    this.categoryButton(448,382,"OTRO","other");
    this.refreshCategory();

    const area=document.createElement("textarea");
    area.maxLength=2000;area.placeholder="Escribe aquí. Cuanto más concreto, mejor…";area.spellcheck=true;
    Object.assign(area.style,{width:"410px",height:"190px",boxSizing:"border-box",resize:"none",border:"2px solid #405666",borderRadius:"8px",background:"#101820",color:"#eef5f8",font:"500 14px system-ui",padding:"12px",outline:"none",lineHeight:"1.35"});
    this.message=area;this.add.dom(270,535,area);

    this.panelButton(270,666,"ENVIAR A DESARROLLO",()=>{void this.send();},true);
    this.status=this.add.text(270,716,"",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#8fb8cf",align:"center",wordWrap:{width:410}}).setOrigin(.5);

    this.add.rectangle(270,814,414,110,0x10171e).setStrokeStyle(1,0x2d3d49);
    this.add.text(270,786,"¿PROBLEMA DE UN HOYO CONCRETO?",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#b7c6cf"}).setOrigin(.5);
    this.add.text(270,824,"Usa también el botón BUG dentro del propio hoyo:\nasí recibimos nivel, golpes y tiempo automáticamente.",{fontFamily:"system-ui",fontSize:"10px",color:"#778995",align:"center",lineSpacing:4}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private categoryButton(x:number,y:number,label:string,value:BetaSupportCategory):void{
    const bg=this.add.rectangle(x,y,104,42,0x151d25).setStrokeStyle(1,0x364653).setInteractive({useHandCursor:true}),text=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#aab9c3"}).setOrigin(.5);
    const select=()=>{this.category=value;this.refreshCategory();};bg.on("pointerup",select);text.setInteractive({useHandCursor:true}).on("pointerup",select);this.categoryButtons.set(value,{bg,text});
  }
  private refreshCategory():void{for(const [key,item] of this.categoryButtons){const active=key===this.category;item.bg.setFillStyle(active?0x234050:0x151d25).setStrokeStyle(2,active?0x6f9bb1:0x364653);item.text.setColor(active?"#edf6fa":"#aab9c3");}}
  private async send():Promise<void>{
    const message=this.message.value.trim();if(!message){this.status.setColor("#d99595").setText("Escribe algo antes de enviar.");return;}
    this.status.setColor("#8fb8cf").setText("ENVIANDO…");const ok=await BetaTelemetry.submitSupport({category:this.category,message});
    if(!ok){this.status.setColor("#d99595").setText("No se pudo enviar. Inténtalo otra vez.");return;}
    this.message.value="";this.status.setColor("#82c99e").setText("ENVIADO · gracias, queda guardado en la beta");
  }
  private backButton():void{const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerup",()=>this.scene.start("menu"));}
  private panelButton(x:number,y:number,label:string,action:()=>void,accent=false):void{const rest=accent?0x192831:0x151d25,hover=accent?0x294250:0x222f3b,bg=this.add.rectangle(x,y,414,50,rest).setStrokeStyle(2,accent?0x52788c:0x364653).setInteractive({useHandCursor:true}),text=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:accent?"#d9eef8":"#d7e0e8"}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.985);text.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});}
}
