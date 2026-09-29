import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PATCH_NOTES, PatchNotes } from "../systems/PatchNotesSystem";
import { I18n } from "../systems/I18nSystem";

export class PatchNotesScene extends Phaser.Scene{
  private selectedId:string|null=null;
  constructor(){super("patch-notes");}
  init(data?:{selectedId?:string}):void{this.selectedId=data?.selectedId??null;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");PatchNotes.markRead();const tr=I18n.text;
    this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));
    this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);
    this.add.text(270,58,tr("BUZÓN DE PARCHES"),{fontFamily:"system-ui",fontSize:uiFontSize(23,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,87,72,3,0x6f98ae,.9);

    const visible=PatchNotes.visible().slice(0,5),selected=visible.find(note=>note.id===this.selectedId)??visible[0];
    if(!selected){this.add.text(270,430,tr("No hay parches en el buzón"),{fontFamily:"system-ui",fontSize:uiFontSize(15,2),color:"#a9b9c4"}).setOrigin(.5);return;}
    this.add.text(42,120,tr("RECIENTES"),{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#8db2c5"});
    visible.forEach((note,index)=>{
      const y=158+index*62,active=note.id===selected.id;
      this.add.rectangle(270,y,456,54,active?0x203741:0x141e26).setStrokeStyle(active?2:1,active?0x81b5b8:0x3b4c59).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.restart({selectedId:note.id}));
      this.add.text(58,y-9,tr(note.title),{fontFamily:"system-ui",fontSize:uiFontSize(12,2),fontStyle:"bold",color:active?"#f6f8f0":"#cad6dc"}).setOrigin(0,.5);
      this.add.text(58,y+13,tr(note.date),{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#899faa"}).setOrigin(0,.5);
      if(note===PATCH_NOTES[0])this.add.text(475,y,tr("NUEVO"),{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#a8d6de"}).setOrigin(1,.5);
    });

    const top=495;
    this.add.rectangle(270,695,456,400,0x15212a).setStrokeStyle(1,0x55798d);
    this.add.text(58,top,tr(selected.title),{fontFamily:"system-ui",fontSize:uiFontSize(15,2),fontStyle:"bold",color:"#eef4f8"});
    this.add.text(58,top+38,tr(selected.summary),{fontFamily:"system-ui",fontSize:uiFontSize(11,2),color:"#b3c8d1",wordWrap:{width:414}});
    selected.bullets.forEach((bullet,index)=>this.add.text(64,top+92+index*47,`• ${tr(bullet)}`,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#d1dbe2",wordWrap:{width:402},lineSpacing:2}));
    this.add.rectangle(436,856,114,40,0x273842).setStrokeStyle(1,0x7899a7).setInteractive({useHandCursor:true}).on("pointerup",()=>{PatchNotes.dismiss(selected.id);this.scene.restart();});
    this.add.text(436,856,tr("BORRAR"),{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#e1ebee"}).setOrigin(.5);
    sharpenSceneText(this);
  }
}
