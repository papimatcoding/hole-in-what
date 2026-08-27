import Phaser from "phaser";
import { DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class PlayerProfileScene extends Phaser.Scene{
  private nameInput!:HTMLInputElement;
  private current!:Phaser.GameObjects.Text;
  private status!:Phaser.GameObjects.Text;
  private desktop=false;

  constructor(){super("player-profile");}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();this.cameras.main.setBackgroundColor("#0b0f14");
    this.backButton();
    this.add.text(DESIGN_WIDTH/2,84,"PERFIL DE JUGADOR",{fontFamily:"system-ui",fontSize:uiFontSize(26,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,112,64,3,0x6f98ae,.9);
    this.add.text(DESIGN_WIDTH/2,140,"El nombre que verán otros testers en rankings y Community Maps",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8fa1ae",align:"center",wordWrap:{width:430}}).setOrigin(.5);

    const alias=BetaTelemetry.alias();
    this.add.rectangle(270,220,414,86,alias?0x121d21:0x211c14).setStrokeStyle(1,alias?0x2c4a3c:0x65522e);
    this.add.rectangle(67,220,4,70,alias?0x6f9f82:0xc49a58,.9);
    this.current=this.add.text(DESIGN_WIDTH/2,208,alias?`AHORA ERES · ${alias}`:"AÚN NO TIENES NOMBRE",{fontFamily:"system-ui",fontSize:uiFontSize(17,2),fontStyle:"bold",color:alias?"#dff2e7":"#e2bd73"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,240,"Cambiarlo no reinicia encuestas, ratings ni estadísticas.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#8293a0",align:"center"}).setOrigin(.5);

    const field=document.createElement("input");
    field.type="text";field.maxLength=40;field.value=alias??"";field.placeholder="Escribe tu nombre o apodo";field.autocomplete="off";field.spellcheck=false;
    Object.assign(field.style,{width:this.desktop?"370px":"330px",height:this.desktop?"54px":"46px",boxSizing:"border-box",border:"2px solid #587286",borderRadius:"9px",background:"#101820",color:"#eef5f8",font:`600 ${this.desktop?18:16}px system-ui`,padding:"0 14px",outline:"none",textAlign:"center"});
    field.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();void this.save();}});
    this.nameInput=field;this.add.dom(DESIGN_WIDTH/2,342,field);

    this.button(270,420,this.desktop?390:360,"GUARDAR NOMBRE",()=>{void this.save();},true);
    this.status=this.add.text(DESIGN_WIDTH/2,472,"",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#8fb8cf",align:"center",wordWrap:{width:420}}).setOrigin(.5);

    this.add.rectangle(270,612,410,168,0x10171e).setStrokeStyle(1,0x2d3d49);
    this.add.rectangle(67,612,4,144,0x476779,.75);
    this.add.text(270,554,"IDENTIDAD BETA",{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#a8bbc8"}).setOrigin(.5);
    const short=BetaTelemetry.testerId().replaceAll("-","").slice(-8).toUpperCase();
    this.add.text(270,600,`ID ANÓNIMA · …${short}`,{fontFamily:"monospace",fontSize:uiFontSize(13,1),color:"#d8e3ea"}).setOrigin(.5);
    this.add.text(270,648,"La ID permanece estable en este navegador.\nTu nombre es solo la etiqueta visible y puede cambiar.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#758795",align:"center",lineSpacing:5}).setOrigin(.5);
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
    this.status.setColor("#82c99e").setText("NOMBRE ACTUALIZADO");
  }

  private backButton():void{
    const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(0x1e2b35)).on("pointerout",()=>bg.setFillStyle(0x141e26)).on("pointerup",()=>this.scene.start("menu"));
  }
  private button(x:number,y:number,w:number,label:string,action:()=>void,accent=false):void{
    const rest=accent?0x1d3441:0x151d25,hover=accent?0x294b5c:0x222f3b,bg=this.add.rectangle(x,y,w,56,rest).setStrokeStyle(2,accent?0x5a8398:0x364653).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(12,2),fontStyle:"bold",color:accent?"#e6f2f7":"#d7e0e8"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }
}
