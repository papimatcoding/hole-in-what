import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { CommunityMaps, type CommunityMapCard, type CommunitySort } from "../systems/CommunityMapsSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";

export class CommunityMapsScene extends Phaser.Scene{
  private sort:CommunitySort="trending";
  private list:Phaser.GameObjects.Container|null=null;
  private status!:Phaser.GameObjects.Text;
  private tabs:Phaser.GameObjects.Rectangle[]=[];
  private tabLabels:Phaser.GameObjects.Text[]=[];
  private modal:Phaser.GameObjects.Container|null=null;
  private desktop=false;

  constructor(){super("community-maps");}

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();this.cameras.main.setBackgroundColor("#0b0f14");
    const back=this.add.rectangle(48,52,54,48,0x141e26).setStrokeStyle(1,0x3b4c59).setInteractive({useHandCursor:true});this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);back.on("pointerover",()=>back.setFillStyle(0x1e2b35)).on("pointerout",()=>back.setFillStyle(0x141e26)).on("pointerup",()=>this.scene.start("menu"));
    this.add.text(270,58,"COMMUNITY MAPS",{fontFamily:"system-ui",fontSize:uiFontSize(25,3),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.rectangle(270,86,64,3,0x6f98ae,.9);
    this.add.text(270,108,"Descubre, juega y publica mapas de la comunidad",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8495a3"}).setOrigin(.5);
    this.tab(108,150,"TENDENCIA","trending",0);this.tab(270,150,"MEJORES","top",1);this.tab(432,150,"NUEVOS","new",2);
    this.largeButton(270,204,"+ PUBLICAR UN MAPA",()=>{void this.openPublish();});
    this.status=this.add.text(270,246,"CARGANDO…",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8fa1ae"}).setOrigin(.5);
    sharpenSceneText(this);void this.reload();
  }

  private tab(x:number,y:number,label:string,sort:CommunitySort,index:number):void{
    const active=sort===this.sort,bg=this.add.rectangle(x,y,146,42,active?0x223946:0x141f27).setStrokeStyle(active?2:1,active?0x77a2ba:0x344754).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:active?"#edf6fa":"#a9bac5"}).setOrigin(.5);this.tabs[index]=bg;this.tabLabels[index]=t;
    const select=()=>{this.sort=sort;this.tabs.forEach((tab,i)=>{const on=i===index;tab.setFillStyle(on?0x223946:0x141f27).setStrokeStyle(on?2:1,on?0x77a2ba:0x344754);this.tabLabels[i]?.setColor(on?"#edf6fa":"#a9bac5");});void this.reload();};
    bg.on("pointerover",()=>{if(sort!==this.sort)bg.setFillStyle(0x1b2a33);}).on("pointerout",()=>{if(sort!==this.sort)bg.setFillStyle(0x141f27);}).on("pointerup",select);t.setInteractive({useHandCursor:true}).on("pointerup",select);
  }
  private largeButton(x:number,y:number,label:string,action:()=>void):void{const bg=this.add.rectangle(x,y,this.desktop?390:360,54,0x1d3441).setStrokeStyle(2,0x5a8398).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#e6f2f7"}).setOrigin(.5);bg.on("pointerover",()=>bg.setFillStyle(0x294b5c)).on("pointerout",()=>bg.setFillStyle(0x1d3441)).on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});}
  private async openPublish():Promise<void>{await BetaTelemetry.ensureTester(false);this.scene.start("community-publish");}

  private async reload():Promise<void>{
    this.list?.destroy(true);this.list=null;this.status.setColor("#8fa1ae").setText("CARGANDO…");
    const maps=await CommunityMaps.list(this.sort);
    if(!maps.length){this.status.setText("Todavía no hay mapas publicados. Sé el primero.");return;}
    const label=this.sort==="trending"?"actividad reciente":this.sort==="top"?"estrellas":"más recientes";this.status.setText(`${maps.length} mapas · ordenados por ${label}`);
    const children:Phaser.GameObjects.GameObject[]=[];const limit=this.desktop?6:7,spacing=this.desktop?96:91,startY=this.desktop?310:300;maps.slice(0,limit).forEach((map,i)=>this.card(children,map,startY+i*spacing));this.list=this.add.container(0,0,children);
  }

  private card(children:Phaser.GameObjects.GameObject[],map:CommunityMapCard,y:number):void{
    const h=this.desktop?84:78,rest=map.featured?0x1b2822:0x121b22,hover=map.featured?0x24342b:0x1b2932,stroke=map.playingNow>0?0x4f8f73:map.featured?0x6a7655:0x30414e;
    const bg=this.add.rectangle(270,y,454,h,rest).setStrokeStyle(map.playingNow>0?2:1,stroke).setInteractive({useHandCursor:true});
    const accent=this.add.rectangle(47,y,4,h-10,map.playingNow>0?0x5d9b7c:map.featured?0xa29358:0x476779,.9);
    const title=this.add.text(62,y-23,`${map.featured?"◆ ":""}${map.title}`,{fontFamily:"system-ui",fontSize:uiFontSize(12,2),fontStyle:"bold",color:"#eef4f8"}).setOrigin(0,.5);
    const creator=this.add.text(62,y+1,`por ${map.creator}${map.isMine?" · TUYO":""} · ${map.holeCount} ${map.holeCount===1?"HOYO":"HOYOS"}`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:map.isMine?"#e4cf86":"#8395a2"}).setOrigin(0,.5);
    const stars=map.ratingCount?`${this.starText(map.stars??0)} ${(map.stars??0).toFixed(1)} · ${map.ratingCount}`:"☆☆☆☆☆ · SIN VOTOS";
    const stats=this.add.text(62,y+25,`${stars}   ·   ${map.plays} jugadas · ${map.uniquePlayers} jugadores`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#b9c7d0"}).setOrigin(0,.5);
    const live=map.playingNow>0?this.add.text(478,y-18,`● ${map.playingNow} JUGANDO`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#7fd0a6"}).setOrigin(1,.5):this.add.text(478,y-18,"JUGAR  ›",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#8fb7ca"}).setOrigin(1,.5);
    const open=()=>this.scene.start("community-play",{mapId:map.id});for(const obj of[bg,title,stats,live])obj.setInteractive({useHandCursor:true}).on("pointerup",open);bg.on("pointerover",()=>bg.setFillStyle(hover).setScale(1.01)).on("pointerout",()=>bg.setFillStyle(rest).setScale(1));children.push(bg,accent,title,creator,stats,live);
    if(map.isMine){
      const delBg=this.add.rectangle(446,y+22,72,30,0x2a1719).setStrokeStyle(1,0x87545a).setInteractive({useHandCursor:true});
      const delText=this.add.text(446,y+22,"BORRAR",{fontFamily:"system-ui",fontSize:uiFontSize(7,2),fontStyle:"bold",color:"#e8b5b8"}).setOrigin(.5).setInteractive({useHandCursor:true});
      const del=(pointer?:Phaser.Input.Pointer):void=>{pointer?.event?.stopPropagation?.();this.confirmDelete(map);};
      delBg.on("pointerover",()=>delBg.setFillStyle(0x3a2024)).on("pointerout",()=>delBg.setFillStyle(0x2a1719)).on("pointerup",del);delText.on("pointerup",del);children.push(delBg,delText);
    }
  }

  private confirmDelete(map:CommunityMapCard):void{
    this.modal?.destroy(true);
    const children:Phaser.GameObjects.GameObject[]=[];
    const shade=this.add.rectangle(DESIGN_WIDTH/2,DESIGN_HEIGHT/2,DESIGN_WIDTH,DESIGN_HEIGHT,0x05080b,.88).setInteractive();
    const panel=this.add.rectangle(270,460,430,290,0x111a21).setStrokeStyle(2,0x6a3e43);
    const title=this.add.text(270,382,"¿BORRAR MAPA?",{fontFamily:"system-ui",fontSize:uiFontSize(21,2),fontStyle:"bold",color:"#f3e7e8"}).setOrigin(.5);
    const name=this.add.text(270,426,map.title,{fontFamily:"system-ui",fontSize:uiFontSize(14,2),fontStyle:"bold",color:"#dce6ec",wordWrap:{width:350},align:"center"}).setOrigin(.5);
    const warning=this.add.text(270,474,"También se borrarán sus partidas, valoraciones, comentarios y reportes.\nEsta acción no se puede deshacer.",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:"#a8b5bd",align:"center",lineSpacing:5,wordWrap:{width:350}}).setOrigin(.5);
    const cancelBg=this.add.rectangle(174,548,158,48,0x18232b).setStrokeStyle(1,0x41525e).setInteractive({useHandCursor:true});const cancel=this.add.text(174,548,"CANCELAR",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#c5d1d8"}).setOrigin(.5);
    const deleteBg=this.add.rectangle(366,548,158,48,0x3b1d21).setStrokeStyle(2,0x9a555d).setInteractive({useHandCursor:true});const deleteText=this.add.text(366,548,"BORRAR",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#f0c4c8"}).setOrigin(.5);
    const close=():void=>{this.modal?.destroy(true);this.modal=null;};cancelBg.on("pointerover",()=>cancelBg.setFillStyle(0x22313b)).on("pointerout",()=>cancelBg.setFillStyle(0x18232b)).on("pointerup",close);
    deleteBg.on("pointerover",()=>deleteBg.setFillStyle(0x4c262b)).on("pointerout",()=>deleteBg.setFillStyle(0x3b1d21)).on("pointerup",()=>{deleteBg.disableInteractive();deleteText.setText("BORRANDO…");void(async()=>{const result=await CommunityMaps.delete(map.id);close();if(!result.ok){this.status.setColor("#d99595").setText("No se pudo borrar el mapa.");return;}this.status.setColor("#82c99e").setText("MAPA BORRADO");await this.reload();})();});
    children.push(shade,panel,title,name,warning,cancelBg,cancel,deleteBg,deleteText);this.modal=this.add.container(0,0,children).setDepth(1000);
  }
  private starText(value:number):string{const full=Math.max(0,Math.min(5,Math.round(value)));return"★".repeat(full)+"☆".repeat(5-full);}
}
