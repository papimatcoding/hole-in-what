import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { BETA_BUILD_ID } from "../systems/BetaTelemetrySystem";
import type { LiveStatus } from "../systems/LiveOpsSystem";

export class UpdateRequiredScene extends Phaser.Scene{
  private status:LiveStatus|null=null;

  constructor(){super("update-required");}
  init(data?:{status?:LiveStatus}):void{this.status=data?.status??null;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    const patch=this.status?.patchLabel||"NUEVA VERSIÓN";
    this.add.text(270,228,"ACTUALIZACIÓN DISPONIBLE",{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#84b6d0"}).setOrigin(.5);
    this.add.text(270,282,patch,{fontFamily:"system-ui",fontSize:"25px",fontStyle:"bold",color:"#f5f7fa",align:"center",wordWrap:{width:430}}).setOrigin(.5);
    this.add.text(270,382,"Tu pestaña tiene una versión anterior del juego.\nActualiza antes de seguir para que partidas y feedback\nse registren en el parche correcto.",{fontFamily:"system-ui",fontSize:"12px",color:"#a9bac5",align:"center",lineSpacing:7}).setOrigin(.5);
    this.add.text(270,480,`CARGADA · ${BETA_BUILD_ID}\nACTUAL · ${this.status?.currentBuildId??"-"}`,{fontFamily:"monospace",fontSize:"10px",color:"#6f8492",align:"center",lineSpacing:5}).setOrigin(.5);
    this.button(270,590,356,"ACTUALIZAR AHORA",()=>this.refresh(),true);
    this.add.text(270,662,"Se recargará el juego y conservarás tu progreso local.",{fontFamily:"system-ui",fontSize:"10px",color:"#718491"}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private button(x:number,y:number,w:number,label:string,action:()=>void,primary=false):void{
    const rest=primary?0x294657:0x17232c,hover=primary?0x3b657a:0x24343f;
    const bg=this.add.rectangle(x,y,w,62,rest).setStrokeStyle(2,primary?0x7fb0c9:0x3d5160).setInteractive({useHandCursor:true});
    const text=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"15px",fontStyle:"bold",color:"#eef5f8"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>{bg.setFillStyle(rest);bg.setScale(1);text.setScale(1);}).on("pointerdown",()=>{bg.setScale(.985);text.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});
  }

  private refresh():void{
    const url=new URL(window.location.href);url.searchParams.set("build",this.status?.currentBuildId??String(Date.now()));window.location.replace(url.toString());
  }
}
