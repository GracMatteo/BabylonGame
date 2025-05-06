import {AxesViewer,KeyboardEventTypes, Scene ,Color4,MeshBuilder,Vector3,FreeCamera, StandardMaterial,HemisphericLight, Color3,ShadowGenerator, ReflectiveShadowMap, DirectionalLight, GamepadManager, Gamepad, Mesh} from '@babylonjs/core';
import {GridMaterial} from "@babylonjs/materials";
import {Inspector} from "@babylonjs/inspector";
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import Etoile from './Etoile.js';
import Player from './Player.js';
import Planet from './Planet.js';
import { GlobalManager } from './GlobalManager.js';
import Object3D from './Object3D.js';
import { CreateAudioEngineAsync, ImportMeshAsync } from 'babylonjs';
import EtoileManager from './EtoileManager.js';
import * as GUI from '@babylonjs/gui';

var DEBUG_MODE = false; // Set to true to enable debug mode

export default class Game {
    
    engine;
    canvas;
    scene;

    camera;
    light;
    sky;
    axesWorld;

    startTimer;
    
    player;
    planet;
    dist;

    gui;

    inputMap = {};
    actions = {}

    sunLight;
    
    etoileManager;

    gamepadManager;
    gamepad;

    constructor(engine,canvas) {
        GlobalManager.engine = engine;
        GlobalManager.canvas = canvas;
    }

    async init() {
        GlobalManager.engine.displayLoadingUI();
        await this.createScene();
        this.initKeyboard();
        this.initGamepad();
        this.planet = new Planet(50,9.8,new Vector3(0,0,0))
        await this.planet.init()
        this.player = new Player();   
        await this.player.init();
        this.etoileManager = new EtoileManager();
        await this.etoileManager.init(this.planet);
        // a faire gerer pas le GameManager ???
        this.initGUI(this.player.score);
        GlobalManager.engine.hideLoadingUI();
    }

    getDistPlanetPlayer(playerPosition, planetPosition) {
        return playerPosition.subtract(planetPosition);
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
            this.handleGamepadInput();
             
            this.actions = {};
            GlobalManager.scene.render(); 
            
        })
    }
    
    update(){
        //console.log("inputMap in Update of Game :"+this.inputMap)
        
        //rajouter les updates de toutes les entités
        this.player.update(this.inputMap,this.actions,this.planet);
        this.etoileManager.update(this.player);
        //this.planet.update();
        this.onScoreUpdate(this.player.score.getScore());   
        this.startTimer += GlobalManager.deltaTime;
        //console.log(this.getDistPlanetPlayer(this.player.mesh.position,this.planet.position))
        //GlobalManager.lightTranslation();
        
        //console.log("etoile",this.etoile)
        
    }

    async createScene() {
        
        GlobalManager.scene = new Scene(GlobalManager.engine);
        GlobalManager.scene.clearColor = new Color4(0,0,0,0);
        const skyBox = await SceneLoader.ImportMeshAsync("", "/assets/", "skyBox.glb", GlobalManager.scene);
        
        GlobalManager.audioEngine = await CreateAudioEngineAsync();
        
        
        

        // Create a directional light to simulate the sun
        this.sunLight = new DirectionalLight("sunLight", new Vector3(0, -10, -10), GlobalManager.scene);
        this.sunLight.position = new Vector3(0, 10, 0);
        this.sunLight.intensity = 1;
        GlobalManager.addLight(this.sunLight);
        
        let shadowGenSun = new ShadowGenerator(2048, this.sunLight);
        shadowGenSun.useExponentialShadowMap = true;
        shadowGenSun.bias = 0.01;
        shadowGenSun.normalBias = 0.02;

        GlobalManager.addShadowGenerator(shadowGenSun);
        /*
        this.sky = MeshBuilder.CreateSphere("sky", {diameter: 1000, sideOrientation : Mesh.BACKSIDE }, GlobalManager.scene);
        const skyMaterial = new GridMaterial("skyMaterial", GlobalManager.scene);
        skyMaterial.mainColor = new Color3(0, 0.5, 0.5);
        this.sky.material = skyMaterial;
        */
        
        
        

        if (DEBUG_MODE){
            
            this.axesWorld = new AxesViewer(GlobalManager.scene, 4);
               
        }
        
    }
    
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

    initGamepad() {
        this.gamepadManager = new GamepadManager();
        console.log("GamepadManager created");
        this.gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
            console.log("Gamepad connected: " + gamepad.type);
            if (gamepad.type === Gamepad.DUALSHOCK) {
                this.gamepad = gamepad;
                console.log("Gamepad connected: " + gamepad.id);
            }
        });
    }

    handleGamepadInput() {
        if (this.gamepad) {
            const leftStick = this.gamepad.leftStick;
            const rightStick = this.gamepad.rightStick;
            
            // Handle gamepad input
            this.inputMap["leftStickX"] = leftStick.x;
            this.inputMap["leftStickY"] = leftStick.y;
            this.inputMap["rightStickX"] = rightStick.x;
            this.inputMap["rightStickY"] = rightStick.y;
            //console.log("leftStickX : "+leftStick.x + " leftStickY : "+leftStick.y);

            const buttonCross = this.gamepad.buttonCross;
            const buttonCircle = this.gamepad.buttonCircle;
            const buttonSquare = this.gamepad.buttonSquare;
            const buttonTriangle = this.gamepad.buttonTriangle;

            this.actions["buttonX"] = buttonCross;
            this.actions["buttonCircle"] = buttonCircle;
            this.actions["buttonSquare"] = buttonSquare;
            this.actions["buttonTriangle"] = buttonTriangle;
            //console.log("buttonX : "+this.actions["buttonX"] + " buttonCircle : "+this.actions["buttonCircle"]);
            
        }
    }

    initGUI() {
        this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const panel = new GUI.StackPanel("panel");
        panel.width = "220px";
        panel.height = "100px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.gui.addControl(panel);
        
        const textBlock = new GUI.TextBlock("text", "Score : " + this.player.score.getScore());
        textBlock.color = "white";
        textBlock.fontSize = 24;
        panel.addControl(textBlock);
    }

    onScoreUpdate(score) {
        const textBlock = this.gui.getControlByName("text");
        if (textBlock) {
            textBlock.text = "Score : " + score;
        }
    }   

    getPlanetPosition(){
        return this.planet.position
    }
    

}
export {DEBUG_MODE};