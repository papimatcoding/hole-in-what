import Phaser from "phaser";
import "./styles.css";
import { DESIGN_HEIGHT, DESIGN_WIDTH, RENDER_SCALE } from "./config/display";
import { MenuScene } from "./scenes/MenuScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameplayScene } from "./scenes/GameplayScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { CosmeticsScene } from "./scenes/CosmeticsScene";
import { ShopScene } from "./scenes/ShopScene";
import { RewardsScene } from "./scenes/RewardsScene";
import { EditorScene } from "./scenes/EditorScene";
import { LevelPreviewScene } from "./scenes/LevelPreviewScene";

const renderWidth=Math.round(DESIGN_WIDTH*RENDER_SCALE);
const renderHeight=Math.round(DESIGN_HEIGHT*RENDER_SCALE);

const config:Phaser.Types.Core.GameConfig={
  type:Phaser.AUTO,
  parent:"game",
  width:renderWidth,
  height:renderHeight,
  backgroundColor:"#0d1117",
  scene:[MenuScene,LevelSelectScene,GameplayScene,ResultsScene,CosmeticsScene,ShopScene,RewardsScene,EditorScene,LevelPreviewScene],
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:renderWidth,height:renderHeight},
  render:{antialias:true,roundPixels:false}
};

new Phaser.Game(config);
