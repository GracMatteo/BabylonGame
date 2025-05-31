import {Vector4, Vector3, AxesViewer, MeshBuilder, StandardMaterial, Color3, Color4, Matrix, TransformNode} from '@babylonjs/core';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders';
import {getForwardVector, getRightVector, getUpVector} from "./getDirectionMesh.js";
import {drawRay, createEllipsoidLines} from "./debugDraw.js";
import {ArcRotateCamera, Quaternion, Ray, TrailMesh} from "babylonjs";
import {DEBUG_MODE} from "./Game.js";
import {GlobalManager} from './GlobalManager.js';
import Game from './Game.js';
import Score from './Score.js';

const SPEED = 20;
const SPEED_ROTATION = 10;
const JUMP_FORCE = 20;
const SUPER_JUMP = 45;

const pathPlayerGLB = "/assets/";
const PlayerGLB = "mario.glb"; 

class Player {
  mesh;
  animationsGroup;
  scene;
  camera;
  axies;

  //animations
  walkAnimation;
  bWasWalking = false;
  bWalking = false;
  
  idleAnimation;
  
  score;

  trail;

  moveInput = new Vector3(0, 0, 0);
  moveDirection = new Vector3(0, 0, 0);
  //============================
  rayCastLenght;
  rotationSpeed = 5;
  tmpRotationSpeed;
  speed;
  //
  
  gravityVelocity = new Vector3(0, 0, 0);
  tmpGravity;
  jumpForce = JUMP_FORCE;
  currentPlanet;
  //rayCast
  hits = [];

  planetDir = new Vector3(0, 0, 0);
  normalVector = new Vector3(0, 0, 0);
  // Nouvelle propriété pour l'interpolation de la normale
  interpolatedNormal = new Vector3(0, 0, 0);

  //============================
  jumpVelocity = 0;
  isJumping = false;
  cameraTarget;
  lookDirectionQuaternion = new Quaternion.Identity();

  constructor() {}

  async init(planet) {
    //const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 1}, GlobalManager.scene);
    //this.mesh = sphere;
    const result = await SceneLoader.ImportMeshAsync("", pathPlayerGLB, PlayerGLB, GlobalManager.scene);
    //console.log("Player mesh loaded:", result);
    this.mesh = result.meshes[0];
    this.mesh.name = "player";
    // this.mesh = MeshBuilder.CreateBox("player", {size: 1}, GlobalManager.scene);
    this.mesh.position = new Vector3(2,planet.radius/2,2);
    this.mesh.ellipsoid = new Vector3(0.001,0.001,0.001);
    //this.mesh.ellipsoid.scaling = new Vector3(40, 40, 40);
    this.mesh.ellipsoidOffset = new Vector3(0, 0, 0);
    //this.mesh.scaling = new Vector3(0.03, 0.03, -0.03);

    this.score = new Score("Mario-galaxy-Land3D")
    
    //animations 
    this.animationsGroup = result.animationGroups;
    this.idleAnimation = this.animationsGroup[0];
    this.walkAnimation = this.animationsGroup[1];
    
    //bizarre
    //this.initTrail();

    if (!this.mesh.rotationQuaternion) {
      this.mesh.rotationQuaternion = Quaternion.Identity();
    }
    
    if (DEBUG_MODE) {
      createEllipsoidLines(this.mesh, this.mesh.ellipsoid.x - this.mesh.ellipsoidOffset.x, this.mesh.ellipsoid.y - this.mesh.ellipsoidOffset.y);
    }

    let camera = new ArcRotateCamera("playerCamera", -Math.PI / 2, 3 * Math.PI / 10, 40, this.mesh.position, GlobalManager.scene);
    
    
    GlobalManager.camera = camera;
    GlobalManager.addShadowCaster(this.mesh, true);
    GlobalManager.camera.attachControl(GlobalManager.engine.getRenderingCanvas(), true);

    this.applyCameraToInput();
    
    this.currentPlanet = planet
    console.log("currentPlanet : ", this.currentPlanet);
    this.tmpGravity = this.currentPlanet.gravity;
    this.tmpRotationSpeed = this.rotationSpeed;
    
    if (DEBUG_MODE) {
      this.axies = new AxesViewer(GlobalManager.scene, 10);
      this.axies.xAxis.parent = this.mesh;
      this.axies.yAxis.parent = this.mesh;
      this.axies.zAxis.parent = this.mesh;
    }

  }

