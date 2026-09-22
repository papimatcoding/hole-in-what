import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { DESIGN_WIDTH, VIEW_WIDTH, isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { PRODUCT_FEATURES } from "../config/product";
import { CAMPAIGN_ENTRIES } from "../data/campaign";
import { cosmeticById, cosmeticsByCategory, type CosmeticCategory, type CosmeticDefinition } from "../data/cosmetics";
import { CAMPAIGN_CHAPTER_SIZE, PRESTIGE_REWARDS, campaignChapterDefinition } from "../data/progression";
import { dailyShopIds } from "../data/shopRotation";
import { BetaFeedbackSystem } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { drawBall } from "../systems/CosmeticRenderer";
import { I18n, type GameLanguage } from "../systems/I18nSystem";
import { LiveOps } from "../systems/LiveOpsSystem";
import { PatchNotes } from "../systems/PatchNotesSystem";
import { ProductTelemetry } from "../systems/ProductTelemetrySystem";
import { SaveSystem } from "../systems/SaveSystem";

type DesktopSection="campaign"|"cosmetics"|"shop"|"prestige";

interface SectionDefinition{ id:DesktopSection; label:string; }
interface ChapterMenuCard{ index:number; name:string; exists:boolean; }
interface MenuData{ section?:DesktopSection; carouselOffset?:number; }

const DESKTOP_SECTIONS:SectionDefinition[]=[
  {id:"campaign",label:"CAMPAÑA"},
  {id:"cosmetics",label:"COSMÉTICOS"},
  {id:"shop",label:"TIENDA"},
  {id:"prestige",label:"PRESTIGIO"}
];

// Oasis and The Void are display-only placeholders. They deliberately create no
// campaign data, mechanics, levels or visual identity before their design pass.
const CHAPTER_MENU_CARDS:ChapterMenuCard[]=[
  {index:0,name:"GRASSLAND",exists:true},
  {index:1,name:"METROPOLIS",exists:true},
  {index:2,name:"OASIS",exists:false},
  {index:3,name:"THE VOID",exists:false}
];

const CATEGORY_LABELS:Record<CosmeticCategory,string>={ball:"BOLAS",trail:"ESTELAS",holeEffect:"EFECTOS DE HOYO"};

export class MenuScene extends Phaser.Scene {
  private desktop=false;
  private desktopSection:DesktopSection="campaign";
  private carouselOffset=0;
  private sectionLayer?:Phaser.GameObjects.Container;
  private sectionButtons=new Map<DesktopSection,{bg:Phaser.GameObjects.Rectangle;title:Phaser.GameObjects.Text;meta:Phaser.GameObjects.Text}>();
  private mobileSectionButtons=new Map<DesktopSection,{bg:Phaser.GameObjects.Rectangle;icon:Phaser.GameObjects.Text;label:Phaser.GameObjects.Text}>();

  constructor(){super("menu");}

  init(data:MenuData={}):void{
    const validSection=DESKTOP_SECTIONS.some(section=>section.id===data.section);
    this.desktopSection=validSection?data.section!:"campaign";
    this.carouselOffset=Math.max(0,Math.floor((data.carouselOffset??0)/3)*3);
  }

  create():void{
    setupDesignCamera(this);this.desktop=isDesktopUI();
    this.cameras.main.setBackgroundColor("#0b0f14");
    void BetaTelemetry.ensureTester(false);
    void ProductTelemetry.ensureSession();
    ProductTelemetry.track({eventName:"menu_view",scene:"menu"});

    if(this.desktop)this.createDesktopMenu();
    else this.createMobileMenu();

    sharpenSceneText(this);
  }

  private createDesktopMenu():void{
    const left=DESIGN_WIDTH/2-VIEW_WIDTH/2,right=DESIGN_WIDTH/2+VIEW_WIDTH/2;
    this.drawDesktopBackground(left,right);

    this.add.text(left+68,54,"HOLE IN WHAT?",{fontFamily:"system-ui, sans-serif",fontSize:"30px",fontStyle:"bold",color:"#eaf0e6"}).setOrigin(0,.5);
    this.add.rectangle(left+72,82,62,3,0xc2ef63,.92).setOrigin(0,.5);

    const online=this.add.text(left+68,108,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));
    this.events.once("shutdown",stopOnline);

    const wallet=SaveSystem.wallet();
    this.add.text(right-390,54,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#bac6cf"}).setOrigin(1,.5);
    this.desktopIdentity(right-354,54);
    this.languageSelector(right-108,54);

    this.add.text(left+68,164,"MENÚ PRINCIPAL",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#82798f"}).setOrigin(0,.5);
    this.createDesktopSectionButtons();
    this.renderDesktopSection();
    this.createDesktopUtilityBar(left,right);
  }

  private drawDesktopBackground(left:number,right:number):void{
    this.cameras.main.setBackgroundColor("#0e0c17");
    const g=this.add.graphics();
    g.fillStyle(0x171124,.78);g.fillCircle(right-120,80,300);
    g.fillStyle(0x263323,.26);g.fillCircle(left+120,960,350);
    g.lineStyle(1,0xb68cff,.055);
    for(let y=148;y<870;y+=90)g.lineBetween(left+36,y,right-36,y);
    g.lineStyle(1,0xc2ef63,.04);
    for(let x=left+60;x<right;x+=150)g.lineBetween(x,130,x+370,870);
    g.fillStyle(0x09080e,.72);g.fillRoundedRect(left+42,136,VIEW_WIDTH-84,704,22);
    g.lineStyle(1,0x49375d,.42);g.strokeRoundedRect(left+42,136,VIEW_WIDTH-84,704,22);
  }

  private desktopIdentity(x:number,y:number):void{
    const alias=BetaTelemetry.alias(),rest=alias?0x181420:0x211b18,hover=alias?0x241d30:0x302718;
    const bg=this.add.rectangle(x,y,238,40,rest).setStrokeStyle(1,alias?0x49365d:0x65562f);
    const label=this.add.text(x,y,alias?`JUGADOR · ${alias}   ✎`:"ELIGE TU NOMBRE   ✎",{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:alias?"#d3cedb":"#e7c477"}).setOrigin(.5);
    this.wirePress(bg,label,x,y,246,46,()=>this.scene.start("player-profile"),rest,hover);
  }

  private languageSelector(x:number,y:number):void{
    const current=I18n.language();
    const select=(next:GameLanguage):void=>{if(next===I18n.language())return;I18n.set(next);this.scene.restart();};
    const left=this.add.rectangle(x-23,y,42,32,current==="es"?0x35422e:0x14111c).setStrokeStyle(1,current==="es"?0x91b56f:0x40364d).setInteractive({useHandCursor:true});
    const right=this.add.rectangle(x+23,y,42,32,current==="en"?0x35422e:0x14111c).setStrokeStyle(1,current==="en"?0x91b56f:0x40364d).setInteractive({useHandCursor:true});
    const es=this.add.text(x-23,y,"ES",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:current==="es"?"#eef7e8":"#756d82"}).setOrigin(.5).setInteractive({useHandCursor:true});
    const en=this.add.text(x+23,y,"EN",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:current==="en"?"#eef7e8":"#756d82"}).setOrigin(.5).setInteractive({useHandCursor:true});
    left.on("pointerup",()=>select("es"));es.on("pointerup",()=>select("es"));right.on("pointerup",()=>select("en"));en.on("pointerup",()=>select("en"));
  }

  private createDesktopSectionButtons():void{
    const cardW=330,gap=22,startX=DESIGN_WIDTH/2-(cardW+gap)*1.5;
    DESKTOP_SECTIONS.forEach((section,index)=>{
      const x=startX+index*(cardW+gap),active=section.id===this.desktopSection,rest=active?0x2a2335:0x15121d,stroke=active?0xb68cff:0x3b3148;
      const bg=this.add.rectangle(x,218,cardW,76,rest).setStrokeStyle(active?2:1,stroke);
      const title=this.add.text(x-cardW/2+22,207,section.label,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:active?"#f5f2f8":"#a69dac"}).setOrigin(0,.5);
      const meta=this.add.text(x-cardW/2+22,233,this.sectionMetric(section.id),{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:active?"#c2ef63":"#6f6878"}).setOrigin(0,.5);
      this.add.text(x+cardW/2-20,218,"›",{fontFamily:"system-ui",fontSize:"24px",fontStyle:"bold",color:active?"#c2ef63":"#554b61"}).setOrigin(1,.5);
      const zone=this.add.zone(x,218,cardW,76).setInteractive({useHandCursor:true});
      zone.on("pointerover",()=>{if(this.desktopSection!==section.id)bg.setFillStyle(0x211a2b);});
      zone.on("pointerout",()=>{if(this.desktopSection!==section.id)bg.setFillStyle(0x15121d);});
      zone.on("pointerup",()=>this.selectDesktopSection(section.id));
      this.sectionButtons.set(section.id,{bg,title,meta});
    });
  }

  private sectionMetric(section:DesktopSection):string{
    const totalStars=SaveSystem.totalStars(CAMPAIGN_ENTRIES.map(entry=>entry.level.id));
    if(section==="campaign")return `★ ${totalStars}`;
    if(section==="cosmetics")return `${SaveSystem.cosmetics().owned.length} OBJ. EN COLECCIÓN`;
    if(section==="shop")return PRODUCT_FEATURES.shop?"ROTACIÓN DISPONIBLE":"PRÓXIMAMENTE";
    const claimable=PRESTIGE_REWARDS.filter(reward=>{const state=SaveSystem.prestigeRewardState(reward.id);return state.eligible&&!state.claimed;}).length;
    return claimable>0?`${claimable} PARA RECLAMAR`:`★ ${totalStars}`;
  }

  private selectDesktopSection(section:DesktopSection):void{
    if(section===this.desktopSection)return;
    const previous=DESKTOP_SECTIONS.findIndex(item=>item.id===this.desktopSection),next=DESKTOP_SECTIONS.findIndex(item=>item.id===section);
    this.desktopSection=section;this.carouselOffset=0;this.syncDesktopSectionButtons();this.renderDesktopSection(next>previous?1:-1);
  }

  private syncDesktopSectionButtons():void{
    for(const section of DESKTOP_SECTIONS){
      const button=this.sectionButtons.get(section.id);if(!button)continue;
      const active=section.id===this.desktopSection;
      button.bg.setFillStyle(active?0x2a2335:0x15121d).setStrokeStyle(active?2:1,active?0xb68cff:0x3b3148);
      button.title.setColor(active?"#f5f2f8":"#a69dac");
      button.meta.setText(this.sectionMetric(section.id)).setColor(active?"#c2ef63":"#6f6878");
    }
  }

  private renderDesktopSection(direction=0):void{
    const old=this.sectionLayer;
    const build=():void=>{
      const layer=this.add.container(direction===0?0:direction*48,0).setAlpha(direction===0?1:0);
      this.sectionLayer=layer;
      if(this.desktopSection==="campaign")this.renderCampaignCards(layer);
      else if(this.desktopSection==="cosmetics")this.renderCosmeticCards(layer);
      else if(this.desktopSection==="shop")this.renderShopCards(layer);
      else this.renderPrestigeCards(layer);
      if(direction!==0)this.tweens.add({targets:layer,x:0,alpha:1,duration:180,ease:"Cubic.easeOut"});
    };
    if(!old){build();return;}
    this.tweens.add({targets:old,x:-direction*48,alpha:0,duration:120,ease:"Cubic.easeIn",onComplete:()=>{old.destroy(true);build();}});
  }

  private renderCampaignCards(layer:Phaser.GameObjects.Container):void{
    this.addSectionHeading(layer,"CAMPAÑA","ELIGE CAPÍTULO",`★ ${SaveSystem.totalStars(CAMPAIGN_ENTRIES.map(entry=>entry.level.id))}`);
    const chapters=CHAPTER_MENU_CARDS.slice(this.carouselOffset,this.carouselOffset+3);
    chapters.forEach((chapter,slot)=>this.addChapterCard(layer,chapter,slot,chapters.length));
    this.addCarouselControls(layer,CHAPTER_MENU_CARDS.length);
  }

  private addChapterCard(layer:Phaser.GameObjects.Container,chapter:ChapterMenuCard,slot:number,count:number):void{
    const x=this.carouselCardX(slot,count),y=532,w=356,h=402,upcoming=!chapter.exists;
    const accent=chapter.index===0?0x8fce72:chapter.index===1?0x72a8d8:0x5b5265;
    const fill=upcoming?0x121019:chapter.index===0?0x142019:0x141a22;
    const bg=this.add.rectangle(x,y,w,h,fill,.98).setStrokeStyle(upcoming?1:2,upcoming?0x393140:accent,.74);
    const stripe=this.add.rectangle(x-w/2+5,y,6,h-10,accent,upcoming?.25:.94);
    const number=this.add.text(x+w/2-26,y-h/2+34,String(chapter.index+1).padStart(2,"0"),{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:upcoming?"#5e5668":"#8e9a91"}).setOrigin(1,.5);
    const label=this.add.text(x-w/2+26,y-h/2+34,"CAPÍTULO",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:upcoming?"#5f5868":"#84918a"}).setOrigin(0,.5);
    const title=this.add.text(x-w/2+26,y-h/2+76,chapter.name,{fontFamily:"system-ui, sans-serif",fontSize:"27px",fontStyle:"bold",color:upcoming?"#77707e":"#f0f4ef"}).setOrigin(0,.5);

    const art=this.add.graphics();
    if(chapter.index===0&&!upcoming){
      art.fillStyle(0x8fce72,.13);art.fillRoundedRect(x-w/2+26,y-68,w-52,132,12);
      art.lineStyle(3,0x9bd77d,.72);art.lineBetween(x-w/2+48,y+44,x-10,y-22);art.lineBetween(x-10,y-22,x+w/2-50,y+44);
      art.lineStyle(1,0xc8f0ae,.24);art.lineBetween(x-w/2+48,y+15,x+w/2-50,y+15);
      art.fillStyle(0xc8f0ae,.88);art.fillCircle(x-82,y+11,10);art.fillStyle(0x080b09,.96);art.fillCircle(x+94,y+17,17);
    }else if(chapter.index===1&&!upcoming){
      art.fillStyle(0x72a8d8,.11);art.fillRoundedRect(x-w/2+26,y-68,w-52,132,12);
      art.fillStyle(0x72a8d8,.3);art.fillRect(x-116,y+6,50,40);art.fillRect(x-52,y-18,62,64);art.fillRect(x+24,y-38,48,84);art.fillRect(x+86,y-8,42,54);
      art.lineStyle(2,0xa8ccea,.62);art.lineBetween(x-128,y+46,x+130,y+46);
    }else{
      art.fillStyle(0x766c82,.045);art.fillRoundedRect(x-w/2+26,y-68,w-52,132,12);art.lineStyle(1,0x756b80,.2);
      for(let i=0;i<5;i+=1)art.strokeCircle(x+(i-2)*42,y+6,9+i*2);
    }

    let status="PRÓXIMAMENTE",detail="CAPÍTULO EN DESARROLLO",progressText="CONTENIDO AÚN NO DISPONIBLE";let action:(()=>void)|undefined;
    if(chapter.exists){
      const progress=SaveSystem.campaignChapterProgress(chapter.index*CAMPAIGN_CHAPTER_SIZE);
      const entries=CAMPAIGN_ENTRIES.slice(chapter.index*CAMPAIGN_CHAPTER_SIZE,(chapter.index+1)*CAMPAIGN_CHAPTER_SIZE);
      const completed=entries.filter(entry=>SaveSystem.record(entry.level.id).completed).length;
      const stars=SaveSystem.totalStars(entries.map(entry=>entry.level.id));
      detail="10 NIVELES";progressText=`${completed} / ${entries.length} COMPLETADOS   ·   ★ ${stars} / ${entries.length*3}`;
      if(BETA_TESTING||progress.unlocked){status=BETA_TESTING?"ABIERTO EN BETA":"JUGAR";action=()=>this.openCampaignChapter(chapter.index);}
      else if(progress.eligible&&!progress.claimed){status="RECLAMAR EN PRESTIGIO";action=()=>this.openPrestigeReward(campaignChapterDefinition(chapter.index).claimRewardId??undefined);}
      else status=`★ ${progress.totalStars} / ${progress.requiredStars}`;
    }
    const detailText=this.add.text(x-w/2+26,y+80,detail,{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:upcoming?"#5e5766":"#8d9991",wordWrap:{width:w-52}}).setOrigin(0,.5);
    const progressLabel=this.add.text(x-w/2+26,y+106,progressText,{fontFamily:"system-ui, sans-serif",fontSize:"9px",fontStyle:"bold",color:upcoming?"#4f4858":"#b5c2b8"}).setOrigin(0,.5);
    const progressBg=this.add.rectangle(x,y+130,w-52,4,0x26222c);
    const chapterEntries=chapter.exists?CAMPAIGN_ENTRIES.slice(chapter.index*CAMPAIGN_CHAPTER_SIZE,(chapter.index+1)*CAMPAIGN_CHAPTER_SIZE):[];
    const completedRatio=chapterEntries.length===0?0:chapterEntries.filter(entry=>SaveSystem.record(entry.level.id).completed).length/chapterEntries.length;
    const progressFill=this.add.rectangle(x-(w-52)/2,y+130,(w-52)*completedRatio,4,accent,.9).setOrigin(0,.5);
    const button=this.add.rectangle(x,y+h/2-42,w-52,50,action?0x283024:0x17141d).setStrokeStyle(1,action?accent:0x3a3342);
    const buttonText=this.add.text(x,y+h/2-42,status,{fontFamily:"system-ui, sans-serif",fontSize:"11px",fontStyle:"bold",color:action?"#e6f4dc":"#6f6877"}).setOrigin(.5);
    layer.add([bg,stripe,number,label,title,art,detailText,progressLabel,progressBg,progressFill,button,buttonText]);
    if(action)this.wireLayerPress(layer,button,buttonText,x,y+h/2-42,w-44,56,action,0x283024,chapter.index===0?0x394733:0x263b4d);
  }

  private openCampaignChapter(chapterIndex:number):void{
    ProductTelemetry.track({eventName:"mode_open",scene:"menu",mode:"classic",metadata:{chapter:chapterIndex}});
    this.scene.start("level-select",{mode:"classic",page:chapterIndex});
  }

  private renderCosmeticCards(layer:Phaser.GameObjects.Container):void{
    const save=SaveSystem.cosmetics();
    this.addSectionHeading(layer,"COSMÉTICOS","TU COLECCIÓN",`${save.owned.length} OBJ.`);
    const categories:CosmeticCategory[]=["ball","trail","holeEffect"];
    categories.forEach((category,slot)=>{
      const x=DESIGN_WIDTH/2+(slot-1)*388,y=532,w=356,h=402,items=cosmeticsByCategory(category),owned=items.filter(item=>save.owned.includes(item.id)),equippedId=save.equipped[category],equipped=cosmeticById(equippedId);
      const bg=this.add.rectangle(x,y,w,h,0x15121d,.98).setStrokeStyle(1,0x463754);
      const icon=this.add.graphics();if(equipped)this.drawEquippedCosmetic(icon,equipped,x,y-42);
      const eyebrow=this.add.text(x-w/2+26,y-h/2+34,"COLECCIÓN",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#83778e"}).setOrigin(0,.5);
      const title=this.add.text(x-w/2+26,y-h/2+70,CATEGORY_LABELS[category],{fontFamily:"system-ui",fontSize:"23px",fontStyle:"bold",color:"#f0edf4"}).setOrigin(0,.5);
      const count=this.add.text(x,y+58,`${owned.length} / ${items.length} OBJETOS`,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#9f95a7"}).setOrigin(.5);
      const equippedText=this.add.text(x,y+88,`EQUIPADO · ${equipped?.name??"—"}`,{fontFamily:"system-ui",fontSize:"10px",color:"#c2ef63"}).setOrigin(.5);
      const button=this.add.rectangle(x,y+h/2-42,w-52,50,0x2a2335).setStrokeStyle(1,0xb68cff,.72);
      const buttonText=this.add.text(x,y+h/2-42,"ABRIR COLECCIÓN",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#eee8f3"}).setOrigin(.5);
      layer.add([bg,icon,eyebrow,title,count,equippedText,button,buttonText]);
      this.wireLayerPress(layer,button,buttonText,x,y+h/2-42,w-44,56,()=>this.scene.start("cosmetics",{category}),0x2a2335,0x3a2f49);
    });
  }

  private drawEquippedCosmetic(g:Phaser.GameObjects.Graphics,item:CosmeticDefinition,x:number,y:number):void{
    g.fillStyle(item.primary,.08);g.fillRoundedRect(x-126,y-76,252,152,14);
    g.lineStyle(1,item.secondary??item.primary,.24);g.strokeRoundedRect(x-126,y-76,252,152,14);
    if(item.category==="ball"){drawBall(g,item,x,y,43);return;}
    if(item.category==="trail"){
      for(let i=0;i<8;i+=1){const t=i/7;g.fillStyle(i%2===0?item.primary:(item.secondary??item.primary),.15+t*.7);g.fillCircle(x-86+i*23,y+Math.sin(i*1.4)*9,5+t*8);}g.fillStyle(0xf4f7f8,1);g.fillCircle(x+88,y,27);return;
    }
    g.fillStyle(0x070609,1);g.fillCircle(x,y,34);g.lineStyle(5,item.primary,.9);g.strokeCircle(x,y,47);g.lineStyle(2,item.secondary??item.primary,.48);g.strokeCircle(x,y,62);
  }

  private renderShopCards(layer:Phaser.GameObjects.Container):void{
    this.addSectionHeading(layer,"TIENDA",PRODUCT_FEATURES.shop?"ROTACIÓN ACTUAL":"EN PREPARACIÓN",PRODUCT_FEATURES.shop?"":"PRÓXIMAMENTE");
    if(!PRODUCT_FEATURES.shop){
      const x=DESIGN_WIDTH/2,y=532,w=744,h=402,bg=this.add.rectangle(x,y,w,h,0x131019,.98).setStrokeStyle(1,0x403647);
      const glyph=this.add.text(x,y-70,"◇",{fontFamily:"system-ui",fontSize:"72px",fontStyle:"bold",color:"#4f4658"}).setOrigin(.5);
      const title=this.add.text(x,y+12,"TIENDA",{fontFamily:"system-ui",fontSize:"28px",fontStyle:"bold",color:"#85808a"}).setOrigin(.5);
      const body=this.add.text(x,y+57,"PRÓXIMAMENTE",{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#68616f"}).setOrigin(.5);
      layer.add([bg,glyph,title,body]);return;
    }
    const items=dailyShopIds().map(id=>cosmeticById(id)).filter(item=>item!==undefined).slice(this.carouselOffset,this.carouselOffset+3);
    items.forEach((item,slot)=>{
      const x=this.carouselCardX(slot,items.length),y=532,w=356,h=402,bg=this.add.rectangle(x,y,w,h,0x15121d).setStrokeStyle(1,0x463754);
      const category=this.add.text(x-w/2+26,y-h/2+34,CATEGORY_LABELS[item.category],{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#83778e"}).setOrigin(0,.5);
      const title=this.add.text(x-w/2+26,y-h/2+72,item.name,{fontFamily:"system-ui",fontSize:"24px",fontStyle:"bold",color:"#f0edf4"}).setOrigin(0,.5);
      const description=this.add.text(x-w/2+26,y+15,item.description,{fontFamily:"system-ui",fontSize:"12px",color:"#a49baa",wordWrap:{width:w-52},align:"center"}).setOrigin(0,.5);
      const button=this.add.rectangle(x,y+h/2-42,w-52,50,0x2a2335).setStrokeStyle(1,0xb68cff,.72);
      const buttonText=this.add.text(x,y+h/2-42,`◈ ${item.price??0}`,{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#eee8f3"}).setOrigin(.5);
      layer.add([bg,category,title,description,button,buttonText]);
      this.wireLayerPress(layer,button,buttonText,x,y+h/2-42,w-44,56,()=>this.scene.start("shop"),0x2a2335,0x3a2f49);
    });
    this.addCarouselControls(layer,dailyShopIds().length);
  }

  private renderPrestigeCards(layer:Phaser.GameObjects.Container):void{
    const stars=SaveSystem.totalStars(CAMPAIGN_ENTRIES.map(entry=>entry.level.id));
    this.addSectionHeading(layer,"PRESTIGIO","RECOMPENSAS PERMANENTES",`★ ${stars}`);
    const rewards=PRESTIGE_REWARDS.slice(this.carouselOffset,this.carouselOffset+3);
    rewards.forEach((reward,slot)=>{
      const x=this.carouselCardX(slot,rewards.length),y=532,w=356,h=402,state=SaveSystem.prestigeRewardState(reward.id),ready=state.eligible&&!state.claimed;
      const name=reward.kind==="cosmetic"?(cosmeticById(reward.cosmeticId)?.name??"COSMÉTICO"):campaignChapterDefinition(reward.chapterIndex).name;
      const kind=reward.kind==="cosmetic"?"COSMÉTICO":"NUEVO CAPÍTULO";
      const bg=this.add.rectangle(x,y,w,h,state.claimed?0x152018:ready?0x282317:0x15121d).setStrokeStyle(1,state.claimed?0x587d55:ready?0xd7b85e:0x463754);
      const threshold=this.add.text(x-w/2+26,y-h/2+38,`★ ${reward.stars}`,{fontFamily:"system-ui",fontSize:"23px",fontStyle:"bold",color:state.claimed?"#9dd88b":ready?"#f0cf70":"#776d81"}).setOrigin(0,.5);
      const preview=this.add.graphics(),cosmetic=reward.kind==="cosmetic"?cosmeticById(reward.cosmeticId):undefined,rewardPreviewAlpha=state.claimed||ready?0.75:0.25;
      if(cosmetic)this.drawEquippedCosmetic(preview,cosmetic,x,y-39);else{preview.fillStyle(0xb68cff,.07);preview.fillRoundedRect(x-126,y-115,252,152,14);preview.lineStyle(3,0x72a8d8,rewardPreviewAlpha);preview.strokeCircle(x,y-39,46);preview.lineStyle(1,0xb68cff,.45);preview.strokeCircle(x,y-39,65);}
      const kindText=this.add.text(x,y+53,kind,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#887c92"}).setOrigin(.5);
      const title=this.add.text(x,y+83,name,{fontFamily:"system-ui",fontSize:"22px",fontStyle:"bold",color:state.claimed||ready?"#f1edf4":"#89818f",align:"center",wordWrap:{width:w-54}}).setOrigin(.5);
      const status=state.claimed?"RECLAMADO":ready?"LISTO PARA RECLAMAR":`${Math.min(stars,reward.stars)} / ${reward.stars} ESTRELLAS`;
      const button=this.add.rectangle(x,y+h/2-42,w-52,50,ready?0x3a301c:0x1c1822).setStrokeStyle(1,ready?0xd7b85e:0x403647);
      const buttonText=this.add.text(x,y+h/2-42,status,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:ready?"#f6dda0":state.claimed?"#7f9a78":"#746d7a"}).setOrigin(.5);
      layer.add([bg,threshold,preview,kindText,title,button,buttonText]);
      if(ready)this.wireLayerPress(layer,button,buttonText,x,y+h/2-42,w-44,56,()=>this.claimPrestigeReward(reward.id),0x3a301c,0x504326);
    });
    this.addCarouselControls(layer,PRESTIGE_REWARDS.length);
  }

  private addSectionHeading(layer:Phaser.GameObjects.Container,title:string,subtitle:string,metric:string):void{
    const left=DESIGN_WIDTH/2-VIEW_WIDTH/2;
    const titleText=this.add.text(left+70,300,title,{fontFamily:"system-ui",fontSize:"24px",fontStyle:"bold",color:"#f1edf4"}).setOrigin(0,.5);
    const subtitleText=this.add.text(left+70,329,subtitle,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#81768b"}).setOrigin(0,.5);
    const metricText=this.add.text(DESIGN_WIDTH/2+VIEW_WIDTH/2-70,304,metric,{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#c2ef63"}).setOrigin(1,.5);
    layer.add([titleText,subtitleText,metricText]);
  }

  private addCarouselControls(layer:Phaser.GameObjects.Container,total:number):void{
    const pageCount=Math.max(1,Math.ceil(total/3)),page=Math.floor(this.carouselOffset/3),left=DESIGN_WIDTH/2-VIEW_WIDTH/2,right=DESIGN_WIDTH/2+VIEW_WIDTH/2;
    this.addCarouselArrow(layer,left+74,535,"‹",page>0,()=>this.moveCarousel(-1));
    this.addCarouselArrow(layer,right-74,535,"›",page<pageCount-1,()=>this.moveCarousel(1));
    for(let i=0;i<pageCount;i+=1){const dot=this.add.circle(DESIGN_WIDTH/2+(i-(pageCount-1)/2)*18,775,i===page?4:3,i===page?0xc2ef63:0x51475c,i===page?1:.75);layer.add(dot);}
  }

  private addCarouselArrow(layer:Phaser.GameObjects.Container,x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,52,78,enabled?0x211a2b:0x121018).setStrokeStyle(1,enabled?0x5c486e:0x2d2733);
    const text=this.add.text(x,y-3,label,{fontFamily:"system-ui",fontSize:"33px",fontStyle:"bold",color:enabled?"#ded6e5":"#443d4a"}).setOrigin(.5);
    layer.add([bg,text]);if(enabled)this.wireLayerPress(layer,bg,text,x,y,58,84,action,0x211a2b,0x342541);
  }

  private moveCarousel(delta:number):void{
    const total=this.desktopSection==="campaign"?CHAPTER_MENU_CARDS.length:this.desktopSection==="prestige"?PRESTIGE_REWARDS.length:this.desktopSection==="shop"?dailyShopIds().length:3;
    const pageCount=Math.max(1,Math.ceil(total/3)),page=Math.floor(this.carouselOffset/3),next=Phaser.Math.Clamp(page+delta,0,pageCount-1);if(next===page)return;
    this.carouselOffset=next*3;this.renderDesktopSection(delta);
  }

  private carouselCardX(slot:number,count:number):number{return DESIGN_WIDTH/2+(slot-(count-1)/2)*388;}

  private openPrestigeReward(rewardId:string|undefined):void{
    const rewardIndex=rewardId?PRESTIGE_REWARDS.findIndex(reward=>reward.id===rewardId):0;
    this.desktopSection="prestige";this.carouselOffset=Math.floor(Math.max(0,rewardIndex)/3)*3;this.syncDesktopSectionButtons();this.renderDesktopSection(1);
  }

  private claimPrestigeReward(rewardId:string):void{
    if(!SaveSystem.claimPrestigeReward(rewardId).ok)return;
    this.syncDesktopSectionButtons();this.renderDesktopSection();
  }

  private createDesktopUtilityBar(left:number,right:number):void{
    this.add.rectangle(DESIGN_WIDTH/2,894,VIEW_WIDTH-84,72,0x0c0a11,.94).setStrokeStyle(1,0x3b3148,.76);
    let x=left+82;
    x+=this.utilityLink(x,894,190,"AYUDA Y ASISTENCIA",()=>this.scene.start("assistance"));
    x+=this.utilityLink(x,894,PatchNotes.hasUnread()?224:178,PatchNotes.hasUnread()?"PATCH NOTES · ● NUEVO":"PATCH NOTES",()=>this.scene.start("patch-notes"),PatchNotes.hasUnread());
    if(PRODUCT_FEATURES.communityMaps)x+=this.utilityLink(x,894,210,"COMMUNITY MAPS",()=>{void this.openCommunity();});
    if(BETA_TESTING)this.utilityLink(x,894,196,`BETA LAB · ${BetaFeedbackSystem.count()} FB`,()=>this.scene.start("editor"));
    this.add.text(right-66,894,"RC7 · PC",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#57505f"}).setOrigin(1,.5);
  }

  private utilityLink(x:number,y:number,w:number,label:string,action:()=>void,accent=false):number{
    const cx=x+w/2,bg=this.add.rectangle(cx,y,w-10,38,accent?0x2b202f:0x15121c).setStrokeStyle(1,accent?0x7c546f:0x382f42);
    const text=this.add.text(cx,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:accent?"#e2b7d8":"#92899b"}).setOrigin(.5);
    this.wirePress(bg,text,cx,y,w-4,44,action,accent?0x2b202f:0x15121c,accent?0x3d2a40:0x241b2c);return w;
  }

  private wireLayerPress(layer:Phaser.GameObjects.Container,bg:Phaser.GameObjects.Rectangle,label:Phaser.GameObjects.Text,x:number,y:number,w:number,h:number,action:()=>void,rest:number,hover:number):void{
    const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});layer.add(zone);
    zone.on("pointerover",()=>bg.setFillStyle(hover));
    zone.on("pointerdown",()=>{bg.setFillStyle(hover);bg.setScale(.99);label.setScale(.99);});
    zone.on("pointerout",()=>{bg.setFillStyle(rest);bg.setScale(1);label.setScale(1);});
    zone.on("pointerup",()=>{bg.setFillStyle(rest);bg.setScale(1);label.setScale(1);action();});
  }

  private createMobileMenu():void{
    this.drawTrollIdentity();
    this.add.text(28,35,"HOLE IN WHAT?",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(24,2),fontStyle:"bold",color:"#f1f4ef"}).setOrigin(0,.5);
    this.add.rectangle(30,58,54,3,0xc2ef63,.92).setOrigin(0,.5);
    const wallet=SaveSystem.wallet();
    this.add.text(510,35,`◈ ${wallet.coins}   ◆ ${wallet.gems}`,{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:"#b9c4cc"}).setOrigin(1,.5);
    const online=this.add.text(30,78,"● — ONLINE",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(9,1),fontStyle:"bold",color:"#78bfa0"}).setOrigin(0,.5);
    const stopOnline=LiveOps.onOnline(count=>online.setText(`● ${count==null?"—":count} ONLINE`));this.events.once("shutdown",stopOnline);
    this.languageSelectorMobile();
    const alias=BetaTelemetry.alias();
    const identityBg=this.add.rectangle(270,115,300,38,alias?0x181420:0x211b18).setStrokeStyle(1,alias?0x49365d:0x65562f);
    const identity=this.add.text(DESIGN_WIDTH/2,115,alias?`JUGADOR · ${alias}   ✎`:"ELIGE TU NOMBRE   ✎",{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(10,2),fontStyle:"bold",color:alias?"#d3cedb":"#e7c477"}).setOrigin(.5);
    this.wirePress(identityBg,identity,270,115,310,46,()=>this.scene.start("player-profile"),alias?0x181420:0x211b18,alias?0x241d30:0x302718);

    this.add.rectangle(270,478,510,662,0x09080e,.78).setStrokeStyle(1,0x49375d,.55);
    this.renderMobileSection();
    this.createMobileUtilityBar();
    this.createMobileSectionNav();
  }

  private languageSelectorMobile():void{
    const current=I18n.language(),select=(next:GameLanguage):void=>{if(next===I18n.language())return;I18n.set(next);this.scene.restart();};
    const left=this.add.rectangle(456,78,38,28,current==="es"?0x35422e:0x14111c).setStrokeStyle(1,current==="es"?0x91b56f:0x40364d).setInteractive({useHandCursor:true});
    const right=this.add.rectangle(498,78,38,28,current==="en"?0x35422e:0x14111c).setStrokeStyle(1,current==="en"?0x91b56f:0x40364d).setInteractive({useHandCursor:true});
    const es=this.add.text(456,78,"ES",{fontFamily:"system-ui",fontSize:uiFontSize(8,1),fontStyle:"bold",color:current==="es"?"#eef7e8":"#756d82"}).setOrigin(.5).setInteractive({useHandCursor:true});
    const en=this.add.text(498,78,"EN",{fontFamily:"system-ui",fontSize:uiFontSize(8,1),fontStyle:"bold",color:current==="en"?"#eef7e8":"#756d82"}).setOrigin(.5).setInteractive({useHandCursor:true});
    left.on("pointerup",()=>select("es"));es.on("pointerup",()=>select("es"));right.on("pointerup",()=>select("en"));en.on("pointerup",()=>select("en"));
  }

  private drawTrollIdentity():void{
    this.cameras.main.setBackgroundColor("#0e0c17");const g=this.add.graphics();g.fillStyle(0x6e4b92,.1);g.fillCircle(520,80,190);g.fillStyle(0xc2ef63,.055);g.fillCircle(5,870,180);g.lineStyle(1,0xb68cff,.06);for(let y=160;y<820;y+=82)g.lineBetween(18,y,522,y);
  }

  private renderMobileSection(direction=0):void{
    const old=this.sectionLayer;
    const build=():void=>{
      const layer=this.add.container(direction===0?0:direction*34,0).setAlpha(direction===0?1:0);
      this.sectionLayer=layer;
      if(this.desktopSection==="campaign")this.renderMobileCampaign(layer);
      else if(this.desktopSection==="cosmetics")this.renderMobileCosmetics(layer);
      else if(this.desktopSection==="shop")this.renderMobileShop(layer);
      else this.renderMobilePrestige(layer);
      if(direction!==0)this.tweens.add({targets:layer,x:0,alpha:1,duration:170,ease:"Cubic.easeOut"});
    };
    if(!old){build();return;}
    this.tweens.add({targets:old,x:-direction*34,alpha:0,duration:105,ease:"Cubic.easeIn",onComplete:()=>{old.destroy(true);build();}});
  }

  private renderMobileCampaign(layer:Phaser.GameObjects.Container):void{
    this.addMobileHeading(layer,"CAMPAÑA","ELIGE CAPÍTULO",`★ ${SaveSystem.totalStars(CAMPAIGN_ENTRIES.map(entry=>entry.level.id))}`);
    const chapter=CHAPTER_MENU_CARDS[this.carouselOffset]??CHAPTER_MENU_CARDS[0]!;
    this.addMobileChapterCard(layer,chapter);
    this.addMobileCarouselControls(layer,CHAPTER_MENU_CARDS.length);
  }

  private addMobileChapterCard(layer:Phaser.GameObjects.Container,chapter:ChapterMenuCard):void{
    const x=270,y=493,w=430,h=518,upcoming=!chapter.exists,accent=chapter.index===0?0x8fce72:chapter.index===1?0x72a8d8:0x5b5265,fill=upcoming?0x121019:chapter.index===0?0x142019:0x141a22;
    const bg=this.add.rectangle(x,y,w,h,fill,.98).setStrokeStyle(upcoming?1:2,upcoming?0x393140:accent,.78);
    const stripe=this.add.rectangle(x-w/2+5,y,7,h-10,accent,upcoming?.25:.95);
    const label=this.add.text(82,261,"CAPÍTULO",{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:upcoming?"#5f5868":"#84918a"}).setOrigin(0,.5);
    const number=this.add.text(456,261,String(chapter.index+1).padStart(2,"0"),{fontFamily:"system-ui",fontSize:uiFontSize(11,1),fontStyle:"bold",color:upcoming?"#5e5668":"#8e9a91"}).setOrigin(1,.5);
    const title=this.add.text(82,305,chapter.name,{fontFamily:"system-ui",fontSize:uiFontSize(29,2),fontStyle:"bold",color:upcoming?"#77707e":"#f0f4ef"}).setOrigin(0,.5);
    const art=this.add.graphics();this.drawMobileChapterArt(art,chapter,x,420,w,accent,upcoming);

    let status="PRÓXIMAMENTE",detail="CAPÍTULO EN DESARROLLO",progressText="CONTENIDO AÚN NO DISPONIBLE";let action:(()=>void)|undefined,ratio=0;
    if(chapter.exists){
      const progress=SaveSystem.campaignChapterProgress(chapter.index*CAMPAIGN_CHAPTER_SIZE),entries=CAMPAIGN_ENTRIES.slice(chapter.index*CAMPAIGN_CHAPTER_SIZE,(chapter.index+1)*CAMPAIGN_CHAPTER_SIZE),completed=entries.filter(entry=>SaveSystem.record(entry.level.id).completed).length,stars=SaveSystem.totalStars(entries.map(entry=>entry.level.id));
      detail="10 NIVELES";progressText=`${completed} / ${entries.length} COMPLETADOS   ·   ★ ${stars} / ${entries.length*3}`;ratio=entries.length===0?0:completed/entries.length;
      if(BETA_TESTING||progress.unlocked){status=BETA_TESTING?"ABIERTO EN BETA":"JUGAR";action=()=>this.openCampaignChapter(chapter.index);}
      else if(progress.eligible&&!progress.claimed){status="RECLAMAR EN PRESTIGIO";action=()=>this.openMobilePrestigeReward(campaignChapterDefinition(chapter.index).claimRewardId??undefined);}
      else status=`★ ${progress.totalStars} / ${progress.requiredStars}`;
    }
    const detailText=this.add.text(82,549,detail,{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:upcoming?"#5e5766":"#8d9991"}).setOrigin(0,.5);
    const progressLabel=this.add.text(82,578,progressText,{fontFamily:"system-ui",fontSize:uiFontSize(9,1),fontStyle:"bold",color:upcoming?"#4f4858":"#b5c2b8"}).setOrigin(0,.5);
    const progressBg=this.add.rectangle(270,606,376,5,0x26222c),progressFill=this.add.rectangle(82,606,376*ratio,5,accent,.9).setOrigin(0,.5);
    const button=this.add.rectangle(270,704,376,58,action?0x283024:0x17141d).setStrokeStyle(1,action?accent:0x3a3342),buttonText=this.add.text(270,704,status,{fontFamily:"system-ui",fontSize:uiFontSize(12,1),fontStyle:"bold",color:action?"#e6f4dc":"#6f6877"}).setOrigin(.5);
    layer.add([bg,stripe,label,number,title,art,detailText,progressLabel,progressBg,progressFill,button,buttonText]);
    if(action)this.wireLayerPress(layer,button,buttonText,270,704,386,66,action,0x283024,chapter.index===0?0x394733:0x263b4d);
  }

  private drawMobileChapterArt(g:Phaser.GameObjects.Graphics,chapter:ChapterMenuCard,x:number,y:number,w:number,accent:number,upcoming:boolean):void{
    g.fillStyle(accent,upcoming?.045:.12);g.fillRoundedRect(x-w/2+27,y-75,w-54,150,14);
    if(chapter.index===0&&!upcoming){g.lineStyle(4,0x9bd77d,.72);g.lineBetween(92,y+48,250,y-31);g.lineBetween(250,y-31,445,y+48);g.lineStyle(1,0xc8f0ae,.25);g.lineBetween(92,y+17,445,y+17);g.fillStyle(0xc8f0ae,.9);g.fillCircle(151,y+11,12);g.fillStyle(0x080b09,1);g.fillCircle(403,y+17,20);}
    else if(chapter.index===1&&!upcoming){g.fillStyle(0x72a8d8,.3);g.fillRect(100,y+3,62,50);g.fillRect(177,y-24,76,77);g.fillRect(270,y-51,60,104);g.fillRect(346,y-8,54,61);g.lineStyle(2,0xa8ccea,.62);g.lineBetween(88,y+54,452,y+54);}
    else{g.lineStyle(1,0x756b80,.22);for(let i=0;i<6;i+=1)g.strokeCircle(x+(i-2.5)*55,y+5,10+i*2);}
  }

  private renderMobileCosmetics(layer:Phaser.GameObjects.Container):void{
    const save=SaveSystem.cosmetics(),categories:CosmeticCategory[]=["ball","trail","holeEffect"],category=categories[this.carouselOffset]??categories[0]!,items=cosmeticsByCategory(category),owned=items.filter(item=>save.owned.includes(item.id)),equipped=cosmeticById(save.equipped[category]);
    this.addMobileHeading(layer,"COSMÉTICOS","TU COLECCIÓN",`${save.owned.length} OBJ.`);
    const bg=this.add.rectangle(270,493,430,518,0x15121d,.98).setStrokeStyle(2,0x76558f,.72),eyebrow=this.add.text(82,261,"COLECCIÓN",{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:"#83778e"}).setOrigin(0,.5),title=this.add.text(82,305,CATEGORY_LABELS[category],{fontFamily:"system-ui",fontSize:uiFontSize(27,2),fontStyle:"bold",color:"#f0edf4"}).setOrigin(0,.5),preview=this.add.graphics();
    if(equipped)this.drawMobileCosmeticPreview(preview,equipped,270,435);
    const count=this.add.text(270,565,`${owned.length} / ${items.length} OBJETOS`,{fontFamily:"system-ui",fontSize:uiFontSize(11,1),fontStyle:"bold",color:"#9f95a7"}).setOrigin(.5),equippedText=this.add.text(270,598,`EQUIPADO · ${equipped?.name??"—"}`,{fontFamily:"system-ui",fontSize:uiFontSize(10,1),color:"#c2ef63"}).setOrigin(.5),button=this.add.rectangle(270,704,376,58,0x2a2335).setStrokeStyle(1,0xb68cff,.72),buttonText=this.add.text(270,704,"ABRIR COLECCIÓN",{fontFamily:"system-ui",fontSize:uiFontSize(12,1),fontStyle:"bold",color:"#eee8f3"}).setOrigin(.5);
    layer.add([bg,eyebrow,title,preview,count,equippedText,button,buttonText]);this.wireLayerPress(layer,button,buttonText,270,704,386,66,()=>this.scene.start("cosmetics",{category}),0x2a2335,0x3a2f49);this.addMobileCarouselControls(layer,categories.length);
  }

  private drawMobileCosmeticPreview(g:Phaser.GameObjects.Graphics,item:CosmeticDefinition,x:number,y:number):void{
    g.fillStyle(item.primary,.08);g.fillRoundedRect(x-168,y-92,336,184,16);g.lineStyle(1,item.secondary??item.primary,.3);g.strokeRoundedRect(x-168,y-92,336,184,16);
    if(item.category==="ball"){drawBall(g,item,x,y,55);return;}
    if(item.category==="trail"){for(let i=0;i<9;i+=1){const t=i/8;g.fillStyle(i%2===0?item.primary:(item.secondary??item.primary),.15+t*.72);g.fillCircle(x-125+i*29,y+Math.sin(i*1.4)*10,6+t*9);}g.fillStyle(0xf4f7f8,1);g.fillCircle(x+132,y,34);return;}
    g.fillStyle(0x070609,1);g.fillCircle(x,y,44);g.lineStyle(6,item.primary,.9);g.strokeCircle(x,y,60);g.lineStyle(3,item.secondary??item.primary,.5);g.strokeCircle(x,y,78);
  }

  private renderMobileShop(layer:Phaser.GameObjects.Container):void{
    this.addMobileHeading(layer,"TIENDA",PRODUCT_FEATURES.shop?"ROTACIÓN ACTUAL":"EN PREPARACIÓN",PRODUCT_FEATURES.shop?"":"PRÓXIMAMENTE");
    if(!PRODUCT_FEATURES.shop){const bg=this.add.rectangle(270,493,430,518,0x131019,.98).setStrokeStyle(1,0x403647),glyph=this.add.text(270,421,"◇",{fontFamily:"system-ui",fontSize:uiFontSize(92,2),fontStyle:"bold",color:"#4f4658"}).setOrigin(.5),title=this.add.text(270,520,"TIENDA",{fontFamily:"system-ui",fontSize:uiFontSize(29,2),fontStyle:"bold",color:"#85808a"}).setOrigin(.5),body=this.add.text(270,562,"PRÓXIMAMENTE",{fontFamily:"system-ui",fontSize:uiFontSize(12,1),fontStyle:"bold",color:"#68616f"}).setOrigin(.5);layer.add([bg,glyph,title,body]);return;}
    const items=dailyShopIds().map(id=>cosmeticById(id)).filter(item=>item!==undefined),item=items[this.carouselOffset]??items[0];if(!item)return;
    const bg=this.add.rectangle(270,493,430,518,0x15121d).setStrokeStyle(2,0x76558f,.72),category=this.add.text(82,261,CATEGORY_LABELS[item.category],{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:"#83778e"}).setOrigin(0,.5),title=this.add.text(82,305,item.name,{fontFamily:"system-ui",fontSize:uiFontSize(27,2),fontStyle:"bold",color:"#f0edf4"}).setOrigin(0,.5),preview=this.add.graphics();this.drawMobileCosmeticPreview(preview,item,270,435);
    const description=this.add.text(270,570,item.description,{fontFamily:"system-ui",fontSize:uiFontSize(11,1),color:"#a49baa",wordWrap:{width:350},align:"center"}).setOrigin(.5),button=this.add.rectangle(270,704,376,58,0x2a2335).setStrokeStyle(1,0xb68cff,.72),buttonText=this.add.text(270,704,`◈ ${item.price??0}`,{fontFamily:"system-ui",fontSize:uiFontSize(12,1),fontStyle:"bold",color:"#eee8f3"}).setOrigin(.5);layer.add([bg,category,title,preview,description,button,buttonText]);this.wireLayerPress(layer,button,buttonText,270,704,386,66,()=>this.scene.start("shop"),0x2a2335,0x3a2f49);this.addMobileCarouselControls(layer,items.length);
  }

  private renderMobilePrestige(layer:Phaser.GameObjects.Container):void{
    const stars=SaveSystem.totalStars(CAMPAIGN_ENTRIES.map(entry=>entry.level.id)),reward=PRESTIGE_REWARDS[this.carouselOffset]??PRESTIGE_REWARDS[0]!;this.addMobileHeading(layer,"PRESTIGIO","RECOMPENSAS PERMANENTES",`★ ${stars}`);
    const state=SaveSystem.prestigeRewardState(reward.id),ready=state.eligible&&!state.claimed,name=reward.kind==="cosmetic"?(cosmeticById(reward.cosmeticId)?.name??"COSMÉTICO"):campaignChapterDefinition(reward.chapterIndex).name,kind=reward.kind==="cosmetic"?"COSMÉTICO":"NUEVO CAPÍTULO",bg=this.add.rectangle(270,493,430,518,state.claimed?0x152018:ready?0x282317:0x15121d).setStrokeStyle(2,state.claimed?0x587d55:ready?0xd7b85e:0x463754),threshold=this.add.text(82,271,`★ ${reward.stars}`,{fontFamily:"system-ui",fontSize:uiFontSize(24,2),fontStyle:"bold",color:state.claimed?"#9dd88b":ready?"#f0cf70":"#776d81"}).setOrigin(0,.5),preview=this.add.graphics(),cosmetic=reward.kind==="cosmetic"?cosmeticById(reward.cosmeticId):undefined;
    if(cosmetic)this.drawMobileCosmeticPreview(preview,cosmetic,270,435);else{preview.fillStyle(0xb68cff,.07);preview.fillRoundedRect(102,343,336,184,16);preview.lineStyle(4,0x72a8d8,state.claimed||ready?.75:.25);preview.strokeCircle(270,435,58);preview.lineStyle(2,0xb68cff,.42);preview.strokeCircle(270,435,79);}
    const kindText=this.add.text(270,557,kind,{fontFamily:"system-ui",fontSize:uiFontSize(10,1),fontStyle:"bold",color:"#887c92"}).setOrigin(.5),title=this.add.text(270,592,name,{fontFamily:"system-ui",fontSize:uiFontSize(24,2),fontStyle:"bold",color:state.claimed||ready?"#f1edf4":"#89818f",align:"center",wordWrap:{width:360}}).setOrigin(.5),status=state.claimed?"RECLAMADO":ready?"RECLAMAR":`${Math.min(stars,reward.stars)} / ${reward.stars} ESTRELLAS`,button=this.add.rectangle(270,704,376,58,ready?0x3a301c:0x1c1822).setStrokeStyle(1,ready?0xd7b85e:0x403647),buttonText=this.add.text(270,704,status,{fontFamily:"system-ui",fontSize:uiFontSize(12,1),fontStyle:"bold",color:ready?"#f6dda0":state.claimed?"#7f9a78":"#746d7a"}).setOrigin(.5);
    layer.add([bg,threshold,preview,kindText,title,button,buttonText]);if(ready)this.wireLayerPress(layer,button,buttonText,270,704,386,66,()=>this.claimMobilePrestigeReward(reward.id),0x3a301c,0x504326);this.addMobileCarouselControls(layer,PRESTIGE_REWARDS.length);
  }

  private addMobileHeading(layer:Phaser.GameObjects.Container,title:string,subtitle:string,metric:string):void{
    const titleText=this.add.text(30,174,title,{fontFamily:"system-ui",fontSize:uiFontSize(22,2),fontStyle:"bold",color:"#f1edf4"}).setOrigin(0,.5),subtitleText=this.add.text(30,202,subtitle,{fontFamily:"system-ui",fontSize:uiFontSize(9,1),fontStyle:"bold",color:"#81768b"}).setOrigin(0,.5),metricText=this.add.text(510,177,metric,{fontFamily:"system-ui",fontSize:uiFontSize(11,1),fontStyle:"bold",color:"#c2ef63"}).setOrigin(1,.5);layer.add([titleText,subtitleText,metricText]);
  }

  private addMobileCarouselControls(layer:Phaser.GameObjects.Container,total:number):void{
    if(total<=1)return;const enabledLeft=this.carouselOffset>0,enabledRight=this.carouselOffset<total-1;
    this.addMobileArrow(layer,31,493,"‹",enabledLeft,()=>this.moveMobileCarousel(-1));this.addMobileArrow(layer,509,493,"›",enabledRight,()=>this.moveMobileCarousel(1));
    for(let i=0;i<total;i+=1){const dot=this.add.circle(270+(i-(total-1)/2)*17,778,i===this.carouselOffset?4:3,i===this.carouselOffset?0xc2ef63:0x51475c,i===this.carouselOffset?1:.72);layer.add(dot);}
    let startX=0;const swipe=this.add.zone(270,456,390,330).setInteractive();swipe.on("pointerdown",(pointer:Phaser.Input.Pointer)=>{startX=pointer.x;});swipe.on("pointerup",(pointer:Phaser.Input.Pointer)=>{const delta=pointer.x-startX;if(Math.abs(delta)>48)this.moveMobileCarousel(delta<0?1:-1);});layer.add(swipe);
  }

  private addMobileArrow(layer:Phaser.GameObjects.Container,x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,32,80,enabled?0x211a2b:0x111017,.96).setStrokeStyle(1,enabled?0x5c486e:0x29242f),text=this.add.text(x,y-3,label,{fontFamily:"system-ui",fontSize:uiFontSize(29,1),fontStyle:"bold",color:enabled?"#ded6e5":"#3f3945"}).setOrigin(.5);layer.add([bg,text]);if(enabled)this.wireLayerPress(layer,bg,text,x,y,38,88,action,0x211a2b,0x342541);
  }

  private moveMobileCarousel(delta:number):void{
    const total=this.mobileCarouselTotal(),next=Phaser.Math.Clamp(this.carouselOffset+delta,0,Math.max(0,total-1));if(next===this.carouselOffset)return;this.carouselOffset=next;this.renderMobileSection(delta);
  }

  private mobileCarouselTotal():number{
    if(this.desktopSection==="campaign")return CHAPTER_MENU_CARDS.length;if(this.desktopSection==="cosmetics")return 3;if(this.desktopSection==="prestige")return PRESTIGE_REWARDS.length;if(this.desktopSection==="shop"&&PRODUCT_FEATURES.shop)return dailyShopIds().length;return 1;
  }

  private createMobileSectionNav():void{
    this.add.rectangle(270,907,524,88,0x0a080f,.98).setStrokeStyle(1,0x49375d,.6);const icons=["●","✦","◇","★"];
    DESKTOP_SECTIONS.forEach((section,index)=>{const x=67.5+index*135,active=section.id===this.desktopSection,bg=this.add.rectangle(x,907,128,74,active?0x2a2335:0x121018).setStrokeStyle(active?2:1,active?0xb68cff:0x312939),icon=this.add.text(x,886,icons[index]!,{fontFamily:"system-ui",fontSize:uiFontSize(17,1),fontStyle:"bold",color:active?"#c2ef63":"#655b70"}).setOrigin(.5),label=this.add.text(x,918,section.label,{fontFamily:"system-ui",fontSize:uiFontSize(8,1),fontStyle:"bold",color:active?"#f2edf5":"#8a8192"}).setOrigin(.5),zone=this.add.zone(x,907,130,78).setInteractive({useHandCursor:true});zone.on("pointerdown",()=>bg.setScale(.98));zone.on("pointerup",()=>{bg.setScale(1);this.selectMobileSection(section.id);});zone.on("pointerout",()=>bg.setScale(1));this.mobileSectionButtons.set(section.id,{bg,icon,label});});
  }

  private selectMobileSection(section:DesktopSection):void{
    if(section===this.desktopSection)return;const previous=DESKTOP_SECTIONS.findIndex(item=>item.id===this.desktopSection),next=DESKTOP_SECTIONS.findIndex(item=>item.id===section);this.desktopSection=section;this.carouselOffset=0;this.syncMobileSectionNav();this.renderMobileSection(next>previous?1:-1);
  }

  private syncMobileSectionNav():void{
    for(const section of DESKTOP_SECTIONS){const button=this.mobileSectionButtons.get(section.id);if(!button)continue;const active=section.id===this.desktopSection;button.bg.setFillStyle(active?0x2a2335:0x121018).setStrokeStyle(active?2:1,active?0xb68cff:0x312939);button.icon.setColor(active?"#c2ef63":"#655b70");button.label.setColor(active?"#f2edf5":"#8a8192");}
  }

  private createMobileUtilityBar():void{
    const links:{label:string;action:()=>void;accent?:boolean}[]=[{label:"AYUDA",action:()=>this.scene.start("assistance")},{label:PatchNotes.hasUnread()?"NOTAS · ●":"NOTAS",action:()=>this.scene.start("patch-notes"),accent:PatchNotes.hasUnread()}];if(PRODUCT_FEATURES.communityMaps)links.push({label:"MAPAS",action:()=>{void this.openCommunity();}});if(BETA_TESTING)links.push({label:`BETA · ${BetaFeedbackSystem.count()} FB`,action:()=>this.scene.start("editor")});
    const gap=6,w=(500-gap*(links.length-1))/links.length;links.forEach((link,index)=>{const x=20+w/2+index*(w+gap),rest=link.accent?0x2b202f:0x15121c,hover=link.accent?0x3d2a40:0x241b2c,bg=this.add.rectangle(x,827,w,38,rest).setStrokeStyle(1,link.accent?0x7c546f:0x382f42),label=this.add.text(x,827,link.label,{fontFamily:"system-ui",fontSize:uiFontSize(8,1),fontStyle:"bold",color:link.accent?"#e2b7d8":"#92899b"}).setOrigin(.5);this.wirePress(bg,label,x,827,w,44,link.action,rest,hover);});
  }

  private openMobilePrestigeReward(rewardId:string|undefined):void{const index=rewardId?PRESTIGE_REWARDS.findIndex(reward=>reward.id===rewardId):0;this.desktopSection="prestige";this.carouselOffset=Math.max(0,index);this.syncMobileSectionNav();this.renderMobileSection(1);}
  private claimMobilePrestigeReward(rewardId:string):void{if(!SaveSystem.claimPrestigeReward(rewardId).ok)return;this.renderMobileSection();}

  private async openCommunity():Promise<void>{await BetaTelemetry.ensureTester(false);this.scene.start("community-maps");}

  private wirePress(bg:Phaser.GameObjects.Rectangle,labels:Phaser.GameObjects.Text|Phaser.GameObjects.Text[],x:number,y:number,w:number,h:number,action:()=>void,rest:number,hover:number):void{
    const items=Array.isArray(labels)?labels:[labels],zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true}),scale=(value:number):void=>{bg.setScale(value);for(const item of items)item.setScale(value);};
    zone.on("pointerover",()=>bg.setFillStyle(hover));zone.on("pointerdown",()=>{bg.setFillStyle(hover);scale(.985);});zone.on("pointerout",()=>{bg.setFillStyle(rest);scale(1);});zone.on("pointerup",()=>{bg.setFillStyle(rest);scale(1);action();});
  }
}
