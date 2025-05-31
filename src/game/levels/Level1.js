// src/Level1.js

import { SceneLoader, MeshBuilder, Vector3, StandardMaterial, Color3, Scene,Color4,DirectionalLight,ShadowGenerator,AxesViewer} from "@babylonjs/core";
import { GlobalManager } from "../GlobalManager.js";
import Planet from "../Planet.js";
import Player from "../Player.js";
import EtoileManager from "../EtoileManager.js";
import { DEBUG_MODE } from "../Game.js";

const textureMoonPath = "/assets/2k_mercury.jpg";


export default class Level1 {
    

    planets = [];
    currentPlanet;
    etoileManager;
    player;
    
    constructor() {
    
    }

    /** Charge tous les éléments du niveau */
    async init() {
        await this.createScene()
      
        this.planets.forEach(planet => {
            planet.init();
        });
        this.currentPlanet = this.planets[0];

        this.player = new Player();   
        await this.player.init(this.planets[0]);
        this.etoileManager = new EtoileManager();
        await this.etoileManager.init(this.planets[0]); 
    }

  async createScene() {
        
      GlobalManager.scene = new Scene(GlobalManager.engine);
      GlobalManager.scene.clearColor = new Color4(0,0,0,0);
      const skyBox = await SceneLoader.ImportMeshAsync("", "/assets/", "skyBox.glb", GlobalManager.scene);
      
      // Create a directional light to simulate the sun
      this.sunLight = new DirectionalLight("sunLight", new Vector3(0, -10, -10), GlobalManager.scene);
      this.sunLight.position = new Vector3(0, 10, 0);
      this.sunLight.intensity = 1;
      GlobalManager.addLight(this.sunLight);

      const light =new DirectionalLight("sunLight", new Vector3(0, 10, 10), GlobalManager.scene);
      GlobalManager.addLight(light)

      let shadowGenSun = new ShadowGenerator(2048, this.sunLight);
      shadowGenSun.useExponentialShadowMap = true;
      shadowGenSun.bias = 0.01;
      shadowGenSun.normalBias = 0.02;

      GlobalManager.addShadowGenerator(shadowGenSun);
      /*
      this.sky = MeshBuilder.CreateSphere("sky", {diameter: 1000, sideOrientation : Mesh.BACKSIDE }, GlobalManager.scene);
      const skyMaterial = new GridMaterial("skyMaterial", GlobalManager.scene);
      skyMaterial.mainColor = new Color3(0, 0.5, 0.5);
      this.sky.material = skyMaterial;
      */
      // Create a planet
      
      const planet1 = new Planet("sphere",200,-9.8,new Vector3(0,0,0),textureMoonPath);
      this.planets.push(planet1);
      const planet2 = new Planet("cube",50,-5.8, new Vector3(0,230,0),textureMoonPath);
      this.planets.push(planet2);
      const planet3 = new Planet("cylinder",50,-12.8, new Vector3(200,0,0),textureMoonPath);
      this.planets.push(planet3);

      if (DEBUG_MODE){
          this.axesWorld = new AxesViewer(GlobalManager.scene, 4);
               
      }
        
    }

    checkCurrentPlanet(){
        
        this.planets.forEach(planet => {
            if(planet.mesh.getChildren()[0].intersectsMesh(this.player.mesh,false)){
                this.currentPlanet = planet;
            }
        });

    }

    getDistBetweenPlanets(planet1, planet2) {
        const pos1 = planet1.mesh.position;
        const pos2 = planet2.mesh.position;
        return Vector3.Distance(pos1, pos2);
    }
    
    //faire tourner la 2eme planet autour de la 1ere
    rotationPlanets(){
       let rayonRotation = this.getDistBetweenPlanets(this.planets[0], this.planets[1]);
       //console.log("rayonRotation", rayonRotation);
       this.planets[1].angleRotation += 0.07 * GlobalManager.deltaTime; // Vitesse de rotation
       this.planets[1].circleTranslation(rayonRotation);
    }
    
    update(player) {
      this.checkCurrentPlanet();
      this.etoileManager.update(player);
      // trop de bug de collision avec la rotation des planètes
      //this.rotationPlanets();
    }

    /** Nettoyage */
    dispose() {
      this.planets.forEach(planet => {
        planet.dispose();
      });
      this.etoileManager.dispose();
    }

}
