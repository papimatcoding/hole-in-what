import Phaser from "phaser";
import "./styles.css";
import { DESIGN_HEIGHT, DESIGN_WIDTH, RENDER_SCALE } from "./config/display";
import { BootScene } from "./scenes/BootScene";
import { MaintenanceScene } from "./scenes/MaintenanceScene";
import { UpdateRequiredScene } from "./scenes/UpdateRequiredScene";
import { MenuScene } from "./scenes/MenuScene";
import { PatchNotesScene } from "./scenes/PatchNotesScene";
import { GlobalSurveyScene } from "./scenes/GlobalSurveyScene";
import { PlayerProfileScene } from "./scenes/PlayerProfileScene";
import { AssistanceScene } from "./scenes/AssistanceScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameplayScene } from "./scenes/GameplayScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { CosmeticsScene } from "./scenes/CosmeticsScene";
import { ShopScene } from "./scenes/ShopScene";
import { RewardsScene } from "./scenes/RewardsScene";
import { EditorScene } from "./scenes/EditorScene";
import { LevelPreviewScene } from "./scenes/LevelPreviewScene";
import { CommunityMapsScene } from "./scenes/CommunityMapsScene";
import { CommunityPublishScene } from "./scenes/CommunityPublishScene";
import { CommunityPlayScene } from "./scenes/CommunityPlayScene";
import { I18n } from "./systems/I18nSystem";
import { LiveOps } from "./systems/LiveOpsSystem";

I18n.install();

const renderWidth=Math.round(DESIGN_WIDTH*RENDER_SCALE);
const renderHeight=Math.round(DESIGN_HEIGHT*RENDER_SCALE);

const config:Phaser.Types.Core.GameConfig={
  type:Phaser.AUTO,
  parent:"game",
  width:renderWidth,
  height:renderHeight,
  backgroundColor:"#0d1117",
  scene:[BootScene,MaintenanceScene,UpdateRequiredScene,MenuScene,PatchNotesScene,GlobalSurveyScene,PlayerProfileScene,AssistanceScene,LevelSelectScene,GameplayScene,ResultsScene,CosmeticsScene,ShopScene,RewardsScene,EditorScene,LevelPreviewScene,CommunityMapsScene,CommunityPublishScene,CommunityPlayScene],
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:renderWidth,height:renderHeight},
  render:{antialias:true,roundPixels:false},
  dom:{createContainer:true}
};

const game=new Phaser.Game(config);
game.events.once(Phaser.Core.Events.READY,()=>LiveOps.start(game));