  update(inputMap, actions, planet) {
    this.currentPlanet = planet;  
    this.getInputs(inputMap, actions);
    this.applyCameraToInput(inputMap);
    this.move();
    this.applyGravity();
    this.applyPlanetRotation();
    this.adjustCameraUpVector();
    //essayer de d'ajuster par rapport a une heightmap
    //this.adjustToTerrain();
  }

  getInputs(inputMap, actions) {
    this.moveInput.set(0, 0, 0);

    this.bWasWalking = this.bWalking;
    this.bWalking = false;

    if (inputMap["KeyA"]){ 
      this.moveInput.x = -1;
      this.bWalking = true;
    } 
    if (inputMap["KeyD"]){ 
      this.moveInput.x = 1;
      this.bWalking = true;
    }
    if (inputMap["KeyW"]){ 
      this.moveInput.z = 1;
      this.bWalking = true;
    }
    if (inputMap["KeyS"]){
      this.moveInput.z = -1;
      this.bWalking = true;
    }
    //super jump pour se deplacer de planète en planète
    if ((actions["ShiftLeft"]  || actions["buttonSquare"] )&& !this.isJumping) {
      console.log("Jump triggered by gamepad button X");
      this.superJump();
      actions["ShiftLeft"] = false;
      actions["Space"] = false;
    }
    //jump
    if ((actions["Space"] || actions["buttonx"]) && !this.isJumping) {
      this.jump();
      actions["Space"] = false;
    }
    
    if (inputMap["leftStickX"] !== undefined && Math.abs(inputMap["leftStickX"]) > 0.15) {
      this.moveInput.x = inputMap["leftStickX"] * GlobalManager.deltaTime;
      this.bWalking = true;
    }
    if (inputMap["leftStickY"] !== undefined && Math.abs(inputMap["leftStickY"]) > 0.15) {
      this.moveInput.z = -inputMap["leftStickY"] * GlobalManager.deltaTime;
      this.bWalking = true;
    }

    if (inputMap["rightStickX"] !== undefined && Math.abs(inputMap["rightStickX"]) > 0.15) {
      GlobalManager.camera.alpha -= inputMap["rightStickX"] * GlobalManager.deltaTime;
      this.bWalking = true;
    }
    if (inputMap["rightStickY"] !== undefined && Math.abs(inputMap["rightStickY"]) > 0.15) {
      GlobalManager.camera.beta -= inputMap["rightStickY"] * GlobalManager.deltaTime;
      this.bWalking = true;
    }
    
    

  }
  
  

  // Méthode dédiée pour déclencher le saut
  jump() {
    // Applique une impulsion dans la direction opposée à la normale (donc vers le haut)
    this.gravityVelocity = this.normalVector.scale(this.jumpForce);
    this.isJumping = true;
  }

  superJump() {
    // Applique une impulsion dans la direction opposée à la normale (donc vers le haut)
    this.gravityVelocity = this.normalVector.scale(SUPER_JUMP);
    this.isJumping = true;
  }

  applyCameraToInput() {
    this.moveDirection.set(0, 0, 0);
  
    if (this.moveInput.length() !== 0) {
      let forward = getForwardVector(GlobalManager.camera, true).normalize();
      let right = getRightVector(GlobalManager.camera, true).normalize();
  
      forward.scaleInPlace(this.moveInput.z);
      right.scaleInPlace(this.moveInput.x);

      // Somme pour obtenir la direction brute
      let rawDirection = forward.add(right);
  
      // Projection sur le plan tangent à la surface (enlever la composante selon la normale)
      const dot = Vector3.Dot(rawDirection, this.normalVector);
      const projectedDirection = rawDirection.subtract(this.normalVector.scale(dot)).normalize();
  
      this.moveDirection = projectedDirection;  
      Quaternion.FromLookDirectionLHToRef(this.moveDirection, this.normalVector, this.lookDirectionQuaternion);
    }
  }

  move() {
    if (!this.mesh) return;

    const finalMove = new Vector3(0, 0, 0);

    const gravityMove = this.gravityVelocity.scale(GlobalManager.deltaTime);
    finalMove.addInPlace(gravityMove);
    
    if (this.moveDirection.length() != 0) {
      Quaternion.SlerpToRef(this.mesh.rotationQuaternion, this.lookDirectionQuaternion, SPEED_ROTATION * GlobalManager.deltaTime, this.mesh.rotationQuaternion);
      this.moveDirection.scaleInPlace(SPEED * GlobalManager.deltaTime);
      finalMove.addInPlace(this.moveDirection);

      if (!this.bWasWalking && !this.isJumping){
        this.walkAnimation.start(true, 2.0, this.walkAnimation.from, this.walkAnimation.to, false);
      }

    }
    else {            
      if (this.bWasWalking) {
        this.walkAnimation.stop();
        this.idleAnimation.start(true, 2.0, this.idleAnimation.from, this.idleAnimation.to, false);
      }
    }
    this.mesh.moveWithCollisions(finalMove);
  }

