import Phaser from "phaser";
import "./styles.css";
import { MenuScene } from "./scenes/MenuScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { CosmeticsScene } from "./scenes/CosmeticsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 540,
  height: 960,
  backgroundColor: "#0d1117",
  scene: [MenuScene, LevelSelectScene, GameScene, ResultsScene, CosmeticsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 540,
    height: 960
  },
  render: {
    antialias: true,
    roundPixels: false
  }
};

new Phaser.Game(config);
