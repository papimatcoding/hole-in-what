import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { CommunityDrafts, type SavedCommunityDraft } from "../systems/CommunityDraftSystem";
import { CommunityMaps } from "../systems/CommunityMapsSystem";

export class CommunityPublishScene extends Phaser.Scene{
  private selectedId:string|null=null;
  private selectionText!:Phaser.GameObjects.Text;
  private actionLayer:Phaser.GameObjects.Container|null=null;

  constructor(){super("community-publish");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.bigBack();
    this.add.text(270,58,"PUBLICAR MAPA",{fontFamily:"system-ui",fontSize:"25px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,94,"Elige exactamente qué borrador quieres subir",{fontFamily:"system-ui",fontSize:"11px",color:"#8495a3"}).setOrigin(.5);
    const drafts=CommunityDrafts.list(),working=CommunityDrafts.working();
    if(!drafts.length){
      this.add.text(270,330,"NO TIENES BORRADORES GUARDADOS",{fontFamily:"system-ui",fontSize:"15px",fontStyle:"bold",color:"#cbd7df"}).setOrigin(.5);
      this.add.text(270,374,working?"Hay un mapa en el editor, pero todavía no es un borrador publicable.":"Crea un mapa en BETA LAB y vuelve aquí para guardarlo.",{fontFamily:"system-ui",fontSize:"11px",color:"#8295a2",align:"center",wordWrap:{width:400}}).setOrigin(.5);
      if(working)this.button(270,454,330,"GUARDAR MAPA DEL EDITOR",()=>this.captureWorking(),true);
      this.button(270,working?524:454,330,working?"VOLVER AL EDITOR":"CREAR MAPA",()=>this.scene.start("editor"),!working);sharpenSceneText(this);return;
    }
    this.add.text(54,142,`MIS BORRADORES · ${drafts.length}`,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#8fa4b1"});
    if(working)this.button(408,142,190,"+ GUARDAR ACTUAL",()=>this.captureWorking(),false);
    drafts.slice(0,6).forEach((draft,i)=>this.draftCard(draft,190+i*88));
    this.selectionText=this.add.text(270,740,"SELECCIONA UN BORRADOR",{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#879aa7"}).setOrigin(.5);
    this.add.text(270,928,"Publicar requiere completar ese borrador exacto en playtest",{fontFamily:"system-ui",fontSize:"9px",color:"#6f818d"}).setOrigin(.5);
    sharpenSceneText(this);
  }

  private draftCard(draft:SavedCommunityDraft,y:number):void{
    const bg=this.add.rectangle(270,y,438,74,0x121b22).setStrokeStyle(2,0x30414e).setInteractive({useHandCursor:true});
    const name=this.add.text(70,y-15,draft.name,{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
    const count=this.objectCount(draft),tested=draft.playtestedAt!==null;
    this.add.text(70,y+14,`${count} objetos · ${tested?"✓ PROBADO":"● SIN PROBAR"}`,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:tested?"#85c9a6":"#d4ad71"}).setOrigin(0,.5);
    this.add.text(470,y,">",{fontFamily:"system-ui",fontSize:"20px",fontStyle:"bold",color:"#8296a4"}).setOrigin(1,.5);
    const select=():void=>{this.selectedId=draft.id;for(const child of this.children.list)if(child.getData("draft-card"))(child as Phaser.GameObjects.Rectangle).setStrokeStyle(2,child===bg?0x79a4bd:0x30414e);this.showActions(draft);};
    bg.setData("draft-card",true);bg.on("pointerup",select);name.setInteractive({useHandCursor:true}).on("pointerup",select);
  }

  private showActions(draft:SavedCommunityDraft):void{
    this.actionLayer?.destroy(true);this.selectionText.setText(`SELECCIONADO · ${draft.name}`).setColor("#dce9f0");
    const children:Phaser.GameObjects.GameObject[]=[],tested=draft.playtestedAt!==null;
    children.push(this.actionButton(120,804,140,"EDITAR",()=>{CommunityDrafts.openInEditor(draft.id);this.scene.start("editor");},false));
    children.push(this.actionButton(270,804,140,tested?"PROBAR OTRA VEZ":"PROBAR",()=>this.scene.start("community-play",{draftId:draft.id}),!tested));
    children.push(this.actionButton(420,804,140,"PUBLICAR",()=>{void this.publish(draft.id);},tested));
    children.push(this.actionButton(162,866,226,"ACTUALIZAR DESDE EDITOR",()=>this.replaceFromWorking(draft),false));
    children.push(this.actionButton(400,866,190,"BORRAR",()=>{if(window.confirm(`¿Borrar ${draft.name}?`)){CommunityDrafts.remove(draft.id);this.scene.restart();}},false));
    this.actionLayer=this.add.container(0,0,children).setDepth(30);
  }

  private captureWorking():void{const level=CommunityDrafts.working();if(!level){this.toast("NO HAY MAPA EN EL EDITOR",false);return;}const name=window.prompt("Nombre del borrador",level.id==="editor-draft"?"Mi mapa":level.id)?.trim();if(!name)return;CommunityDrafts.captureWorking(name);this.scene.restart();}
  private replaceFromWorking(draft:SavedCommunityDraft):void{if(!CommunityDrafts.working()){this.toast("NO HAY MAPA EN EL EDITOR",false);return;}if(!window.confirm(`¿Actualizar ${draft.name} con el mapa actual del editor? Tendrá que volver a pasar el playtest.`))return;CommunityDrafts.captureWorking(draft.name,draft.id);this.scene.restart();}

  private actionButton(x:number,y:number,w:number,label:string,action:()=>void,primary=false):Phaser.GameObjects.Container{
    const rest=primary?0x294454:0x17232c,hover=primary?0x3a6175:0x24343f,bg=this.add.rectangle(x,y,w,48,rest).setStrokeStyle(2,primary?0x78a9c2:0x3c5060).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#e6eef3"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerout",()=>bg.setFillStyle(rest)).on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});return this.add.container(0,0,[bg,t]);
  }

  private async publish(id:string):Promise<void>{
    const draft=CommunityDrafts.get(id);if(!draft)return;if(!draft.playtestedAt){this.toast("PRIMERO COMPLETA EL PLAYTEST",false);return;}
    const title=window.prompt("Nombre público del mapa",draft.name)?.trim();if(!title)return;const description=window.prompt("Descripción opcional","")??"";
    this.toast("PUBLICANDO…",true);const result=await CommunityMaps.publishSavedDraft(id,title,description);
    if(!result.ok){this.toast(result.error==="playtest_required"?"FALTA PLAYTEST":result.error==="publish_rate_limited"?"DEMASIADAS PUBLICACIONES":"NO SE PUDO PUBLICAR",false);return;}
    this.toast("✓ MAPA PUBLICADO",true);this.time.delayedCall(500,()=>this.scene.start("community-maps"));
  }

  private objectCount(draft:SavedCommunityDraft):number{const l=draft.level;return(l.walls?.length??0)+(l.triangles?.length??0)+(l.curves?.length??0)+(l.movingWalls?.length??0)+(l.movingBumpers?.length??0)+(l.sand?.length??0)+(l.ice?.length??0)+(l.boosters?.length??0)+(l.fans?.length??0)+(l.portals?.length??0)+(l.ramps?.length??0)+(l.trampolines?.length??0)+(l.voids?.length??0)+(l.bumpers?.length??0);}
  private bigBack():void{const bg=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);bg.on("pointerup",()=>this.scene.start("community-maps"));}
  private button(x:number,y:number,w:number,label:string,action:()=>void,primary=false):void{this.actionButton(x,y,w,label,action,primary);}
  private toast(message:string,ok:boolean):void{const t=this.add.text(270,900,message,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:ok?"#daf0dd":"#f0c2b8",backgroundColor:ok?"#14231a":"#2a1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(100);this.tweens.add({targets:t,alpha:0,delay:1100,duration:220,onComplete:()=>t.destroy()});}
}
