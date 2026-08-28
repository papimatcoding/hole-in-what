import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { LiveOps, type LiveStatus } from "../systems/LiveOpsSystem";

export class MaintenanceScene extends Phaser.Scene{
  private status:LiveStatus=LiveOps.status();
  private patchText!:Phaser.GameObjects.Text;
  private etaText!:Phaser.GameObjects.Text;
  private messageText!:Phaser.GameObjects.Text;
  private retryBg!:Phaser.GameObjects.Rectangle;
  private retryText!:Phaser.GameObjects.Text;
  private checking=false;

  constructor(){super("maintenance");}
  init(data?:{status?:LiveStatus}):void{if(data?.status)this.status=data.status;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#080c10");
    this.add.circle(270,214,66,0x14212a).setStrokeStyle(2,0x456273);
    this.add.text(270,214,"⚙",{fontFamily:"system-ui, sans-serif",fontSize:"58px",color:"#d5e5ee"}).setOrigin(.5);
    this.add.text(270,326,"MANTENIMIENTO",{fontFamily:"system-ui, sans-serif",fontSize:"31px",fontStyle:"bold",color:"#f4f7fa"}).setOrigin(.5);
    this.patchText=this.add.text(270,374,"",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#8fb8cf"}).setOrigin(.5);
    this.messageText=this.add.text(270,462,"",{fontFamily:"system-ui, sans-serif",fontSize:"16px",color:"#c8d4dc",align:"center",wordWrap:{width:400}}).setOrigin(.5);
    this.etaText=this.add.text(270,554,"",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#e1c77f",align:"center",wordWrap:{width:390}}).setOrigin(.5);
    this.retryBg=this.add.rectangle(270,672,330,68,0x223541).setStrokeStyle(2,0x6f91a6).setInteractive({useHandCursor:true});
    this.retryText=this.add.text(270,672,"COMPROBAR AHORA",{fontFamily:"system-ui, sans-serif",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.retryBg.on("pointerdown",()=>this.retryBg.setScale(.98).setFillStyle(0x2d4655));
    this.retryBg.on("pointerout",()=>this.retryBg.setScale(1).setFillStyle(0x223541));
    this.retryBg.on("pointerup",()=>{this.retryBg.setScale(1);void this.check();});
    this.add.text(270,748,"Comprobamos automáticamente cada 15 s.\nCuando termine el parche, la página se recargará sola.",{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#71818d",align:"center",lineSpacing:4,wordWrap:{width:390}}).setOrigin(.5);
    this.renderStatus();
    this.time.addEvent({delay:15_000,loop:true,callback:()=>{void this.check();}});
    sharpenSceneText(this);
  }

  private renderStatus():void{
    this.patchText.setText(`PARCHE · ${this.status.patchLabel}`);
    this.messageText.setText(this.status.message);
    this.etaText.setText(this.status.etaText?`TIEMPO ESTIMADO · ${this.status.etaText}`:"VOLVEMOS EN CUANTO TERMINE EL PARCHE");
  }

  private async check():Promise<void>{
    if(this.checking)return;this.checking=true;this.retryText.setText("COMPROBANDO…");this.retryBg.disableInteractive();
    const next=await LiveOps.fetchStatus();this.status=next;
    if(!next.maintenance){window.location.reload();return;}
    this.renderStatus();this.retryText.setText("COMPROBAR AHORA");this.retryBg.setInteractive({useHandCursor:true});this.checking=false;
  }
}
