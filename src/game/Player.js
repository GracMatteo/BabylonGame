// Importation des composants nécessaires de Babylon.js
import {Vector3,AxesViewer,MeshBuilder,StandardMaterial,Color3} from '@babylonjs/core';

// Importation du chargeur de scène et des loaders additionnels
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders';  // Enregistre les loaders GLTF, OBJ, etc.

// Importation des fonctions utilitaires et des composants
import {getForwardVector, getRightVector,getUpVector} from "./getDirectionMesh.js";
import {ArcRotateCamera, Quaternion} from "babylonjs"
import {DEBUG_MODE} from "./Game.js"
import { GlobalManager } from './GlobalManager.js';

// Constantes pour les paramètres de mouvement
const SPEED = 5; // Vitesse de déplacement
const SPEED_ROTATION = 5; // Vitesse de rotation

// Chemins pour le modèle 3D du joueur
const pathPlayerGLB = "./src/game/assets/";
const PlayerGLB = "angryAntoine.glb"; 

/**
 * Classe représentant le joueur
 */
class Player{
  
  // Propriétés du mesh
  mesh;
  shadow;
  
  // Références scène et caméra
  scene;
  camera;
  axies;

  // Vecteurs de mouvement
  moveInput = new Vector3(0,0,0); // Vecteur d'entrée
  moveDirection = new Vector3(0,0,0); // Vecteur de déplacement

  // Quaternion pour la rotation
  lookDirectionQuaternion = new Quaternion.Identity();

  constructor(){
  
  }

  /**
   * Initialise le joueur
   */
  async init(){
    // Chargement du modèle 3D
    const result = await SceneLoader.ImportMeshAsync("",pathPlayerGLB,PlayerGLB,GlobalManager.scene);
    this.mesh = result.meshes[0];
    this.mesh.position = new Vector3(1, 0.5, 1);
    this.mesh.rotationQuaternion = Quaternion.Identity();

    // Configuration de la caméra qui suit le joueur
    let camera = new ArcRotateCamera("playerCamera",
      -Math.PI/2,       // Alpha
      3*Math.PI/10,     // Beta 
      10,               // Rayon
      this.mesh.positsion, 
      GlobalManager.scene
    );
    GlobalManager.camera = camera;

    // Active les contrôles de la caméra
    GlobalManager.camera.attachControl(GlobalManager.engine.getRenderingCanvas(), true);

    this.applyCameraToInput();

    // Créer la Hitbox (ellipsoide) autour du joueur
    // Définit la taille de l'ellipsoïde de collision
    this.mesh.ellipsoid = new Vector3(1, 1, 1);
    // Décalage vertical de l'ellipsoïde
    const offsetY = 0.0;
    // Applique le décalage à l'ellipsoïde
    this.mesh.ellipsoidOffset = new Vector3(0, offsetY, 0);

    if (DEBUG_MODE) {
      // Ajoute les axes de debug si nécessaire
      this.axies = new AxesViewer(GlobalManager.scene, 1)
      this.axies.xAxis.parent = this.mesh;
      this.axies.yAxis.parent = this.mesh;
      this.axies.zAxis.parent = this.mesh;

      //Create Visible Ellipsoid around player  ( https://playground.babylonjs.com/#0NESCY#2 )
      const a = this.mesh.ellipsoid.x;
      const b = this.mesh.ellipsoid.y;
      const points = [];
      for (let theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
          points.push(new Vector3(0, b * Math.sin(theta) + offsetY, a * Math.cos(theta)));
      }

      const ellipse = [];
      ellipse[0] = MeshBuilder.CreateLines("e", { points: points }, GlobalManager.scene);
      ellipse[0].color = Color3.Red();
      ellipse[0].parent = this.mesh;
      const steps = 12;
      const dTheta = 2 * Math.PI / steps;
      for (let i = 1; i < steps; i++) {
          ellipse[i] = ellipse[0].clone("el" + i);
          ellipse[i].parent = this.mesh;
          ellipse[i].rotation.y = i * dTheta;
      }
  }
   

    
  }

  /**
   * Met à jour l'état du joueur
   */
  update(inputMap, actions){
    this.getInputs(inputMap,actions);
    this.applyCameraToInput();
    this.move(GlobalManager.deltaTime);
  }
  
  /**
   * Gère les entrées clavier
   */
  getInputs(inputMap,actions){
    
    this.moveInput.set(0,0,0);
    
    // Déplacements latéraux
    if(inputMap["KeyA"]){
      this.moveInput.x = -1;
    }
    if (inputMap["KeyD"]){
      this.moveInput.x = 1;
    }

    // Déplacements avant/arrière
    if(inputMap["KeyW"]){
      this.moveInput.z = 1;
    }
    if(inputMap["KeyS"]){
      this.moveInput.z = -1;
    }
    
    // Saut
    if(inputMap[" "]){
      this.moveInput.y = 1;
    }

  }

  /**
   * Calcule le vecteur de déplacement en fonction de la caméra
   */
  applyCameraToInput(){
    
    this.moveDirection.set(0, 0, 0);
    
    if(this.moveInput.length() !== 0){
      
      // Calcul du vecteur avant
      let forward = getForwardVector(GlobalManager.camera,true);
      forward.y = 0;
      forward.normalize();
      forward.scaleInPlace(this.moveInput.z);
      
      // Calcul du vecteur droite
      let right = getRightVector(GlobalManager.camera,true);
      right.y = 0;
      right.normalize();
      right.scaleInPlace(this.moveInput.x);
      
      // Vecteur haut pour le saut
      let up = getUpVector(GlobalManager.camera,true)

      // Combine les vecteurs
      this.moveDirection = right.add(forward);
      this.moveDirection.normalize();

      // Calcule la rotation
      Quaternion.FromLookDirectionLHToRef(
        this.moveDirection, 
        Vector3.UpReadOnly,
        this.lookDirectionQuaternion)
      }  
  }

  /**
   * Applique le mouvement au mesh du joueur
   */
  move(){
    
    if (!this.mesh) return;

    if(this.moveDirection.length() != 0){
      
      // Rotation progressive vers la direction
      Quaternion.SlerpToRef(this.mesh.rotationQuaternion ,this.lookDirectionQuaternion,SPEED_ROTATION * GlobalManager.deltaTime, this.mesh.rotationQuaternion)
      
      // Application du déplacement
      this.moveDirection.scaleInPlace(SPEED * GlobalManager.deltaTime);
      this.mesh.position.addInPlace(this.moveDirection);
    
    }
    // Met à jour la cible de la caméra
    GlobalManager.camera.target = this.mesh.position;
  }

}

export default Player;