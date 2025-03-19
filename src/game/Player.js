// ====== IMPORTATIONS ======
// Composants de base de Babylon.js
import {
  Vector3,
  AxesViewer,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Quaternion,
  ArcRotateCamera
} from "@babylonjs/core";

// Chargeur de modèles 3D
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders"; // Pour charger les fichiers GLTF, OBJ, etc.

// Fonctions utilitaires et paramètres globaux
import { getForwardVector, getRightVector, getUpVector } from "./getDirectionMesh.js";
import { DEBUG_MODE } from "./Game.js";
import { GlobalManager } from "./GlobalManager.js";

// ====== PARAMÈTRES DU JOUEUR ======
const SPEED = 5;        // Vitesse de déplacement du joueur
const SPEED_ROTATION = 5; // Vitesse de rotation du joueur
const GRAVITY = -9.8; // Gravité
const GROUND_LEVEL = 0; // Niveau du sol

// ====== CHEMIN DU MODÈLE 3D ======
const pathPlayerGLB = "./src/game/assets/";
const PlayerGLB = "angryAntoine.glb";

/**
 * Classe Joueur - Gère le personnage contrôlé par l'utilisateur
 */
class Player {
  // ====== PROPRIÉTÉS ======
  mesh;           // Le modèle 3D du joueur
  ellipsoidMesh;  // Représentation visuelle de la zone de collision
  axies;          // Axes de debug (X, Y, Z)
  
  // Vecteurs de contrôle du mouvement
  moveInput = new Vector3(0, 0, 0);     // Direction souhaitée par le joueur
  moveDirection = new Vector3(0, 0, 0); // Direction finale après calculs
  
  // Rotation
  lookDirectionQuaternion = Quaternion.Identity();
  
  /**
   * Initialisation du joueur
   * Cette fonction est appelée au démarrage
   */
  async init() {
    // 1. CHARGEMENT DU MODÈLE 3D
    const result = await SceneLoader.ImportMeshAsync(
      "",
      pathPlayerGLB,
      PlayerGLB,
      GlobalManager.scene
    );
    this.mesh = result.meshes[0];
    this.mesh.position = new Vector3(1, 0.5, 1);  // Position de départ
    this.mesh.rotationQuaternion = Quaternion.Identity();
    
    // 2. CONFIGURATION DE LA CAMÉRA
    this.setupCamera();
    
    // 3. CONFIGURATION DES COLLISIONS
    this.setupCollisions();
    
    // 4. AJOUT DES ÉLÉMENTS DE DEBUG
    if (DEBUG_MODE) {
      this.setupDebugVisuals();
    }
  }
  
  /**
   * Configure la caméra qui suit le joueur
   */
  setupCamera() {
    // Création d'une caméra qui orbite autour du joueur
    let camera = new ArcRotateCamera(
      "playerCamera",
      -Math.PI / 2,         // Angle horizontal (alpha)
      (3 * Math.PI) / 10,   // Angle vertical (beta)
      10,                   // Distance (rayon)
      this.mesh.position,   // Point ciblé
      GlobalManager.scene
    );
    
    GlobalManager.camera = camera;
    
    // Permet de contrôler la caméra avec la souris
    GlobalManager.camera.attachControl(
      GlobalManager.engine.getRenderingCanvas(),
      true
    );
  }
  
  /**
   * Configure les paramètres de collision
   */
  setupCollisions() {
    this.mesh.checkCollisions = true;
    
    // Réduire légèrement l'ellipsoïde pour une détection plus précise
    this.mesh.ellipsoid = new Vector3(0.4, 0.5, 0.4);
    
    // Ajuster le décalage pour que ça reste aligné avec le joueur
    this.mesh.ellipsoidOffset = new Vector3(0, 0.5, 0);
  }
  
