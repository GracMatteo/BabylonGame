import {} from '@babylonjs/core';


/**
 * Gestionnaire global du jeu qui stocke les références principales
 * Implémenté comme un singleton pour un accès global
 */
class GlobalManager {
   
    /** Instance du moteur de rendu Babylon.js */
    engine;
    /** Element canvas pour le rendu */
    canvas;
    /** Scene principale */
    scene;
    /** Tableau des caméras */
    camera = [];

    /** Tableau des générateurs d'ombres */
    shadowGenerator = [];

    /** Temps écoulé depuis la dernière frame en secondes */
    deltaTime;

    constructor() {

   }
   
   /** 
    * Implémentation du pattern singleton
    * Retourne l'instance unique de GlobalManager
    */
   static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] || new this());    
   }

   /**
    * Initialise le gestionnaire global
    * @param {Engine} engine - Instance du moteur Babylon.js
    * @param {HTMLCanvasElement} canvas - Element canvas pour le rendu
    */
   init(engine,canvas){
        this.canvas = canvas;
        this.engine = engine;
   }

   /**
    * Met à jour le temps écoulé depuis la dernière frame
    */
   update(){
        this.deltaTime = this.engine.getDeltaTime() / 1000.0; 
   }

}

const {instance} = GlobalManager;
export {instance as GlobalManager};