import Phaser from "phaser";
import { DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class PlayerProfileScene extends Phaser.Scene{
  private input!:HTMLInputElement;
  private current!:Phaser.GameObjects.Text;
  private status!:Phaser.GameObjects.Text;

  constructor(){super("player-profile");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.backButton();
    this.add.text(DESIGN_WIDTH/2,92,"PERFIL DE JUGADOR",{fontFamily:"system-ui",fontSize:"26px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,132,"Tu nombre se muestra en rankings, Community Maps y comentarios.",{fontFamily:"system-ui",fontSize:"11px",color:"#8fa1ae",align:"center",wordWrap:{width:420}}).setOrigin(.5);

    const alias=BetaTelemetry.alias();
    this.current=this.add.text(DESIGN_WIDTH/2,220,alias?`AHORA ERES · ${alias}`:"AÚN NO TIENES NOMBRE",{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:alias?"#dff2e7":"#d5b36b"}).setOrigin(.5);
    this.add.text(DESIGN_WIDTH/2,260,"Cambiar el nombre NO cambia tu identidad de tester,\nni reinicia encuestas, ratings o estadísticas.",{fontFamily:"system-ui",fontSize:"11px",color:"#8293a0",align:"center",lineSpacing:5}).setOrigin(.5);

    const input=document.createElement("input");
    input.type="text";input.maxLength=40;input.value=alias??"";input.placeholder="Escribe tu nombre o apodo";input.autocomplete="off";input.spellcheck=false;
    Object.assign(input.style,{width:"330px",height:"46px",boxSizing:"border-box",border:"2px solid #587286",borderRadius:"8px",background:"#101820",color:"#eef5f8",font:"600 16px system-ui",padding:"0 14px",outline:"none",textAlign:"center"});
    this.input=input;this.add.dom(DESIGN_WIDTH/2,360,input);

    this.button(270,438,"GUARDAR NOMBRE",()=>{void this.save();},true);
    this.status=this.add.text(DESIGN_WIDTH/2,492,"",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8fb8cf",align:"center",wordWrap:{width:400}}).setOrigin(.5);

    this.add.rectangle(270,615,410,170,0x10171e).setStrokeStyle(1,0x2d3d49);
    this.add.text(270,558,"IDENTIDAD BETA",{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#a8bbc8"}).setOrigin(.5);
    const short=BetaTelemetry.testerId().replaceAll("-","").slice(-8).toUpperCase();
    this.add.text(270,600,`ID ANÓNIMA · …${short}`,{fontFamily:"monospace",fontSize:"13px",color:"#d8e3ea"}).setOrigin(.5);
    this.add.text(270,648,"Esta ID permanece estable en este navegador.\nEl nombre es solo la etiqueta visible y puede cambiar.",{fontFamily:"system-ui",fontSize:"10px",color:"#758795",align:"center",lineSpacing:5}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private async save():Promise<void>{
    const name=this.input.value.trim().replace(/\s+/g," ");
    if(!name){this.status.setColor("#d99595").setText("Escribe un nombre antes de guardar.");return;}
    this.status.setColor("#8fb8cf").setText("GUARDANDO…");
    const ok=await BetaTelemetry.setAlias(name);
    if(!ok){this.status.setColor("#d99595").setText("No se pudo guardar. Comprueba la conexión e inténtalo otra vez.");return;}
    this.input.value=BetaTelemetry.alias()??name;
    this.current.setColor("#dff2e7").setText(`AHORA ERES · ${this.input.value}`);
    this.status.setColor("#82c99e").setText("NOMBRE ACTUALIZADO · tu ID de tester no ha cambiado");
  }

  private backButton():void{
    const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerup",()=>this.scene.start("menu"));
  }
  private button(x:number,y:number,label:string,action:()=>void,accent=false):void{
    const rest=accent?0x1d3441:0x151d25,hover=accent?0x294b5c:0x222f3b,bg=this.add.rectangle(x,y,360,54,rest).setStrokeStyle(2,accent?0x5a8398:0x364653).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:accent?"#e6f2f7":"#d7e0e8"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }
}