  /**
   * Crée les éléments visuels de debug
   */
  setupDebugVisuals() {
    // 1. AXES XYZ
    this.axies = new AxesViewer(GlobalManager.scene, 1);
    this.axies.xAxis.parent = this.mesh;  // Attache les axes au joueur
    this.axies.yAxis.parent = this.mesh;
    this.axies.zAxis.parent = this.mesh;
    
    // 2. ELLIPSOÏDE DE COLLISION VISIBLE
    const a = this.mesh.ellipsoid.x;
    const b = this.mesh.ellipsoid.y;
    const c = this.mesh.ellipsoid.z;
    
    // Création d'un matériau rouge semi-transparent
    const redMaterial = new StandardMaterial("redMaterial", GlobalManager.scene);
    redMaterial.diffuseColor = new Color3(1, 0, 0);
    redMaterial.emissiveColor = new Color3(1, 0, 0);
    redMaterial.alpha = 0.3;
    
    // Création d'une sphère qui représente la zone de collision
    this.ellipsoidMesh = MeshBuilder.CreateSphere("playerEllipsoid", {
      diameterX: a * 2,
      diameterY: b * 2,
      diameterZ: c * 2
    }, GlobalManager.scene);
    
    // Configuration de l'ellipsoïde
    this.ellipsoidMesh.material = redMaterial;
    this.ellipsoidMesh.parent = this.mesh;
    // Positionner l'ellipsoïde au même endroit que l'ellipsoïde de collision
    this.ellipsoidMesh.position = this.mesh.ellipsoidOffset.clone();
    this.ellipsoidMesh.isPickable = true;
    this.ellipsoidMesh.showBoundingBox = true;
    this.ellipsoidMesh.wireframe = true;
    
    // 3. LIGNES DE L'ELLIPSOÏDE (visualisation supplémentaire)
    this.createEllipsoidLines(a, b);
  }
  
