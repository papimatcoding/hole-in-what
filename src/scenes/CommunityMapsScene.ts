import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { CommunityMaps, type CommunityMapCard, type CommunitySort } from "../systems/CommunityMapsSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class CommunityMapsScene extends Phaser.Scene{
  private sort:CommunitySort="trending";
  private list:Phaser.GameObjects.Container|null=null;
  private status!:Phaser.GameObjects.Text;
  private tabs:Phaser.GameObjects.Rectangle[]=[];

  constructor(){super("community-maps");}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    const back=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:"32px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);back.on("pointerup",()=>this.scene.start("menu"));
    this.add.text(270,58,"COMMUNITY MAPS",{fontFamily:"system-ui",fontSize:"25px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,92,"Descubre, juega y publica mapas de la comunidad",{fontFamily:"system-ui",fontSize:"11px",color:"#8495a3"}).setOrigin(.5);
    this.tab(108,136,"TENDENCIA","trending",0);this.tab(270,136,"MEJORES","top",1);this.tab(432,136,"NUEVOS","new",2);
    this.largeButton(270,188,"+ PUBLICAR UN MAPA",()=>{void this.openPublish();});
    this.status=this.add.text(270,230,"CARGANDO…",{fontFamily:"system-ui",fontSize:"11px",color:"#8fa1ae"}).setOrigin(.5);
    sharpenSceneText(this);void this.reload();
  }

  private tab(x:number,y:number,label:string,sort:CommunitySort,index:number):void{
    const bg=this.add.rectangle(x,y,146,42,0x17232c).setStrokeStyle(2,sort===this.sort?0x77a2ba:0x344754).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:sort===this.sort?"#edf6fa":"#a9bac5"}).setOrigin(.5);this.tabs[index]=bg;
    bg.on("pointerup",()=>{this.sort=sort;this.tabs.forEach((tab,i)=>tab.setStrokeStyle(2,i===index?0x77a2ba:0x344754));void this.reload();});t.setInteractive({useHandCursor:true}).on("pointerup",()=>bg.emit("pointerup"));
  }
  private largeButton(x:number,y:number,label:string,action:()=>void):void{const bg=this.add.rectangle(x,y,360,52,0x1d3441).setStrokeStyle(2,0x5a8398).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#e6f2f7"}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(0x294b5c)).on("pointerout",()=>bg.setFillStyle(0x1d3441)).on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});}
  private async openPublish():Promise<void>{await BetaTelemetry.ensureTester(true);this.scene.start("community-publish");}

  private async reload():Promise<void>{
    this.list?.destroy(true);this.list=null;this.status.setText("CARGANDO…");
    const maps=await CommunityMaps.list(this.sort);
    if(!maps.length){this.status.setText("Todavía no hay mapas publicados. Sé el primero.");return;}
    const label=this.sort==="trending"?"actividad reciente":this.sort==="top"?"estrellas":"más recientes";this.status.setText(`${maps.length} mapas · ordenados por ${label}`);
    const children:Phaser.GameObjects.GameObject[]=[];maps.slice(0,7).forEach((map,i)=>this.card(children,map,286+i*91));this.list=this.add.container(0,0,children);
  }

  private card(children:Phaser.GameObjects.GameObject[],map:CommunityMapCard,y:number):void{
    const bg=this.add.rectangle(270,y,454,78,map.featured?0x1d2923:0x121b22).setStrokeStyle(2,map.playingNow>0?0x4f8f73:map.featured?0x6a7655:0x30414e).setInteractive({useHandCursor:true});
    const title=this.add.text(62,y-22,`${map.featured?"◆ ":""}${map.title}`,{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
    const creator=this.add.text(62,y+1,`por ${map.creator}${map.isMine?" · TUYO":""} · ${map.holeCount} ${map.holeCount===1?"HOYO":"HOYOS"}`,{fontFamily:"system-ui",fontSize:"9px",color:map.isMine?"#e4cf86":"#8395a2"}).setOrigin(0,.5);
    const stars=map.ratingCount?`${this.starText(map.stars??0)} ${(map.stars??0).toFixed(1)} · ${map.ratingCount}`:"☆☆☆☆☆ · SIN VOTOS";
    const stats=this.add.text(62,y+24,`${stars}   ·   ${map.plays} jugadas · ${map.uniquePlayers} jugadores`,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#b9c7d0"}).setOrigin(0,.5);
    const live=map.playingNow>0?this.add.text(478,y-18,`● ${map.playingNow} JUGANDO`,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#7fd0a6"}).setOrigin(1,.5):this.add.text(478,y-18,"JUGAR  ›",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#8fb7ca"}).setOrigin(1,.5);
    const open=()=>this.scene.start("community-play",{mapId:map.id});for(const obj of[bg,title,stats,live])obj.setInteractive({useHandCursor:true}).on("pointerup",open);children.push(bg,title,creator,stats,live);
  }
  private starText(value:number):string{const full=Math.max(0,Math.min(5,Math.round(value)));return"★".repeat(full)+"☆".repeat(5-full);}
}
