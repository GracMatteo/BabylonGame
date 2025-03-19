import {
  AxesViewer,
  KeyboardEventTypes,
  Scene,
  Color4,
  MeshBuilder,
  Vector3,
  FreeCamera,
  StandardMaterial,
  HemisphericLight,
  Color3,
  AmmoJSPlugin,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { Inspector } from "@babylonjs/inspector";

import Ammo from "ammo.js";

import Player from "./Player.js";
import { GlobalManager } from "./GlobalManager.js";

// Ajout d'une variable pour stocker l'état du debug mode
let DEBUG_MODE = true;

// Modification de la fonction DEBUG_MODE pour la transformer en méthode de la classe Game

export default class Game {
  /** Instance du moteur de jeu */
  engine;
  /** Element canvas pour le rendu */
  canvas;
  /** Scene principale */
  scene;

  /** Camera pour voir la scène */
  camera;
  /** Source de lumière principale */
  light;
  /** Axes d'aide pour le debug */
  axesWorld;

  /** Chronomètre qui suit la durée du jeu */
  startTimer;

  /** Instance du joueur */
  player;

  /** Map des états des touches */
  inputMap = {};
  /** Map des actions déclenchées */
  actions = {};

  /**
   * Crée une nouvelle instance de Game
   * @param {Engine} engine - L'instance du moteur Babylon.js
   * @param {HTMLCanvasElement} canvas - L'élément canvas pour le rendu
   */
  constructor(engine, canvas) {
    GlobalManager.engine = engine;
    GlobalManager.canvas = canvas;
  }

  /**
   * Initialise le jeu
   * Affiche l'UI de chargement, crée la scène et le joueur, configure le clavier
   */
  async init() {
    GlobalManager.engine.displayLoadingUI();

    await this.createScene();
    this.initKeyboard();
    this.player = new Player();
    await this.player.init();
    GlobalManager.engine.hideLoadingUI();
  }

  /**
   * Démarre le jeu
   * Initialise le jeu, affiche l'inspecteur en mode debug et lance la boucle de rendu
   */
  async start() {
    await this.init();

    this.startTimer = 0;

    GlobalManager.engine.runRenderLoop(() => {
      GlobalManager.update();
      //console.log("delta time : "+DELTA_TIME )
      this.update();

      this.actions = {};
      GlobalManager.scene.render();
    });
  }

  update() {
    //met à jour les entités du jeu
    //console.log("inputMap in Update of Game :"+this.inputMap)

    //met à jour le joueur avec les inputs et les actions
    this.player.update(this.inputMap, this.actions);
    //incrémente le timer de démarrage
    this.startTimer += GlobalManager.deltaTime;

    console.log("DEBUG_MODE : " + DEBUG_MODE);
  }

  async createScene() {
    //crée une nouvelle scène
    GlobalManager.scene = new Scene(GlobalManager.engine);
    //définit la couleur de fond de la scène
    GlobalManager.scene.clearColor = new Color4(0, 0, 0, 0);
    
    // Activer les collisions pour la scène
    GlobalManager.scene.collisionsEnabled = true;
    //GlobalManager.scene.enablePhysics(new Vector3(0, -10, 0), new AmmoJSPlugin(true, Ammo));

    //TODO: implémenter un gestionnaire de caméra

    //GlobalManager.camera = new FreeCamera("camera", new Vector3(0, 5, -10), GlobalManager.scene);
    //GlobalManager.camera.attachControl(GlobalManager.canvas, true);

    //crée une lumière hémisphérique
    this.light = new HemisphericLight(
      "light",
      new Vector3(0, 0.8, 0),
      GlobalManager.scene
    );

    //crée le sol
    var ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, GlobalManager.scene);
    var groundMaterial = new StandardMaterial("groundMaterial");
    groundMaterial.diffuseColor = new Color3(0, 0, 1);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    // Créer des obstacles
    this.createObstacles();

    //ajoute des éléments de debug si le mode debug est activé
    if (DEBUG_MODE) {
      this.axesWorld = new AxesViewer(GlobalManager.scene, 4);
      var groundMaterial = new GridMaterial("groundMaterial");
      groundMaterial.diffuseColor = new Color3(0, 0, 1);
      ground.material = groundMaterial;
    }
  }

  // Nouvelle méthode pour créer des obstacles
  createObstacles() {
    // Créer un mur
    const wall = MeshBuilder.CreateBox("wall", { width: 3, height: 1, depth: 0.2 }, GlobalManager.scene);
    wall.position = new Vector3(0, 0.5, 2);
    wall.checkCollisions = true;
    const wallMaterial = new StandardMaterial("wallMaterial", GlobalManager.scene);
    wallMaterial.diffuseColor = new Color3(0.7, 0.3, 0.3);
    wall.material = wallMaterial;
    
    // Créer une colonne
    const column = MeshBuilder.CreateCylinder("column", { height: 2, diameter: 0.5 }, GlobalManager.scene);
    column.position = new Vector3(-2, 1, -1);
    column.checkCollisions = true;
    const columnMaterial = new StandardMaterial("columnMaterial", GlobalManager.scene);
    columnMaterial.diffuseColor = new Color3(0.3, 0.7, 0.3);
    column.material = columnMaterial;
    
    // Créer une boîte
    const box = MeshBuilder.CreateBox("box", { size: 0.8 }, GlobalManager.scene);
    box.position = new Vector3(2, 0.4, -1);
    box.checkCollisions = true;
    const boxMaterial = new StandardMaterial("boxMaterial", GlobalManager.scene);
    boxMaterial.diffuseColor = new Color3(0.3, 0.3, 0.7);
    box.material = boxMaterial;

    wall.checkCollisions = true;
    column.checkCollisions = true;
    box.checkCollisions = true;
  }

  async toggleDebugMode() {
    DEBUG_MODE = !DEBUG_MODE;
    if (DEBUG_MODE) {
        Inspector.Show(GlobalManager.scene, {});
        // Afficher les axes du monde
        if (this.axesWorld) {
            this.axesWorld.dispose();
        }
        this.axesWorld = new AxesViewer(GlobalManager.scene, 4);

        // Changer le matériau du sol en grille
        const ground = GlobalManager.scene.getMeshByName("ground");
        if (ground) {
            ground.material = new GridMaterial("groundMaterial", GlobalManager.scene);
            ground.material.diffuseColor = new Color3(0, 0, 1);
        }

        // Afficher les axes du joueur si le joueur existe
        if (this.player && this.player.axies) {
            this.player.axies.visible = true;
        }
    } else {
        Inspector.Hide();
        // Cacher les axes du monde
        if (this.axesWorld) {
            this.axesWorld.dispose();
        }

        // Remettre le matériau standard pour le sol
        const ground = GlobalManager.scene.getMeshByName("ground");
        if (ground) {
            ground.material = new StandardMaterial("groundMaterial", GlobalManager.scene);
            ground.material.diffuseColor = new Color3(0, 0, 1);
        }

        // Cacher les axes du joueur si le joueur existe
        if (this.player && this.player.axies) {
            this.player.axies.visible = false;
        }
    }
  }

  initKeyboard() {
    GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.inputMap[kbInfo.event.code] = true;
          // Vérifier la combinaison de touches pour le mode debug
          if (
            kbInfo.event.ctrlKey &&
            kbInfo.event.altKey &&
            kbInfo.event.key === "i"
          ) {
            this.toggleDebugMode();
          }
          break;
        case KeyboardEventTypes.KEYUP:
          this.inputMap[kbInfo.event.code] = false;
          this.actions[kbInfo.event.code] = true;
          break;
      }
    });
  }
}
export { DEBUG_MODE };
