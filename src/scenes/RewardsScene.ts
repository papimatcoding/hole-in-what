import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PRODUCT_FEATURES } from "../config/product";
import { cosmeticById } from "../data/cosmetics";
import { STAR_REWARDS } from "../data/progression";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";

export class RewardsScene extends Phaser.Scene {
  constructor(){super("rewards");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0e0c17");

    const back=this.add.rectangle(48,52,54,48,0x14121d).setStrokeStyle(1,0x40354f).setInteractive({useHandCursor:true});
    const backText=this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);
    back.on("pointerover",()=>back.setFillStyle(0x211b2c)).on("pointerout",()=>back.setFillStyle(0x14121d)).on("pointerup",()=>this.scene.start("menu"));
    backText.setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("menu"));

    if(!PRODUCT_FEATURES.cosmetics){
      this.add.text(270,236,"RECOMPENSAS",{fontFamily:"system-ui",fontSize:uiFontSize(26,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
      this.add.rectangle(270,456,420,300,0x111820,.98).setStrokeStyle(2,0x354957);
      this.add.text(270,438,"PRÓXIMAMENTE",{fontFamily:"system-ui",fontSize:uiFontSize(27,2),fontStyle:"bold",color:"#dce7ed"}).setOrigin(.5);
      sharpenSceneText(this);return;
    }

    SaveSystem.claimEligibleStarRewards();
    const totalStars=SaveSystem.totalStarsAll();
    const maxStars=STAR_REWARDS.at(-1)?.stars??1;
    const progress=Math.max(0,Math.min(1,totalStars/maxStars));
    const next=STAR_REWARDS.find(reward=>reward.stars>totalStars);

    this.add.text(270,70,"PASE DE PRESTIGIO",{fontFamily:"system-ui",fontSize:uiFontSize(25,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,105,next?`SIGUIENTE RECOMPENSA · ★ ${totalStars} / ${next.stars}`:`★ ${totalStars} · COMPLETADO`,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#c2ef63"}).setOrigin(.5);

    this.add.rectangle(270,142,420,12,0x211a2b).setStrokeStyle(1,0x3d3150);
    if(progress>0)this.add.rectangle(60+(420*progress)/2,142,420*progress,8,0xc2ef63,.92);
    this.add.circle(60+420*progress,142,8,0xf1d07a).setStrokeStyle(2,0x4b3d25);
    this.add.text(60,166,"0★",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:"#657282"}).setOrigin(.5);
    this.add.text(480,166,`${maxStars}★`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:"#657282"}).setOrigin(.5);

    const railX=94,firstY=260,lastY=firstY+(STAR_REWARDS.length-1)*142;
    this.add.rectangle(railX,(firstY+lastY)/2,6,lastY-firstY+12,0x282131);
    const railProgress=Math.max(0,Math.min(1,totalStars/maxStars));
    if(railProgress>0)this.add.rectangle(railX,firstY+(lastY-firstY)*railProgress/2,4,(lastY-firstY)*railProgress,0xc2ef63,.8);

    STAR_REWARDS.forEach((reward,index)=>{
      const item=cosmeticById(reward.cosmeticId);if(!item)return;
      const unlocked=SaveSystem.isOwned(item.id),isNext=!unlocked&&next?.cosmeticId===reward.cosmeticId;
      const y=firstY+index*142;
      const node=this.add.circle(railX,y,25,unlocked?0x283526:isNext?0x2a2334:0x17151e).setStrokeStyle(isNext?3:2,unlocked?0xc2ef63:isNext?0xb68cff:0x393142);
      this.add.text(railX,y,`${reward.stars}★`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:unlocked?"#dff6a1":isNext?"#e0c8ff":"#716a78"}).setOrigin(.5);

      const card=this.add.rectangle(318,y,330,112,unlocked?0x181f1b:isNext?0x1d1727:0x14121a,.98).setStrokeStyle(isNext?2:1,unlocked?0x405b46:isNext?0x6f538c:0x2f2937);
      if(isNext)this.tweens.add({targets:[card,node],alpha:{from:.82,to:1},duration:900,yoyo:true,repeat:-1});

      const icon=this.add.graphics();
      if(item.category==="ball")drawBall(icon,item,190,y,24);
      else if(item.category==="trail"){
        icon.fillStyle(item.primary,(unlocked||isNext)?.95:.32);
        for(let i=0;i<5;i+=1)icon.fillCircle(172+i*10,y+Math.sin(i)*4,2.5+i*.45);
      }else{
        icon.lineStyle(3,item.primary,(unlocked||isNext)?.9:.32);icon.strokeCircle(190,y,21);
      }

      this.add.text(228,y-24,item.name,{fontFamily:"system-ui",fontSize:uiFontSize(14,2),fontStyle:"bold",color:unlocked?"#f5f7fa":isNext?"#eadcff":"#9d98a4"}).setOrigin(0,.5);
      this.add.text(228,y+5,item.description,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),color:unlocked?"#919f95":"#77717d",wordWrap:{width:220}}).setOrigin(0,.5);
      this.add.text(448,y+34,unlocked?"CONSEGUIDO":isNext?`${reward.stars-totalStars}★ PARA DESBLOQUEAR`:"BLOQUEADO",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:unlocked?"#a8d3a8":isNext?"#c2ef63":"#68636d"}).setOrigin(1,.5);
    });

    this.add.text(270,834,"PERMANENTE · SIN REINICIOS",{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#81758f"}).setOrigin(.5);
    const customize=this.add.rectangle(270,892,300,52,0x2a2038).setStrokeStyle(2,0x76599a).setInteractive({useHandCursor:true});
    const customizeText=this.add.text(270,892,"PERSONALIZAR",{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:"#f2eaff"}).setOrigin(.5);
    customize.on("pointerover",()=>customize.setFillStyle(0x38294b)).on("pointerout",()=>customize.setFillStyle(0x2a2038)).on("pointerup",()=>this.scene.start("cosmetics"));
    customizeText.setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("cosmetics"));

    sharpenSceneText(this);
  }
}