  /**
   * Crée des lignes qui représentent l'ellipsoïde
   */
  createEllipsoidLines(a, b) {
    // Crée des points pour former une courbe
    const points = [];
    for (let theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
      points.push(new Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
    }
    
    // Crée la première ligne
    const ellipse = [];
    ellipse[0] = MeshBuilder.CreateLines("ellipsoidLine", { points: points }, GlobalManager.scene);
    ellipse[0].color = new Color3(1, 0, 0);
    ellipse[0].parent = this.mesh;
    
    // Duplique et fait tourner pour former un ellipsoïde complet
    const steps = 24;
    const dTheta = 2 * Math.PI / steps;
    for (let i = 1; i < steps; i++) {
      ellipse[i] = ellipse[0].clone("ellipsoidLine" + i);
      ellipse[i].parent = this.mesh;
      ellipse[i].rotation.y = i * dTheta;
    }
  }
  
  /**
   * Met à jour l'état du joueur (appelée à chaque frame)
   */
  update(inputMap, actions) {
    // 1. Récupérer les entrées du clavier
    this.getInputs(inputMap, actions);
    
    // 2. Calculer la direction en fonction de la caméra
    this.applyCameraToInput();
    
    // 3. Déplacer le joueur
    this.move();
  }
  
  /**
   * Lit les touches du clavier pressées
   */
  getInputs(inputMap, actions) {
    // Réinitialise le vecteur d'entrée
    this.moveInput.set(0, 0, 0);
    
    // Contrôles WASD
    if (inputMap["KeyA"]) this.moveInput.x = -1;  // Gauche
    if (inputMap["KeyD"]) this.moveInput.x = 1;   // Droite
    if (inputMap["KeyW"]) this.moveInput.z = 1;   // Avant
    if (inputMap["KeyS"]) this.moveInput.z = -1;  // Arrière
    
    // Espace pour sauter
    if (inputMap[" "]) this.moveInput.y = 1;
  }
  
  /**
   * Convertit les entrées en direction de mouvement relative à la caméra
   */
  applyCameraToInput() {
    // Réinitialise la direction
    this.moveDirection.set(0, 0, 0);
    
    // Si le joueur appuie sur des touches
    if (this.moveInput.length() !== 0) {
      // 1. Calculer direction avant/arrière basée sur la caméra
      let forward = getForwardVector(GlobalManager.camera, true);
      forward.y = 0;  // Ignorer mouvement vertical pour avancer
      forward.normalize();
      forward.scaleInPlace(this.moveInput.z);
      
      // 2. Calculer direction gauche/droite basée sur la caméra
      let right = getRightVector(GlobalManager.camera, true);
      right.y = 0;  // Ignorer mouvement vertical pour aller à droite/gauche
      right.normalize();
      right.scaleInPlace(this.moveInput.x);
      
      // 3. Combiner les directions
      this.moveDirection = right.add(forward);
      this.moveDirection.normalize();
      
      // 4. Calculer l'orientation pour faire face à la direction
      Quaternion.FromLookDirectionLHToRef(
        this.moveDirection,
        Vector3.UpReadOnly,
        this.lookDirectionQuaternion
      );
    }
  }
  
  /**
   * Déplace le joueur dans la direction calculée
   * avec gestion des collisions
   */
  move() {
    if (!this.mesh) return;
    
    if (this.moveDirection.length() != 0) {
      // 1. Rotation progressive vers la direction
      if (this.mesh.rotationQuaternion) {
        Quaternion.SlerpToRef(
          this.mesh.rotationQuaternion,
          this.lookDirectionQuaternion,
          SPEED_ROTATION * GlobalManager.deltaTime,
          this.mesh.rotationQuaternion
        );
      }
      
      // 2. Déplacement avec gestion des collisions
      const moveVector = new Vector3(
        this.moveDirection.x * SPEED * GlobalManager.deltaTime,
        0, // Pas de mouvement vertical pour rester au sol
        this.moveDirection.z * SPEED * GlobalManager.deltaTime
      );
      
      // Sauvegarder la position actuelle
      const oldPosition = this.mesh.position.clone();
      
      // Tenter de déplacer le joueur
      this.mesh.moveWithCollisions(moveVector);
      
      // Si on s'approche trop du cube, créer une "force de répulsion"
      const boxMesh = GlobalManager.scene.getMeshByName("box");
      if (boxMesh) {
        // Calculer la distance au cube
        const distanceToCube = Vector3.Distance(this.mesh.position, boxMesh.position);
        const minDistance = 0.7; // Distance minimale souhaitée
        
        if (distanceToCube < minDistance) {
          // Créer un vecteur d'éloignement
          const awayDir = this.mesh.position.subtract(boxMesh.position);
          awayDir.normalize();
          awayDir.scaleInPlace(minDistance - distanceToCube);
          
          // Appliquer une petite force d'éloignement
          this.mesh.position.addInPlace(awayDir);
        }
      }
      
      // 3. Forcer la position Y à rester fixe pour garder les pieds au sol
      this.mesh.position.y = 0.5; // Hauteur fixe
      
      // 4. Mise à jour de la caméra
      if (GlobalManager.camera) {
        GlobalManager.camera.target = this.mesh.position;
      }
      
      // 5. Effet de collision
      if (this.mesh.position.subtract(oldPosition).length() < 0.01) {
        this.onCollision();
      }
    }
  }
  
  /**
   * Appelée quand le joueur entre en collision avec un obstacle
   */
  onCollision() {
    // Vous pouvez ajouter ici :
    // - Un son de collision
    // - Un effet visuel (particules, flash, etc.)
    // - Une vibration du contrôleur
    // - Un retour visuel sur l'obstacle touché
    
    // Exemple avec une couleur temporaire sur l'ellipsoïde
    if (this.ellipsoidMesh && DEBUG_MODE) {
      const originalEmissive = this.ellipsoidMesh.material.emissiveColor.clone();
      this.ellipsoidMesh.material.emissiveColor = new Color3(1, 1, 0); // Jaune vif
      
      // Revenir à la couleur normale après 200ms
      setTimeout(() => {
        if (this.ellipsoidMesh && this.ellipsoidMesh.material) {
          this.ellipsoidMesh.material.emissiveColor = originalEmissive;
        }
      }, 200);
    }
  }
  
  /**
   * Vérifie si le joueur entre en collision avec d'autres objets
   * (non utilisée actuellement mais prête à l'emploi)
   */
  checkForCollisions() {
    const meshes = GlobalManager.scene.getMeshes();
    for (let mesh of meshes) {
      if (mesh !== this.mesh && mesh.checkCollisions && this.mesh.intersectsMesh(mesh, false)) {
        return true;
      }
    }
    return false;
  }
}

export default Player;
