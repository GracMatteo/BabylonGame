import {Vector3, AxesViewer, MeshBuilder, StandardMaterial, Color3,Texture} from '@babylonjs/core';
import {GlobalManager} from './GlobalManager.js';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import {ArcRotateCamera, Mesh, Quaternion, Ray, textureSizeIsObject} from "babylonjs";
import Object3D from './Object3D.js';
import {DEBUG_MODE} from "./Game.js";

const pathplanetGLB = "/assets/";
const planetGLB = "planetB.glb";

class Planet extends Object3D{
    //attributes
    meshPlanet;
    radius;
    gravity;
    gravityFieldRadius;
    position = new Vector3(0,0,0);
    angleRotation = 0; // Angle of rotation around a planet
    type;
    texture;
    name = "planet";

    constructor(type,radius,gravity,position,texture){
        super();
        this.texture = texture;
        this.type = type;
        this.radius = radius
        this.gravityFieldRadius = radius * 1.5;
        this.gravity = gravity
        this.position = position
    }

    async init(){
        
        
        //probleme de deplacement du personnage car il passe a travers la planete des qu'il y a un petit denivelé
        /*
        const planet = await this.loadGLB(pathplanetGLB,planetGLB);
        this.meshPlanet = planet;
        this.meshPlanet.name = this.name;
        for(let i = 0; i < this.meshPlanet.getChildren().length; i++){
            this.meshPlanet.getChildren()[i].checkCollisions = true;
            //this.meshPlanet.getChildren()[i].isPickable = true;
            this.meshPlanet.getChildren()[i].name = this.name;
        }
        if(DEBUG_MODE){
            this.setAxisDebug();
        }
        this.setPosition(this.position);
        this.setScale(new Vector3(this.radius,this.radius,this.radius));
        */


        //create sphere
        if(this.type == "sphere"){
            const planet = await this.CreateSphere("planetSphere",this.radius);
            this.meshPlanet = planet;
            this.meshPlanet.position = this.position;
            this.meshPlanet.name = this.name;
            //add de la texture
            const planetTexture = new StandardMaterial("planetTexture", GlobalManager.scene);
            planetTexture.diffuseTexture = new Texture(this.texture, GlobalManager.scene);
            this.meshPlanet.material = planetTexture;

            const gravityField = MeshBuilder.CreateSphere("gravityField", { diameter: this.gravityFieldRadius }, GlobalManager.scene);
            gravityField.parent = this.meshPlanet;

            // Create a transparent material for the gravity field
            const gravityMaterial = new StandardMaterial("gravityMat", GlobalManager.scene);
            gravityMaterial.alpha = 0; // Transparency
            gravityField.material = gravityMaterial;
        }
        
        if(this.type == "cube"){
            const planet = await this.CreateCube("planetSphere",this.radius);
            this.meshPlanet = planet;
            this.meshPlanet.position = this.position
            this.meshPlanet.name = this.name;
            //add de la texture
            const planetTexture = new StandardMaterial("planetTexture", GlobalManager.scene);
            planetTexture.diffuseTexture = new Texture(this.texture, GlobalManager.scene);
            this.meshPlanet.material = planetTexture;

            const gravityField = MeshBuilder.CreateBox("gravityField", { size: this.gravityFieldRadius}, GlobalManager.scene);
            gravityField.parent = this.meshPlanet;

            // Create a transparent material for the gravity field
            const gravityMaterial = new StandardMaterial("gravityMat", GlobalManager.scene);
            gravityMaterial.alpha = 0; // Transparency
            gravityField.material = gravityMaterial;
        }

        if (this.type == "cylinder"){
            const planet = await this.CreateCylinder("planetSphere",this.radius);
            this.meshPlanet = planet;
            this.meshPlanet.position = this.position
            this.meshPlanet.name = this.name;
            //add de la texture
            const planetTexture = new StandardMaterial("planetTexture", GlobalManager.scene);
            planetTexture.diffuseTexture = new Texture(this.texture, GlobalManager.scene);
            this.meshPlanet.material = planetTexture;

            const gravityField = MeshBuilder.CreateCylinder("gravityField", { diameter: this.gravityFieldRadius, height: 10 }, GlobalManager.scene);
            gravityField.parent = this.meshPlanet;

            // Create a transparent material for the gravity field
            const gravityMaterial = new StandardMaterial("gravityMat", GlobalManager.scene);
            gravityMaterial.alpha = 0; // Transparency
            gravityField.material = gravityMaterial;
        }
        //create cylinder
        //this.mesh = MeshBuilder.CreateCylinder("cylinder", {diameterTop: 30, diameterBottom: 30, height: 30}, GlobalManager.scene);
        //this.mesh.position = this.position;
        //this.mesh.checkCollisions = true;

        

        //add shadow
        //GlobalManager.addShadowCaster(this.mesh, true);
    }

    rotate(){
        let rotationDelta = 0.2 * GlobalManager.deltaTime;
        let rotationQuaternion = Quaternion.RotationAxis(new Vector3(0,1,0),rotationDelta);
        this.meshPlanet.rotationQuaternion = this.meshPlanet.rotationQuaternion.multiply(rotationQuaternion);
    }

    circleTranslation(radius){
        
        // Update the position of the planet in a circular path
        const circleTranslation = new Vector3(
            radius * Math.cos(this.angleRotation),
            0, // Assuming the planet moves in the XZ plane
            radius * Math.sin(this.angleRotation)
        );

        this.meshPlanet.position = circleTranslation;
        
    }

    update(){
        this.rotate();
        
    }

    dispose(){
        if(this.meshPlanet){
            this.meshPlanet.dispose();
        }
    }
}
export default Planet;


