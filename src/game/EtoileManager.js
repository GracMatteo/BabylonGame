import '@babylonjs/loaders';
import Object3D from './Object3D';
import {GlobalManager} from './GlobalManager.js';
import {Vector3} from '@babylonjs/core';
import { Quaternion, Sound, Vector4 } from 'babylonjs';
import {DEBUG_MODE} from "./Game.js";
import Etoile from './Etoile.js';
import Score from './Score.js';
import { SoundManager } from './SoundManager.js';

const MAX_ETOILES = 10; // Maximum number of stars

const collect_star_sound = "/assets/sounds/collect_star.wav";


class EtoileManager {
    
    currentPlanet = null; // Current planet
    
    etoiles = []; // Array to hold the stars
    collectSound = null;
    constructor() {
        
    }

    async init(planet) {
       
        this.currentPlanet = planet; // Set the current planet
        //console.log("EtoileManager initialized with planet:", this.currentPlanet);
        
        const minOffset = 1;
        const maxOffset = 3;
        
        const spawnEtoile = async () => {
            if (this.etoiles.lenght >= MAX_ETOILES) return;
            
            let dir = new Vector3(
                Math.random() * 2 - 1, // Random x direction
                Math.random() * 2 - 1, // Random y direction
                Math.random() * 2 - 1  // Random z direction
            ).normalize(); // Normalize the random direction vector
            
            const distance = 
                (this.currentPlanet.radius/2) + // Planet radius
                minOffset + // Minimum distance from the planet
                Math.random() * (maxOffset - minOffset); // Random range around the planet
                // Random distance from the planet
    
            const spawnPos = this.currentPlanet.position.add(dir.scale(distance)); // Calculate the spawn position

            const etoile = new Etoile(spawnPos);
            await etoile.init();
            this.etoiles.push(etoile);

            const timeNextSpawn = Math.random() * 1000 + 500; // Random time between 0.5 and 1.5 seconds
            setTimeout(spawnEtoile, timeNextSpawn); // Create a new star every 0.5 to 1.5 seconds
        }

        spawnEtoile();

    }

    async popEtoile(player) {
    
        this.etoiles.forEach(etoile => {
            if(etoile.meshEtoile.scaling.x < 0.1) {
                this.etoiles.splice(this.etoiles.indexOf(etoile), 1);
                etoile.meshEtoile.dispose();
                return; // eviter des erreurs dans la console 
            }
            //console.log("intersect",etoile.meshEtoile.intersectsMesh(playerMesh,false))
            if(etoile.meshEtoile.getChildren()[0].intersectsMesh(player.mesh,false)){
                //console.log("etoile intersected with player");
                SoundManager.playSound("star_collect",collect_star_sound)
                // Update score in the console (a faire avec le GUI de Babylon.js)
                player.score.updateScore(1);
                
                
                //console.log(player.score) // Update the score when the star is collected
                this.etoiles.splice(this.etoiles.indexOf(etoile), 1);
                etoile.meshEtoile.dispose(); // Dispose of the mesh to free up memory
            }
        
        });
    }

    update(player) {
        
        this.etoiles.forEach(etoile => {
            etoile.update();
            this.popEtoile(player) 
        });

        //console.log("etoiles",this.etoiles.length);
    }

    dispose() {
        this.etoiles.forEach(etoile => {
            etoile.meshEtoile.dispose();
        });
        this.etoiles = []; // Clear the array of stars
        if(this.collectSound) {
            this.collectSound.dispose(); // Dispose of the sound if it exists
        }
    }

}export default EtoileManager;
    