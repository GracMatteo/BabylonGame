import {Vector3} from "@babylonjs/core"


function getUpVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var up_local = new Vector3(0, 1, 0);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(up_local, worldMatrix);
}


function getForwardVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var forward_local = new Vector3(0, 0, 1);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(forward_local, worldMatrix).normalize();
}
    

function getRightVector( _mesh, refresh){
    _mesh.computeWorldMatrix(true,refresh);
    var right_local = new Vector3(1, 0, 0);
    const worldMatrix = _mesh.getWorldMatrix();
    return Vector3.TransformNormal(right_local, worldMatrix).normalize();
}    

export {getUpVector, getForwardVector,getRightVector};