import {KeyboardEventTypes, GamepadManager, Gamepad} from '@babylonjs/core';
import {Inspector} from "@babylonjs/inspector";
import { GlobalManager } from './GlobalManager.js';
import * as GUI from '@babylonjs/gui';
import Level1 from './levels/Level1.js';
import Level2 from './levels/Level2.js';
import { SoundManager } from './SoundManager.js';

var DEBUG_MODE = false; // Set to true to enable debug mode


const music = "/assets/sounds/1-25. Super Mario Galaxy.mp3"


export default class Game {
    
    engine;
    canvas;
    scene;

    startTimer;
    
    gui;

    inputMap = {};
    actions = {}

    gamepadManager;
    gamepad;

    currentLevel;   

    constructor(engine,canvas) {
        GlobalManager.engine = engine;
        GlobalManager.canvas = canvas;
    }

    async init() {
        GlobalManager.engine.displayLoadingUI();
        this.currentLevel = new Level1(); 
        await this.currentLevel.init();
        SoundManager.init();        
        this.initKeyboard();
        this.initGamepad();
        // a faire gerer pas le GameManager ???
        //this.initGUI(this.currentLevel.player.score);
        GlobalManager.initGUI(this.currentLevel.player.score.getScore());
        GlobalManager.engine.hideLoadingUI();
        SoundManager.playMusic("music",music)
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
            this.handleGamepadInput();
            this.update();
            
            this.actions = {};
            GlobalManager.scene.render(); 
            
        })
    }
    
    update(){
        //console.log("inputMap in Update of Game :"+this.inputMap)
        
        //rajouter les updates de toutes les entités
        this.currentLevel.player.update(this.inputMap,this.actions,this.currentLevel.currentPlanet);
        this.currentLevel.update(this.currentLevel.player);
        GlobalManager.onScoreUpdate(this.currentLevel.player.score.getScore());   
        this.startTimer += GlobalManager.deltaTime;
        
        //changement de niveau simple
        
        if(this.currentLevel.player.score.getScore() == 3000){
            this.gotoNextLevel();
        }
        //console.log(this.getDistPlanetPlayer(this.currentLevel.player.mesh.position,this.planet.position))
        //GlobalManager.lightTranslation();
        //console.log(SoundManager)
        //console.log("etoile",this.etoile)
        
    }

    
    initKeyboard(){
        GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN :
                    this.inputMap[kbInfo.event.code] = true;
                    console.log("keyDOWN"+kbInfo.event.code);
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

            //const buttonCross = this.gamepad.buttonCross;
            //console.log(buttonCross)
            const buttonCircle = this.gamepad.buttonCircle;
            const buttonSquare = this.gamepad.buttonSquare;
            const buttonTriangle = this.gamepad.buttonTriangle;

            this.actions["buttonx"] = this.gamepad.buttonCross;
            this.actions["buttonCircle"] = buttonCircle;
            this.actions["buttonSquare"] = buttonSquare;
            this.actions["buttonTriangle"] = buttonTriangle;
            //console.log("buttonX : "+this.actions["buttonX"] + " buttonCircle : "+this.actions["buttonCircle"]);
            //console.log(this.actions)
        }
    }

    gotoNextLevel() {
        this.currentLevel.dispose();
        this.currentLevel = new Level2(); 
        this.currentLevel.init();
        this.startTimer = 0;
    }
    
}
export {DEBUG_MODE};