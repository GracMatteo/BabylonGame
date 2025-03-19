// Importation des composants nécessaires de Babylon.js
import {} from '@babylonjs/core';

/**
 * Classe gérant la caméra du jeu
 */
class CameraManager {
    
    // Références à la scène et la caméra
    scene;
    camera;

    constructor() {

   }
   
   // Pattern singleton pour n'avoir qu'une seule instance
   static get instance() {
        return (globalThis[Symbol.for(`PF_${CameraManager.name}`)] || new this());    
   }

   /**
    * Initialise la caméra
    */
   init(){
        
   }

   /**
    * Met à jour la caméra à chaque frame
    */
   update(){
    
   }

}

// Export de l'instance singleton
const {instance} = CameraManager;
export {instance as CameraManager};