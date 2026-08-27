import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { PATCH_NOTES, PatchNotes } from "../systems/PatchNotesSystem";

export class PatchNotesScene extends Phaser.Scene{
  constructor(){super("patch-notes");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");PatchNotes.markRead();
    const back=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);back.on("pointerup",()=>this.scene.start("menu"));
    this.add.text(270,58,"PATCH NOTES",{fontFamily:"system-ui",fontSize:"25px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,92,"Qué ha cambiado desde tu última visita",{fontFamily:"system-ui",fontSize:"11px",color:"#8495a3"}).setOrigin(.5);

    let y=142;
    for(const note of PATCH_NOTES.slice(0,3)){
      const h=note.bullets.length*38+126;
      this.add.rectangle(270,y+h/2,454,h,0x121b22).setStrokeStyle(1,note===PATCH_NOTES[0]?0x557184:0x30414e);
      this.add.text(62,y+24,note.title,{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
      this.add.text(478,y+24,note.date,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#778a98"}).setOrigin(1,.5);
      this.add.text(62,y+54,note.summary,{fontFamily:"system-ui",fontSize:"11px",color:"#a9b9c4",wordWrap:{width:408},lineSpacing:2});
      note.bullets.forEach((bullet,i)=>this.add.text(72,y+96+i*38,`• ${bullet}`,{fontFamily:"system-ui",fontSize:"10px",color:"#d1dbe2",wordWrap:{width:390},lineSpacing:1}));
      y+=h+18;if(y>900)break;
    }
    sharpenSceneText(this);
  }
}
