import {Vector3,AxesViewer,MeshBuilder,StandardMaterial,Color3} from '@babylonjs/core';

import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders';  // This registers all additional loaders like GLTF, OBJ, etc.


import {getForwardVector, getRightVector,getUpVector} from "./getDirectionMesh.js";
import {ArcRotateCamera, Quaternion} from "babylonjs"
import {DEBUG_MODE} from "./Game.js"
import { GlobalManager } from './GlobalManager.js';

//import { SceneLoader } from '@babylonjs/Loading/sceneLoader';

const SPEED = 5;
const SPEED_ROTATION = 5;

const pathPlayerGLB = "./src/game/assets/";
const PlayerGLB = "angryAntoine.glb"; 

class Player{
  
  mesh;
  shadow;
  
  scene;
  camera;
  axies;

  //vecteur d'input
  moveInput = new Vector3(0,0,0);
  //vecteur de déplacement 
  moveDirection = new Vector3(0,0,0);

  lookDirectionQuaternion = new Quaternion.Identity();

  constructor(){
  
  }

  async init(){
    
    //mesh player
    //this.mesh = MeshBuilder.CreateBox("playerMesh", {size: 1});
    //this.mesh.material = new StandardMaterial("playerMaterial", GlobalManager.scene);
    //this.mesh.material.diffuseColor = new Color3(0 , 1, 0);  
    //this.mesh.position = new Vector3(3, 0.5, 3);
    
    
    const result = await SceneLoader.ImportMeshAsync("",pathPlayerGLB,PlayerGLB,GlobalManager.scene);
    this.mesh = result.meshes[0];
    this.mesh.position = new Vector3(1, 0.5, 1);
    //this.mesh.rotation = new Vector3(0,Math.PI,0);
    this.mesh.rotationQuaternion = Quaternion.Identity();
    //this.mesh
    let camera = new ArcRotateCamera("playerCamera",
      -Math.PI/2,       
      3*Math.PI/10,       
      10,                
      this.mesh.positsion, 
      GlobalManager.scene
    );
    GlobalManager.camera = camera;
    /*
    GlobalManager.camera = ArcRotateCamera("playerCamera",
      -Math.PI/2,       
      3*Math.PI/10,       
      10,                
      this.mesh.position, 
      GlobalManager.scene
    );
    */
    // Activer les contrôles de la caméra avec la souris
    GlobalManager.camera.attachControl(GlobalManager.engine.getRenderingCanvas(), true);

    

<<<<<<< HEAD
        // -- (6) Instancier MovementRelative en lui passant la hitbox si nécessaire --
        this.movementPlayer = new MovementRelative(
          this.mesh,
          this.camera,
          this.hitbox,
          this.inputs
        );
        //this.shadowGenerator = new BABYLON.ShadowGenerator(1024, this.camera);
        //this.shadowGenerator.addShadowCaster(this.mesh);
      })
      .catch((error) => {
        console.error("Erreur lors de l'importation du mesh :", error);
      });
      //marche pas reste au point de départ
      let axes = new BABYLON.Debug.AxesViewer(this.scene);
      axes.xAxis.isVisible = true;
      axes.yAxis.isVisible = true;
      axes.zAxis.isVisible = true;
      axes.xAxis.parent = this.mesh;
      axes.yAxis.parent = this.mesh;
      axes.zAxis.parent = this.mesh;
      //
=======
    this.applyCameraToInput();
    //GlobalManager.camera.setTarget(this.mesh.position);
    

    if(DEBUG_MODE){
      //axies pour debug
      this.axies = new AxesViewer(GlobalManager.scene, 1)
      this.axies.xAxis.parent = this.mesh;
      this.axies.yAxis.parent = this.mesh;
      this.axies.zAxis.parent = this.mesh;
    }
      
  }

  update(inputMap, actions){
    //console.log("input in update :"+inputMap)
    this.getInputs(inputMap,actions);
    this.applyCameraToInput();
    //console.log("delta time ="+delta)
    this.move(GlobalManager.deltaTime);
>>>>>>> a47d73997859d15ba511d720531dde5ce82d637c
  }
  
  //faire un InputManager
  getInputs(inputMap,actions){
    
    this.moveInput.set(0,0,0);
    //console.log("inputmap in getInput :"+inputMap);
    if(inputMap["KeyA"]){
      this.moveInput.x = -1;
      //consol.log("mesh position X :"+ this.mesh.position.x) 
    }
    
    if (inputMap["KeyD"]){
      this.moveInput.x = 1;
    }

    if(inputMap["KeyW"]){
      this.moveInput.z = 1;
    }
    
    if(inputMap["KeyS"]){
      this.moveInput.z = -1;
    }
    
    if(inputMap[" "]){
      this.moveInput.y = 1;
    }

  }

  applyCameraToInput(){
    
    this.moveDirection.set(0, 0, 0);
    
    if(this.moveInput.length() !== 0){
      
      //recuperer le forward de la camera
      let forward = getForwardVector(GlobalManager.camera,true);
      //reset Y
      forward.y = 0;
      //normaliser
      forward.normalize();
      forward.scaleInPlace(this.moveInput.z);
      
      //recuperer le forward de la camera
      let right = getRightVector(GlobalManager.camera,true);
      //reset Y
      right.y = 0;
      //normaliser
      right.normalize();
      right.scaleInPlace(this.moveInput.x);
      
      //essai de mettre un saut
      let up = getUpVector(GlobalManager.camera,true)

      //add les 2 vecteurs
      this.moveDirection = right.add(forward);
      this.moveDirection.normalize();

      Quaternion.FromLookDirectionLHToRef(
        this.moveDirection, 
        Vector3.UpReadOnly,
        this.lookDirectionQuaternion)
      }  
  }

  move(){
    
    if (!this.mesh) return;
    //check si il y a un vecteur d'input 
    if(this.moveDirection.length() != 0){
      
      //permet de positionner le mesh dans la direction calculer
      //this.mesh.lookAt(this.mesh.position.add(this.moveDirection));

      //permet de positionner le mesh dans la bonne direction  
      Quaternion.SlerpToRef(this.mesh.rotationQuaternion ,this.lookDirectionQuaternion,SPEED_ROTATION * GlobalManager.deltaTime, this.mesh.rotationQuaternion)
      //permet d'appliquer la translation
      this.moveDirection.scaleInPlace(SPEED * GlobalManager.deltaTime);
      
      this.mesh.position.addInPlace(this.moveDirection);
    
    }
    //permet de suivre le Player
    GlobalManager.camera.target = this.mesh.position;
  }


}

export default Player;