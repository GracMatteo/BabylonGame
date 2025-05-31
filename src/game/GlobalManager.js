import {Vector3} from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

class GlobalManager {
   
    engine;
    canvas;
    scene;
    audioEngine;

    gui;

    sunAngle = 0;
    sunTranslation = 0;
    rayon = 30;
    
    gravityVector = new Vector3(0,-0.5,0)

    camera = []; 
    lights = [];
    shadowGenerators = [];

    deltaTime;
    constructor() {
          
   }
   
   //singleton
   static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] || new this());    
   }

   init(engine,canvas){
        this.canvas = canvas;
        this.engine = engine;
   }

   update(){
        this.deltaTime = this.engine.getDeltaTime() / 1000.0;
        // Update the sun's direction to simulate movement
        //this.lightRotation(0.01);
        //console.log("light position :" + this.lights[0].position);
        //this.lightTranslation();
        //GlobalManager.lightTranslation(); 
   }

   addShadowGenerator(shadowGen){
        this.shadowGenerators.push(shadowGen);
   }

   addShadowCaster(object,bChilds){
        bChilds = bChilds || false;
        for(let shad of this.shadowGenerators){
            shad.addShadowCaster(object,bChilds);
        }
   }

   addLight(light){
        this.lights.push(light);
   }
   
   removeLight(light){
     this.lights.pop(light);        
   }
   
   lightRotation(angleRotation){
     this.sunAngle += angleRotation * this.deltaTime;
     // Calcul de la position de la lumière (si besoin de recalculer ou s'il est déjà défini ailleurs)
     // const sunPosition = new Vector3(
     //   Math.sin(this.sunAngle) * this.rayon,
     //   -Math.cos(this.sunAngle) * this.rayon,
     //   0
     // );
     // this.lights[0].position = sunPosition;
     
     // La direction est le vecteur allant de la position de la lumière vers le centre (0,0,0)
     // Donc, c'est l'opposé de la position de la lumière.
     // Si la position est calculée comme (sin, -cos, 0), alors la direction devient (-sin, cos, 0)
     const sunDirection = new Vector3(
       -Math.sin(this.sunAngle),
       Math.cos(this.sunAngle),
       0
     );
     // Optionnel: normaliser le vecteur direction
     sunDirection.normalize();
     this.lights[0].direction = sunDirection;
   }

     lightTranslation(){
          // Mise à jour de l'angle (par exemple, décrémenté pour un mouvement horaire)
          this.sunAngle += 0.1 * this.deltaTime;
          
          // Calcul de la nouvelle position sur le cercle de rayon 'this.rayon'
          const sunTranslation = new Vector3(
          Math.sin(this.sunAngle) * this.rayon ,   // Coordonnée x
          -Math.cos(this.sunAngle) * this.rayon ,  // Coordonnée y
          30                                   // Coordonnée z (reste à 0 pour un plan 2D)
          );
          
          // Affectation de la position calculée à la lumière
          this.lights[0].position = sunTranslation;
     }

     //GUI
     initGUI(playerScore) {
          this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
          const panel = new GUI.StackPanel("panel");
          panel.width = "220px";
          panel.height = "100px";
          panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
          panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
          this.gui.addControl(panel);
           
          const textBlock = new GUI.TextBlock("text", "Score : " + playerScore);
          textBlock.color = "white";
          textBlock.fontSize = 24;
          panel.addControl(textBlock);
     }
   
     onScoreUpdate(score) {
          const textBlock = this.gui.getControlByName("text");
          if (textBlock) {
               textBlock.text = "Score : " + score;
          }
    }

}

const {instance} = GlobalManager;
export {instance as GlobalManager};