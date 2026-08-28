import Phaser from "phaser";
import { setupDesignCamera } from "../config/display";
import { LiveOps } from "../systems/LiveOpsSystem";

export class BootScene extends Phaser.Scene{
  constructor(){super("boot");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");
    this.add.text(270,452,"HOLE IN WHAT?",{fontFamily:"system-ui, sans-serif",fontSize:"28px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,494,"CARGANDO…",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:"#7f91a0"}).setOrigin(.5);
    void this.route();
  }

  private async route():Promise<void>{
    const status=await LiveOps.fetchStatus();
    this.scene.start(status.maintenance?"maintenance":"menu",status.maintenance?{status}:undefined);
  }
}
