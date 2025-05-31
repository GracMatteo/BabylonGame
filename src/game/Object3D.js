import {Vector3,AxesViewer,MeshBuilder} from '@babylonjs/core';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders';

import {Quaternion} from "babylonjs";

import {GlobalManager} from './GlobalManager.js';



class Object3D {
    //attributes
    mesh;
    
    init(){
        throw new Error("init() method not implemented in Object3D class. Please implement it in the derived class.");
    }

    setPosition(position){
        this.mesh.position = position;
    }
    
    setScale(scale){
        this.mesh.scaling = scale;
    }
    
    setRotationQuaternion(rotationQuaternion){
        this.mesh.rotationQuaternion = rotationQuaternion;
    }
    
    getPosition(){
        return this.mesh.position;
    }

    getRotationQuaternion(){
        return this.mesh.rotationQuaternion;
    }

    getScale(){
        return this.mesh.scaling;
    }
    
    setAxisDebug(){
        this.axies = new AxesViewer(GlobalManager.scene, 1);
        this.axies.xAxis.parent = this.mesh;
        this.axies.yAxis.parent = this.mesh;
        this.axies.zAxis.parent = this.mesh;
    }
    /*
       rotate(rotationSpeed) : Rotate the mesh around the Y-axis based on a given speed.
         @param {number}.
    */
    rotateY(rotationSpeed){
        let rotationDelta = rotationSpeed * GlobalManager.deltaTime;
        let rotationQuaternion = Quaternion.RotationAxis(new Vector3(0,1,0),rotationDelta);
        this.mesh.rotationQuaternion = this.mesh.rotationQuaternion.multiply(rotationQuaternion);
    }

    CreateSphere(name,diameter){
        this.mesh = MeshBuilder.CreateSphere(name,{diameter: diameter},GlobalManager.scene);
        this.mesh.checkCollisions = true;
        this.mesh.name = name;
        return this.mesh;
    }

    CreateCube(name,size){
        this.mesh = MeshBuilder.CreateBox(name,{size : size })
        this.mesh.checkCollisions = true;
        this.mesh.name = name;
        return this.mesh;
    }

    CreateCylinder(name,diameter){
        this.mesh = MeshBuilder.CreateCylinder(name,{diameterTop: diameter, diameterBottom: diameter, height: diameter},GlobalManager.scene);
        this.mesh.checkCollisions = true;
        this.mesh.name = name;
        return this.mesh;
    }

    loadGLB(path,modele,name){
        return new Promise((resolve, reject) => {
            SceneLoader.ImportMeshAsync("", path,modele, GlobalManager.scene).then((result) => {
                this.mesh = result.meshes[0];
                this.mesh.name = name;
                this.mesh.position = new Vector3(0,0,0);
                this.mesh.rotationQuaternion = Quaternion.Identity();
                this.mesh.scaling = new Vector3(1,1,1);
                resolve(this.mesh);
            }).catch((error) => {
                console.error("Error loading GLB:", error);
                reject(error);
            });
        });
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.axies) {
            this.axies.dispose();
        }
    }

}export default Object3D;