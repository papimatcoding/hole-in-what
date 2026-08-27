import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { CommunityMaps, type CommunityMapCard } from "../systems/CommunityMapsSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class CommunityMapsScene extends Phaser.Scene{
  private sort:"top"|"new"="top";
  private list:Phaser.GameObjects.Container|null=null;
  private status!:Phaser.GameObjects.Text;

  constructor(){super("community-maps");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.add.text(38,46,"‹",{fontFamily:"system-ui",fontSize:"34px",color:"#eef4f8"}).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));
    this.add.text(270,62,"COMMUNITY MAPS",{fontFamily:"system-ui",fontSize:"25px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,94,"Mapas creados por los testers",{fontFamily:"system-ui",fontSize:"11px",color:"#8495a3"}).setOrigin(.5);
    this.button(132,134,"MEJORES",()=>{this.sort="top";void this.reload();});
    this.button(270,134,"NUEVOS",()=>{this.sort="new";void this.reload();});
    this.button(408,134,"+ PUBLICAR",()=>{void this.publish();});
    this.status=this.add.text(270,184,"CARGANDO…",{fontFamily:"system-ui",fontSize:"12px",color:"#8fa1ae"}).setOrigin(.5);
    sharpenSceneText(this);void this.reload();
  }

  private button(x:number,y:number,label:string,action:()=>void):void{
    const bg=this.add.rectangle(x,y,122,38,0x17232c).setStrokeStyle(1,0x3b4d5a).setInteractive({useHandCursor:true});
    const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#dce6ec"}).setOrigin(.5).setInteractive({useHandCursor:true});
    bg.on("pointerup",action);t.on("pointerup",action);
  }

  private async reload():Promise<void>{
    this.list?.destroy(true);this.list=null;this.status.setText("CARGANDO…");
    const maps=await CommunityMaps.list(this.sort);
    if(maps.length===0){this.status.setText("Aún no hay mapas. Puedes publicar el borrador del editor.");return;}
    this.status.setText(`${maps.length} mapas · ${this.sort==="top"?"ordenados por valoración":"más recientes"}`);
    const children:Phaser.GameObjects.GameObject[]=[];
    maps.slice(0,8).forEach((map,i)=>this.card(children,map,230+i*82));
    this.list=this.add.container(0,0,children);
  }

  private card(children:Phaser.GameObjects.GameObject[],map:CommunityMapCard,y:number):void{
    const bg=this.add.rectangle(270,y,454,68,map.featured?0x1d2923:0x121b22).setStrokeStyle(1,map.featured?0x6a7655:0x30414e).setInteractive({useHandCursor:true});
    const title=this.add.text(62,y-13,`${map.featured?"★ ":""}${map.title}`,{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
    const creator=this.add.text(62,y+13,`por ${map.creator}${map.isMine?" · TUYO":""}`,{fontFamily:"system-ui",fontSize:"10px",color:map.isMine?"#e4cf86":"#8395a2"}).setOrigin(0,.5);
    const score=map.ratingCount>0?`♥ ${map.fun?.toFixed(1)}   ✦ ${map.originality?.toFixed(1)}   · ${map.ratingCount} votos`:"SIN VOTOS";
    const stats=this.add.text(478,y-2,score,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#b9c7d0"}).setOrigin(1,.5);
    const open=()=>this.scene.start("community-play",{mapId:map.id});bg.on("pointerup",open);title.setInteractive({useHandCursor:true}).on("pointerup",open);stats.setInteractive({useHandCursor:true}).on("pointerup",open);
    children.push(bg,title,creator,stats);
  }

  private async publish():Promise<void>{
    await BetaTelemetry.ensureTester(true);
    if(!CommunityMaps.currentDraft()){this.toast("No hay borrador. Crea un mapa en BETA LAB primero.",false);return;}
    const title=window.prompt("Nombre del mapa (máx. 48 caracteres)","Mi mapa")?.trim();if(!title)return;
    const description=window.prompt("Descripción opcional","")??"";
    this.status.setText("PUBLICANDO…");
    const result=await CommunityMaps.publishDraft(title,description);
    if(!result.ok){this.toast(result.error==="publish_rate_limited"?"Demasiados mapas publicados en poco tiempo.":"No se pudo publicar.",false);return;}
    this.toast("✓ MAPA PUBLICADO",true);this.sort="new";await this.reload();
  }

  private toast(message:string,ok:boolean):void{
    const t=this.add.text(270,900,message,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:ok?"#daf0dd":"#f0c2b8",backgroundColor:ok?"#14231a":"#2a1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(30);
    this.tweens.add({targets:t,alpha:0,delay:1200,duration:250,onComplete:()=>t.destroy()});
  }
}
