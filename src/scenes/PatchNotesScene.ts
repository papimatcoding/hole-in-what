import Phaser from "phaser";
import { isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PATCH_NOTES, PatchNotes } from "../systems/PatchNotesSystem";

export class PatchNotesScene extends Phaser.Scene{
  constructor(){super("patch-notes");}

  create():void{
    setupDesignCamera(this);const desktop=isDesktopUI();this.cameras.main.setBackgroundColor("#0b0f14");PatchNotes.markRead();
    const back=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);back.on("pointerover",()=>back.setFillStyle(0x1e2b35)).on("pointerout",()=>back.setFillStyle(0x141e26)).on("pointerup",()=>this.scene.start("menu"));
    this.add.text(270,58,"PATCH NOTES",{fontFamily:"system-ui",fontSize:uiFontSize(25,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,86,64,3,0x6f98ae,.9);
    this.add.text(270,108,"Cambios recientes de la beta",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8495a3"}).setOrigin(.5);

    let y=148;
    for(const note of PATCH_NOTES.slice(0,desktop?3:3)){
      const h=note.bullets.length*(desktop?36:38)+(desktop?116:126),latest=note===PATCH_NOTES[0];
      this.add.rectangle(270,y+h/2,454,h,latest?0x15212a:0x11191f).setStrokeStyle(latest?2:1,latest?0x55798d:0x2d3e49);
      this.add.rectangle(47,y+h/2,4,h-12,latest?0x6f98ae:0x354a57,.9);
      if(latest)this.add.text(462,y+22,"NUEVO",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#8fc1da",backgroundColor:"#1b303c",padding:{x:7,y:4}}).setOrigin(1,.5);
      this.add.text(62,y+24,note.title,{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
      this.add.text(latest?410:478,y+24,note.date,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#778a98"}).setOrigin(1,.5);
      this.add.text(62,y+54,note.summary,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#a9b9c4",wordWrap:{width:408},lineSpacing:2});
      note.bullets.forEach((bullet,i)=>this.add.text(72,y+94+i*(desktop?36:38),`• ${bullet}`,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#d1dbe2",wordWrap:{width:390},lineSpacing:1}));
      y+=h+16;if(y>900)break;
    }
    sharpenSceneText(this);
  }
}
