import {Vector3} from "@babylonjs/core"


/**
 * Retourne le vecteur UP (haut) dans l'espace monde pour un mesh donné
 * @param {Mesh} _mesh - Le mesh dont on veut obtenir le vecteur UP
 * @param {boolean} refresh - Si true, force le recalcul de la matrice monde
 * @returns {Vector3} Le vecteur UP dans l'espace monde
 */
function getUpVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var up_local = new Vector3(0, 1, 0);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(up_local, worldMatrix);
}


/**
 * Retourne le vecteur FORWARD (avant) dans l'espace monde pour un mesh donné
 * @param {Mesh} _mesh - Le mesh dont on veut obtenir le vecteur FORWARD
 * @param {boolean} refresh - Si true, force le recalcul de la matrice monde
 * @returns {Vector3} Le vecteur FORWARD normalisé dans l'espace monde
 */
function getForwardVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var forward_local = new Vector3(0, 0, 1);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(forward_local, worldMatrix).normalize();
}
    

/**
 * Retourne le vecteur RIGHT (droite) dans l'espace monde pour un mesh donné
 * @param {Mesh} _mesh - Le mesh dont on veut obtenir le vecteur RIGHT
 * @param {boolean} refresh - Si true, force le recalcul de la matrice monde
 * @returns {Vector3} Le vecteur RIGHT normalisé dans l'espace monde
 */
function getRightVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var right_local = new Vector3(1, 0, 0);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(right_local, worldMatrix).normalize();
}    

export {getUpVector, getForwardVector,getRightVector};