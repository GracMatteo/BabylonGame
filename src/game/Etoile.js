import '@babylonjs/loaders';
import Object3D from './Object3D';
import {GlobalManager} from './GlobalManager.js';
import {Vector3} from '@babylonjs/core';
import { Quaternion, Vector4 } from 'babylonjs';
import {DEBUG_MODE} from "./Game.js";


const pathEtoileGLB = "/assets/";
const etoileGLB = "etoile.glb";

class Etoile extends Object3D{
    
    meshEtoile;
    position;
    name = "etoile";
    
    constructor(position){
        super();
        this.position = position;
        this.meshEtoile = null;

        //pour l'occilation
        this._baseY = position.y;
        this._time  = 0;

    }

    async init(){
        
        const etoile = await this.loadGLB(pathEtoileGLB,etoileGLB);
        this.meshEtoile = etoile;
        this.meshEtoile.name = this.name;
        if(DEBUG_MODE){
            this.setAxisDebug();
        }
        this.setPosition(this.position);
        this.setScale(new Vector3(2,2,2)); // Set initial scale
        this.setRotationQuaternion(new Quaternion(0,1,0,0)); // Rotation quaternion for Y-axis
        this._baseY = this.meshEtoile.position.y;
    }
    /*
    * Scale down the mesh by a given factor.
    * @param {number} shrinkFactor - The factor by which to scale down the mesh.
    */
    scaleDown(shrinkFactor){
        let shrinkFactorDelta;
        let vectFactor;

        shrinkFactorDelta = shrinkFactor * GlobalManager.deltaTime;
        vectFactor  = new Vector3(shrinkFactorDelta,shrinkFactorDelta,shrinkFactorDelta);
        this.meshEtoile.scaling = this.meshEtoile.scaling.subtract(vectFactor);
    }
    
    /*
       oscilation(amp,freq) : Oscillate the mesh vertically based on a sine function.
       @param {number} amp - Amplitude of the oscillation.
       @param {number} freq - Frequency of the oscillation. 
    */
    oscilation(amp,freq){
        this._time += GlobalManager.deltaTime;

        const y = this._baseY + Math.sin(2*Math.PI*freq*this._time)*amp;
        this.meshEtoile.position.y = y;
    }
    
    move(){
        this.rotateY(0.3);
        this.oscilation(0.1,1);    
    }
    
    update(){
        //this.isIntersectWithPlayer(GlobalManager.player);
        this.scaleDown(0.07);
        this.move();
    }

    

}export default Etoile;