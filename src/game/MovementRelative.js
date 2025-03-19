import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

/**
 * Classe gérant le mouvement relatif d'un personnage par rapport à la caméra
 */
export default class MovementRelative {
  /**
   * Crée une nouvelle instance de MovementRelative
   * @param {Mesh} mesh - Le mesh du personnage
   * @param {Camera} camera - La caméra qui suit le personnage
   * @param {Mesh} hitbox - La hitbox pour les collisions
   * @param {Object} inputs - L'objet gérant les entrées clavier
   * @param {number} gravity - La force de gravité (défaut: -0.035)
   */
  constructor(mesh, camera, hitbox, inputs, gravity = -0.035) {
    this.mesh = mesh;
    this.camera = camera;
    this.hitbox = hitbox; // La hitbox pour les collisions
    this.inputs = inputs;
    this.gravity = gravity;
    this.jumpVelocity = 0;
    this.dash = 0;
    this.ignoreMovementInput = false;
  }

  /**
   * Lance un raycast depuis la position actuelle du personnage dans la direction moveDirection,
   * sur une distance donnée (displacementLength).
   * Si une collision est détectée avant d'atteindre cette distance, le personnage est repositionné
   * juste avant le point d'impact et la méthode retourne true.
   * Sinon, elle retourne false.
   * @param {Vector3} moveDirection - Direction du mouvement
   * @param {number} displacementLength - Distance du déplacement
   * @returns {boolean} True si collision détectée, false sinon
   */
  checkCollisionWithRay(moveDirection, displacementLength) {
    // Normaliser la direction
    moveDirection = BABYLON.Vector3.Normalize(moveDirection);
  
    // --- Vérification de collision dans la direction de déplacement ---
    const rayOrigin = this.hitbox.getAbsolutePosition();
    const ray = new BABYLON.Ray(rayOrigin, moveDirection, displacementLength);
    const hit = this.mesh.getScene().pickWithRay(ray, (m) => {
      return m !== this.mesh && m !== this.hitbox && m.checkCollisions;
    });
    if (hit.hit && hit.distance < displacementLength) {
      // Repositionnement : on place la hitbox juste avant l'objet avec un offset de sécurité
      const safeOffset = 0.1;
      const offsetVec = this.hitbox.getAbsolutePosition().subtract(this.mesh.position);
      const newPos = hit.pickedPoint
        .subtract(moveDirection.scale(safeOffset))
        .subtract(offsetVec);
      this.mesh.position.copyFrom(newPos);
      return true;
    }
  
    // --- Vérification spécifique des collisions vers le haut ---
    if (moveDirection.y > 0) {
      const upwardDirection = new BABYLON.Vector3(0, 1, 0);
      const upwardRay = new BABYLON.Ray(rayOrigin, upwardDirection, displacementLength);
      const hitUp = this.mesh.getScene().pickWithRay(upwardRay, (m) => {
        return m !== this.mesh && m !== this.hitbox && m.checkCollisions;
      });
      if (hitUp.hit && hitUp.distance < displacementLength) {
        const safeOffset = 0.5;
        const offsetVec = this.hitbox.getAbsolutePosition().subtract(this.mesh.position);
        const newPos = hitUp.pickedPoint
          .subtract(upwardDirection.scale(safeOffset))
          .subtract(offsetVec);
        this.mesh.position.copyFrom(newPos);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Vérifie les collisions latérales en lançant un raycast dans la direction donnée (gauche ou droite).
   * Si une collision est détectée, repositionne le mesh pour éviter l'intersection.
   * @param {Vector3} sideDirection - Direction latérale à vérifier
   * @param {number} displacementLength - Distance du déplacement
   * @returns {boolean} True si collision détectée, false sinon
   */
  checkSideCollision(sideDirection, displacementLength) {
    sideDirection = BABYLON.Vector3.Normalize(sideDirection);
    const rayOrigin = this.hitbox.getAbsolutePosition();
    const ray = new BABYLON.Ray(rayOrigin, sideDirection, displacementLength);
    const hit = this.mesh.getScene().pickWithRay(ray, (m) => {
      return m !== this.mesh && m !== this.hitbox && m.checkCollisions;
    });
    if (hit.hit && hit.distance < displacementLength) {
      const safeOffset = 0.1;
      const offsetVec = this.hitbox.getAbsolutePosition().subtract(this.mesh.position);
      const newPos = hit.pickedPoint
        .subtract(sideDirection.scale(safeOffset))
        .subtract(offsetVec);
      this.mesh.position.copyFrom(newPos);
      return true;
    }
    return false;
  }
  
  /**
   * Calcule et applique les mouvements du personnage en fonction des entrées
   * Gère les déplacements, le saut, le dash et les collisions
   */
  calculMovemente() {
    if (!this.mesh) return;
    const step = 0.15;
    
    // --- 1) Calcul du vecteur horizontal de déplacement ---
    let forward = this.camera.target.subtract(this.camera.position);
    forward.y = 0;
    forward = BABYLON.Vector3.Normalize(forward);
    
    let moveDirection = BABYLON.Vector3.Zero();
    if (this.inputs.isKeyPressed("z")) {
      moveDirection = moveDirection.add(forward);
    }
    if (this.inputs.isKeyPressed("s")) {
      moveDirection = moveDirection.add(forward.scale(-1));
    }
    if (this.inputs.isKeyPressed("q")) {
      // Calcul du vecteur gauche
      let left = BABYLON.Vector3.Cross(forward, new BABYLON.Vector3(0, 1, 0));
      left = BABYLON.Vector3.Normalize(left);
      moveDirection = moveDirection.add(left);
    }
    if (this.inputs.isKeyPressed("d")) {
      // Calcul du vecteur droit
      let right = BABYLON.Vector3.Cross(new BABYLON.Vector3(0, 1, 0), forward);
      right = BABYLON.Vector3.Normalize(right);
      moveDirection = moveDirection.add(right);
    }
    
    // Sauvegarde de la position actuelle
    const oldPosition = this.mesh.position.clone();
  
    // --- 2) Gestion du dash ---
    if (this.inputs.isKeyPressed("Shift") && this.dash === 0 && moveDirection.length() > 0) {
      this.dash = 1;
      let dashDisplacement = moveDirection.scale(step * 5);
      // Vérifier collision avec raycast pour le dash
      if (!this.checkCollisionWithRay(moveDirection, dashDisplacement.length())) {
        this.mesh.position.addInPlace(dashDisplacement);
      }
      this.ignoreMovementInput = true;
      setTimeout(() => {
        this.dash = 0;
        this.ignoreMovementInput = false;
      }, 200);
      moveDirection = BABYLON.Vector3.Zero();
    }
    
    // --- 3) Déplacement horizontal normal ---
    if (!this.ignoreMovementInput && moveDirection.length() > 0) {
      moveDirection = BABYLON.Vector3.Normalize(moveDirection);
      let displacement = moveDirection.scale(step);
      // Vérifier collision horizontale via raycast
      if (!this.checkCollisionWithRay(moveDirection, displacement.length())) {
        this.mesh.position.addInPlace(displacement);
        // Ajuster l'orientation du personnage
        const yaw = Math.atan2(moveDirection.x, moveDirection.z);
        this.mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, yaw, 0);
      }
    }
  
    // --- 4) Gestion du saut ---
    const groundHeight = this.getGroundHeight();
    if (
      (this.inputs.isKeyPressed(" ") || this.inputs.isKeyPressed("Space")) &&
      groundHeight !== null &&
      Math.abs(this.mesh.position.y - groundHeight) < 0.05
    ) {
      this.jumpVelocity = 0.5;
    }
  
    // --- 5) Gestion de la gravité et du déplacement vertical ---
    if (groundHeight === null) {
      // Aucun sol détecté, le personnage tombe librement
      this.mesh.position.y += this.jumpVelocity;
      this.jumpVelocity += this.gravity;
    } else {
      const oldY = this.mesh.position.y;
      this.mesh.position.y += this.jumpVelocity;
      if (this.mesh.position.y < groundHeight) {
        this.mesh.position.y = groundHeight;
        this.jumpVelocity = 0;
      } else {
        this.jumpVelocity += this.gravity;
      }
    }
    
    // --- 6) Vérification du plafond ---
    const ceilingHeight = this.getCeilingHeight();
    if (ceilingHeight !== null && this.mesh.position.y > ceilingHeight) {
      // Si le personnage dépasse le plafond, on le repositionne juste en dessous
      this.mesh.position.y = ceilingHeight;
      this.jumpVelocity = 0;
    }

    // --- 7) Vérification des collisions latérales ---
    // On vérifie séparément si le personnage heurte un obstacle sur sa gauche ou sa droite
    if (this.inputs.isKeyPressed("q")) {
      let left = BABYLON.Vector3.Cross(forward, new BABYLON.Vector3(0, 1, 0));
      left = BABYLON.Vector3.Normalize(left);
      this.checkSideCollision(left, step);
    }
    if (this.inputs.isKeyPressed("d")) {
      let right = BABYLON.Vector3.Cross(new BABYLON.Vector3(0, 1, 0), forward);
      right = BABYLON.Vector3.Normalize(right);
      this.checkSideCollision(right, step);
    }
      
    // --- 8) Mise à jour de la caméra ---
    this.camera.setTarget(this.mesh.position);
  }
  

  /**
   * Effectue un raycast vertical pour détecter le sol (objet nommé "ground" ou "box").
   * @returns {number|null} La hauteur Y du sol plus un offset si trouvé, sinon null
   */
  getGroundHeight() {
    const ray = new BABYLON.Ray(
      this.mesh.position,
      new BABYLON.Vector3(0, -1, 0),
      100
    );
    const hit = this.mesh.getScene().pickWithRay(ray, (m) => m.name === "ground" || m.name === "box");
    if (hit.hit && hit.pickedPoint) {
      console.log("Point d'impact du raycast:", hit.pickedPoint);
      return hit.pickedPoint.y + 0.5;
    }
    return null;
  }

  /**
   * Effectue un raycast vertical vers le haut pour détecter le plafond
   * @returns {number|null} La hauteur Y du plafond moins un offset si trouvé, sinon null
   */
  getCeilingHeight() {
    const ray = new BABYLON.Ray(
      this.mesh.position,
      new BABYLON.Vector3(0, 1, 0),
      100
    );
    const hit = this.mesh.getScene().pickWithRay(ray, (m) => m.name === "ceiling" || m.name === "box" || m.name === "ground");
    if (hit.hit && hit.pickedPoint) {
      console.log("Point d'impact du raycast vers le haut:", hit.pickedPoint);
      return hit.pickedPoint.y - 0.5;
    }
    return null;
  }
}
