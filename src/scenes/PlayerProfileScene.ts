import Phaser from "phaser";
import { DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class PlayerProfileScene extends Phaser.Scene{
  private nameInput!:HTMLInputElement;
  private current!:Phaser.GameObjects.Text;
  private status!:Phaser.GameObjects.Text;

  constructor(){super("player-profile");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.backButton();
    this.add.text(DESIGN_WIDTH/2,92,"PERFIL DE JUGADOR",{fontFamily:"system-ui",fontSize:uiFontSize(26,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,136,"Elige el nombre que verán otros testers en rankings y Community Maps.",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),color:"#8fa1ae",align:"center",wordWrap:{width:430}}).setOrigin(.5);

    const alias=BetaTelemetry.alias();
    this.current=this.add.text(DESIGN_WIDTH/2,220,alias?`AHORA ERES · ${alias}`:"AÚN NO TIENES NOMBRE",{fontFamily:"system-ui",fontSize:uiFontSize(17,2),fontStyle:"bold",color:alias?"#dff2e7":"#d5b36b"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,264,"Puedes cambiarlo cuando quieras. Tu identidad de tester,\nencuestas, ratings y estadísticas no se reinician.",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),color:"#8293a0",align:"center",lineSpacing:5}).setOrigin(.5);

    const field=document.createElement("input");
    field.type="text";field.maxLength=40;field.value=alias??"";field.placeholder="Escribe tu nombre o apodo";field.autocomplete="off";field.spellcheck=false;
    Object.assign(field.style,{width:isDesktopUI()?"360px":"330px",height:isDesktopUI()?"52px":"46px",boxSizing:"border-box",border:"2px solid #587286",borderRadius:"8px",background:"#101820",color:"#eef5f8",font:`600 ${isDesktopUI()?18:16}px system-ui`,padding:"0 14px",outline:"none",textAlign:"center"});
    field.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();void this.save();}});
    this.nameInput=field;this.add.dom(DESIGN_WIDTH/2,360,field);

    this.button(270,438,"GUARDAR NOMBRE",()=>{void this.save();},true);
    this.status=this.add.text(DESIGN_WIDTH/2,492,"",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#8fb8cf",align:"center",wordWrap:{width:420}}).setOrigin(.5);

    this.add.rectangle(270,615,410,170,0x10171e).setStrokeStyle(1,0x2d3d49);
    this.add.text(270,558,"IDENTIDAD BETA",{fontFamily:"system-ui",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#a8bbc8"}).setOrigin(.5);
    const short=BetaTelemetry.testerId().replaceAll("-","").slice(-8).toUpperCase();
    this.add.text(270,600,`ID ANÓNIMA · …${short}`,{fontFamily:"monospace",fontSize:uiFontSize(13,1),color:"#d8e3ea"}).setOrigin(.5);
    this.add.text(270,648,"Esta ID permanece estable en este navegador.\nEl nombre es solo la etiqueta visible y puede cambiar.",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#758795",align:"center",lineSpacing:5}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private async save():Promise<void>{
    const name=this.nameInput.value.trim().replace(/\s+/g," ");
    if(!name){this.status.setColor("#d99595").setText("Escribe un nombre antes de guardar.");return;}
    this.status.setColor("#8fb8cf").setText("GUARDANDO…");
    const ok=await BetaTelemetry.setAlias(name);
    if(!ok){this.status.setColor("#d99595").setText("No se pudo guardar el nombre en este navegador.");return;}
    this.nameInput.value=BetaTelemetry.alias()??name;
    this.current.setColor("#dff2e7").setText(`AHORA ERES · ${this.nameInput.value}`);
    this.status.setColor("#82c99e").setText("NOMBRE ACTUALIZADO · la sincronización online seguirá automáticamente");
  }

  private backButton():void{
    const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerup",()=>this.scene.start("menu"));
  }
  private button(x:number,y:number,label:string,action:()=>void,accent=false):void{
    const rest=accent?0x1d3441:0x151d25,hover=accent?0x294b5c:0x222f3b,bg=this.add.rectangle(x,y,360,54,rest).setStrokeStyle(2,accent?0x5a8398:0x364653).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(12,2),fontStyle:"bold",color:accent?"#e6f2f7":"#d7e0e8"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }
}
