import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PRODUCT_FEATURES } from "../config/product";
import { cosmeticById } from "../data/cosmetics";
import { PRESTIGE_REWARDS, campaignChapterDefinition } from "../data/progression";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";

export class RewardsScene extends Phaser.Scene {
  constructor(){super("rewards");}

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0e0c17");

    const back=this.add.rectangle(48,52,54,48,0x14121d).setStrokeStyle(1,0x40354f).setInteractive({useHandCursor:true});
    const backText=this.add.text(48,50,"‹",{fontFamily:"system-ui",fontSize:uiFontSize(32,3),fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5);
    const goBack=()=>this.scene.start("menu");
    back.on("pointerover",()=>back.setFillStyle(0x211b2c)).on("pointerout",()=>back.setFillStyle(0x14121d)).on("pointerup",goBack);
    backText.setInteractive({useHandCursor:true}).on("pointerup",goBack);

    if(!PRODUCT_FEATURES.cosmetics){
      this.add.text(270,236,"RECOMPENSAS",{fontFamily:"system-ui",fontSize:uiFontSize(26,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
      this.add.rectangle(270,456,420,300,0x111820,.98).setStrokeStyle(2,0x354957);
      this.add.text(270,438,"PRÓXIMAMENTE",{fontFamily:"system-ui",fontSize:uiFontSize(27,2),fontStyle:"bold",color:"#dce7ed"}).setOrigin(.5);
      sharpenSceneText(this);return;
    }

    const totalStars=SaveSystem.totalStarsAll();
    const maxStars=PRESTIGE_REWARDS.at(-1)?.stars??1;
    const progress=Math.max(0,Math.min(1,totalStars/maxStars));
    const nextUnclaimed=PRESTIGE_REWARDS.find(reward=>!SaveSystem.prestigeRewardState(reward.id).claimed);
    const claimable=PRESTIGE_REWARDS.find(reward=>{const state=SaveSystem.prestigeRewardState(reward.id);return state.eligible&&!state.claimed;});

    this.add.text(270,68,"PASE DE PRESTIGIO",{fontFamily:"system-ui",fontSize:uiFontSize(25,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    const header=claimable
      ?`RECOMPENSA LISTA · ★ ${totalStars}`
      :nextUnclaimed
        ?`SIGUIENTE RECOMPENSA · ★ ${totalStars} / ${nextUnclaimed.stars}`
        :`★ ${totalStars} · COMPLETADO`;
    this.add.text(270,103,header,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:claimable?"#f1d07a":"#c2ef63"}).setOrigin(.5);

    this.add.rectangle(270,140,420,12,0x211a2b).setStrokeStyle(1,0x3d3150);
    if(progress>0)this.add.rectangle(60+(420*progress)/2,140,420*progress,8,0xc2ef63,.92);
    this.add.circle(60+420*progress,140,8,0xf1d07a).setStrokeStyle(2,0x4b3d25);
    this.add.text(60,164,"0★",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:"#657282"}).setOrigin(.5);
    this.add.text(480,164,`${maxStars}★`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:"#657282"}).setOrigin(.5);

    const railX=82,firstY=242,gap=116,lastY=firstY+(PRESTIGE_REWARDS.length-1)*gap;
    this.add.rectangle(railX,(firstY+lastY)/2,6,lastY-firstY+12,0x282131);
    if(progress>0)this.add.rectangle(railX,firstY+(lastY-firstY)*progress/2,4,(lastY-firstY)*progress,0xc2ef63,.8);

    PRESTIGE_REWARDS.forEach((reward,index)=>{
      const state=SaveSystem.prestigeRewardState(reward.id),claimed=state.claimed,ready=state.eligible&&!claimed;
      const y=firstY+index*gap;
      const node=this.add.circle(railX,y,24,claimed?0x283526:ready?0x382d20:0x17151e).setStrokeStyle(ready?3:2,claimed?0xc2ef63:ready?0xf1d07a:0x393142);
      this.add.text(railX,y,`${reward.stars}★`,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:claimed?"#dff6a1":ready?"#ffe6a5":"#716a78"}).setOrigin(.5);

      const card=this.add.rectangle(314,y,342,94,claimed?0x181f1b:ready?0x241d18:0x14121a,.98).setStrokeStyle(ready?2:1,claimed?0x405b46:ready?0x8e7140:0x2f2937);
      if(ready)this.tweens.add({targets:[card,node],alpha:{from:.86,to:1},duration:820,yoyo:true,repeat:-1});

      if(reward.kind==="cosmetic"){
        const item=cosmeticById(reward.cosmeticId);if(!item)return;
        const icon=this.add.graphics();
        if(item.category==="ball")drawBall(icon,item,176,y,22);
        else if(item.category==="trail"){
          icon.fillStyle(item.primary,claimed||ready?.95:.32);
          for(let i=0;i<5;i+=1)icon.fillCircle(158+i*9,y+Math.sin(i)*4,2.4+i*.4);
        }else{
          icon.lineStyle(3,item.primary,claimed||ready?.9:.32);icon.strokeCircle(176,y,20);
        }
        this.add.text(212,y-21,item.name,{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:claimed?"#f5f7fa":ready?"#fff0c5":"#9d98a4"}).setOrigin(0,.5);
        this.add.text(212,y+4,item.description,{fontFamily:"system-ui",fontSize:uiFontSize(8,2),color:claimed?"#919f95":"#77717d",wordWrap:{width:155}}).setOrigin(0,.5);
      }else{
        const chapter=campaignChapterDefinition(reward.chapterIndex),icon=this.add.graphics();
        icon.fillStyle(0x59616b,claimed||ready?.95:.36);
        icon.fillRect(154,y-17,12,34);icon.fillRect(170,y-27,16,44);icon.fillRect(190,y-10,13,27);
        icon.fillStyle(0xc2ef63,claimed||ready?.9:.24);icon.fillRect(175,y-20,4,4);icon.fillRect(175,y-8,4,4);
        this.add.text(212,y-20,chapter.name,{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:claimed?"#f5f7fa":ready?"#fff0c5":"#9d98a4"}).setOrigin(0,.5);
        this.add.text(212,y+5,"NUEVO CAPÍTULO",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:claimed?"#92b899":ready?"#d7c58d":"#77717d"}).setOrigin(0,.5);
      }

      const actionX=430,actionY=y+23;
      if(claimed){
        this.add.text(actionX,actionY,"RECLAMADO",{fontFamily:"system-ui",fontSize:uiFontSize(7,2),fontStyle:"bold",color:"#8fb89a"}).setOrigin(.5);
      }else if(ready){
        const action=this.add.rectangle(actionX,actionY,102,30,0x4b3a20).setStrokeStyle(1,0xf1d07a).setInteractive({useHandCursor:true});
        const actionText=this.add.text(actionX,actionY,"RECLAMAR",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#fff0bd"}).setOrigin(.5);
        const claim=()=>{const result=SaveSystem.claimPrestigeReward(reward.id);if(result.ok)this.scene.restart();};
        action.on("pointerover",()=>action.setFillStyle(0x63502c)).on("pointerout",()=>action.setFillStyle(0x4b3a20)).on("pointerup",claim);
        actionText.setInteractive({useHandCursor:true}).on("pointerup",claim);
      }else{
        this.add.text(actionX,actionY,`${Math.max(0,reward.stars-totalStars)}★ FALTAN`,{fontFamily:"system-ui",fontSize:uiFontSize(7,2),fontStyle:"bold",color:"#6d6871"}).setOrigin(.5);
      }
    });

    this.add.text(270,834,"LAS RECOMPENSAS SE RECLAMAN MANUALMENTE",{fontFamily:"system-ui",fontSize:uiFontSize(8,2),fontStyle:"bold",color:"#81758f"}).setOrigin(.5);
    const customize=this.add.rectangle(270,892,300,52,0x2a2038).setStrokeStyle(2,0x76599a).setInteractive({useHandCursor:true});
    const customizeText=this.add.text(270,892,"PERSONALIZAR",{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:"#f2eaff"}).setOrigin(.5);
    const openCosmetics=()=>this.scene.start("cosmetics");
    customize.on("pointerover",()=>customize.setFillStyle(0x38294b)).on("pointerout",()=>customize.setFillStyle(0x2a2038)).on("pointerup",openCosmetics);
    customizeText.setInteractive({useHandCursor:true}).on("pointerup",openCosmetics);

    sharpenSceneText(this);
  }
}