  applyGravity() {
    // Si nécessaire, vérifier qu'une planète est définie (si plusieurs planètes)
    // if (!this.currentPlanet) return;
    let rayChoiced;
    const origin = this.mesh.position;
    //console.log(this.currentPlanet.mesh.name);
    if(this.currentPlanet.mesh.name === "planet") {
      rayChoiced = this.currentPlanet.radius/2;
    }
    else {
      rayChoiced = 10;
    }

    const rayLength = rayChoiced
    //console.log(rayChoiced);
    // Ray 1 : vers le bas (opposé à up)
    let direction = getUpVector(this.mesh).scale(-1);
    if(DEBUG_MODE) {
      drawRay(origin, direction, rayLength, new Color3(1, 0, 0)); // rouge
    }
    this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, direction, rayLength), (mesh) =>
      mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
    );
    
    // Ray 2 : vers l'avant
    if (this.hits.length === 0) {
      direction = getForwardVector(this.mesh);
      if(DEBUG_MODE){
        drawRay(origin, direction, rayLength, new Color3(1, 0, 0));
      }
      this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, direction, rayLength), (mesh) =>
        mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
      );
    }
  
    // Ray 3 : vers l'arrière
    if (this.hits.length === 0) {
      direction = getForwardVector(this.mesh).scale(-1);
      if(DEBUG_MODE) {
        drawRay(origin, direction, rayLength, new Color3(1, 0, 0));
      }
      this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, direction, rayLength), (mesh) =>
        mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
      );
    }
  
    // Ray 4 : vers la droite
    if (this.hits.length === 0) {
      direction = getRightVector(this.mesh);
      if(DEBUG_MODE) {
        drawRay(origin, direction, rayLength, new Color3(1, 0, 0));
      }
      this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, direction, rayLength), (mesh) =>
        mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
      );
    }
  
    // Ray 5 : vers la gauche
    if (this.hits.length === 0) {
      direction = getRightVector(this.mesh).scale(-1);
      if(DEBUG_MODE) {
        drawRay(origin, direction, rayLength, new Color3(1, 0, 0));
      }
      this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, direction, rayLength), (mesh) =>
        mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
      );
    }
    
  
      // Ray 6 : direction vers la planète, si le joueur n'est pas déjà dans le champ de gravité
      if (this.hits.length === 0) {
        this.planetDir = this.currentPlanet.position.subtract(this.mesh.position).normalize();
        if(DEBUG_MODE) {
          drawRay(origin, this.planetDir, rayLength, new Color3(1, 0, 0));
        }
        this.hits = GlobalManager.scene.multiPickWithRay(new Ray(origin, this.planetDir, rayLength), (mesh) =>
        mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
        );
      }
    
    //}
    
    // Recalcule la normale de la planète
    this.getPlanetNormal();
    
    // INTERPOLATION : on met à jour une normale interpolée pour décaler l'application de la gravité
    const interpolationFactor = 0.15; // Facteur d'interpolation 
    this.interpolatedNormal = Vector3.Lerp(this.interpolatedNormal, this.normalVector, interpolationFactor);
    
    // Appliquer la gravité en utilisant la normale interpolée
    const gravityAccel = this.interpolatedNormal.scale(this.currentPlanet.gravity * GlobalManager.deltaTime);
    this.gravityVelocity.addInPlace(gravityAccel);
    
    // Raycast pour détecter le sol (vers la planète)
    const rayToPlanet = new Ray(origin, this.normalVector.negate(), 0.55);
    const hit = GlobalManager.scene.pickWithRay(rayToPlanet, (mesh) =>
      mesh !== this.mesh && mesh.isPickable && mesh.checkCollisions && this.mesh.ellipsoid
    );
  
    if (hit && hit.hit) {
      // Si on touche le sol : réinitialise la vélocité gravitationnelle et réautorise le saut
      this.gravityVelocity.set(0, 0, 0);
      this.isJumping = false;
    }
    
    this.hits = [];
  }

  getPlanetNormal() {
    if (!this.currentPlanet) return;
  
    // Normal par défaut : du joueur vers la planète
    this.normalVector = this.currentPlanet.position.subtract(this.mesh.position).normalize();
    
    for (let hit of this.hits) {
      let planetName = this.currentPlanet.mesh.name;
      //console.log("planetName : "+planetName); 
      let pickedMeshName = hit.pickedMesh.name;
      //console.log("pickedMeshName : "+pickedMeshName); 
      if (pickedMeshName === planetName) {
        const n = hit.getNormal(true, true).normalize();
        if (n) {
          const normalizedNormal = n.normalize();
          // Dessine le vecteur normal depuis le point d'impact (s'il est défini)
          if (hit.pickedPoint) {
            if(DEBUG_MODE) {
              drawRay(hit.pickedPoint, normalizedNormal, 2, new Color3(1, 1, 0));
            }
            this.normalVector = normalizedNormal;
          }
          break;
        }
      }
    }
    return;
  }
  
  applyPlanetRotation() {
    const currentUp = getUpVector(this.mesh, true).normalize();
    
    const axis = Vector3.Cross(currentUp, this.normalVector).normalize();
    
    const angle = Vector3.GetAngleBetweenVectors(currentUp, this.normalVector, axis);
    
    if (DEBUG_MODE){      
      //drawRay(this.mesh.position, this.normalVector, 1, new Color3(0, 1, 1)); // cyan
      //drawRay(this.mesh.position, axis, 1, new Color3(0, 0, 1)); // bleu
      //drawRay(this.mesh.position, currentUp, 1, new Color3(0, 1, 0)); // vert
    }
    
    
    const qRot = Quaternion.RotationAxis(axis, angle);
    const targetRotation = qRot.multiply(this.mesh.rotationQuaternion);
  
    Quaternion.SlerpToRef(
      this.mesh.rotationQuaternion,
      targetRotation,
      this.rotationSpeed * GlobalManager.deltaTime,
      this.mesh.rotationQuaternion
    );
  }
  
  adjustCameraUpVector() {
    if (!this.normalVector || !GlobalManager.camera || this.isJumping) return;
  
    const currentUp = GlobalManager.camera.upVector;
    const targetUp = this.normalVector;
    GlobalManager.camera.upVector = Vector3.Lerp(currentUp, targetUp, GlobalManager.deltaTime * this.rotationSpeed);
    
  }
  
  getDistPlanetPlayer(planet) {
    let direction = this.mesh.position.subtract(planet.position);
    if (DEBUG_MODE) {
      //drawRay(this.mesh.position, planet.position, direction);
    }
    return this.mesh.position.subtract(planet.position);
  }
  
  

  /**
 * Ajuste la position du joueur pour qu'il suive les petites irrégularités de la planète.
 */
  adjustToTerrain() {
      // 1) On part d'un point un peu au-dessus du joueur
      const above = this.mesh.position.add(this.normalVector.scale(1));  // 2 unités au-dessus

      // 2) On tire un rayon vers la planète (le long de la normale inversée)
      const ray = new Ray(above, this.normalVector.negate(), 2); 
      if (DEBUG_MODE) {
        drawRay(above, this.normalVector.negate(), 2, new Color3(0, 1, 0)); // vert
      }
      // 3) On picke la planète seulement
      const hit = GlobalManager.scene.multiPickWithRay(ray, (mesh) => 
        mesh !== this.mesh &&  mesh.checkCollisions && this.mesh.ellipsoid 
    );
    setTimeout(() => {
    //console.log("hit : ", hit),
    500
    });
    // 4) Si on touche bien la surface, on replace le joueur
      if (hit && hit.hit && hit.pickedPoint) {
        // Offset pour que l'ellipsoïde ne passe pas à travers le sol
        const surfaceOffset = this.mesh.ellipsoidOffset.y * this.mesh.scaling.y;
        this.mesh.position = hit.pickedPoint.add(this.normalVector.scale(surfaceOffset));
      }
  }


  //essaie non concluant de faire une traînée
  initTrail() {
    let options = { 
      diameter: 1, // Largeur de la traînée
      length: 50, // Longueur de la traînée
      segments : 10,
      sections: 4,
      doNotTaper :false,
      autoStart : true,
    };  
  
    this.trail = new TrailMesh("trail", this.mesh, GlobalManager.scene, options);

    const sourceMat = new StandardMaterial("sourceMat", GlobalManager.scene);
    sourceMat.emissiveColor = sourceMat.diffuseColor = new Color3(1, 0, 0); // Couleur rouge
    sourceMat.specularColor = Color3.Black(); // Pas de réflexion
    this.trail.material = sourceMat;
  }
}

export default Player;
