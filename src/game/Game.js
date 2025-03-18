import {AxesViewer,KeyboardEventTypes, Scene ,Color4,MeshBuilder,Vector3,FreeCamera, StandardMaterial,HemisphericLight, Color3,AmmoJSPlugin} from '@babylonjs/core';
import {GridMaterial} from "@babylonjs/materials";
import {Inspector} from "@babylonjs/inspector";

import Ammo from 'ammo.js'; 

import Player from './Player.js';
import { GlobalManager } from './GlobalManager.js';


var DEBUG_MODE = true;

export default class Game {
    
    engine;
    canvas;
    scene;

    camera;
    light;
    axesWorld;

    startTimer;
    
    player;
    
    inputMap = {};
    actions = {}

    constructor(engine,canvas) {
        GlobalManager.engine = engine;
        GlobalManager.canvas = canvas;
    }

    async init() {
        GlobalManager.engine.displayLoadingUI();
        
        
        
        await this.createScene();
        this.initKeyboard();
        this.player = new Player();   
        await this.player.init();
        GlobalManager.engine.hideLoadingUI();
    }

    async start() {
        
        await this.init();
        
        if(DEBUG_MODE){
            Inspector.Show(GlobalManager.scene,{});
        }

        this.startTimer = 0;
        GlobalManager.engine.runRenderLoop(() => {

            GlobalManager.update();
            //console.log("delta time : "+DELTA_TIME )
            this.update();
            
             
            this.actions = {};
            GlobalManager.scene.render(); 
            
        })
    }
    
    update(){
        //console.log("inputMap in Update of Game :"+this.inputMap)
        
        //rajouter les updates de toutes les entités
        this.player.update(this.inputMap,this.actions);
        this.startTimer += GlobalManager.deltaTime;
    }

    async createScene() {
        
        GlobalManager.scene = new Scene(GlobalManager.engine);
        GlobalManager.scene.clearColor = new Color4(0,0,0,0);
        //GlobalManager.scene.collisionsEnabled = true;
        //GlobalManager.scene.enablePhysics(new Vector3(0, -10, 0), new AmmoJSPlugin(true, Ammo));

        //faire un cameraManager
        
        //GlobalManager.camera = new FreeCamera("camera", new Vector3(0, 5, -10), GlobalManager.scene);
        //GlobalManager.camera.attachControl(GlobalManager.canvas, true);
        
        this.light = new HemisphericLight("light", new Vector3(0, 0.8, 0), GlobalManager.scene);
        
        
        var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6});
        var groundMaterial = new StandardMaterial("groundMaterial");
        groundMaterial.diffuseColor = new Color3( 0, 0, 1);
        ground.material = groundMaterial
        if (DEBUG_MODE){
            
            this.axesWorld = new AxesViewer(GlobalManager.scene, 4);
            //ground grid pour debug
            var groundMaterial = new GridMaterial("groundMaterial");
            groundMaterial.diffuseColor = new Color3(0, 0, 1);
            ground.material = groundMaterial;    
        }
        
    }

    //a mettre dans un autre fichier
    initKeyboard(){
        GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN :
                    this.inputMap[kbInfo.event.code] = true;
                    //console.log("keyDOWN"+kbInfo.event.code);
                    break;
                case KeyboardEventTypes.KEYUP :
                    this.inputMap[kbInfo.event.code] = false;
                    this.actions[kbInfo.event.code] = true;
                    //console.log("keyUP"+kbInfo.event.code);
                    break;
            }
        })
    }



}
export {DEBUG_MODE}
