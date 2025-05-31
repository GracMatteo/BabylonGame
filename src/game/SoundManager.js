import { AudioEngine,Sound } from "@babylonjs/core";
import { GlobalManager } from "./GlobalManager";



class SoundManager {
    
    AudioEngine;

    sounds = new Map();

    constructor(){

    }
    
    static get instance() {
        return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] || new this());    
    }
    
    init(){
        this.AudioEngine = new AudioEngine();
        //console.log("AudioEngine create",this.AudioEngine)
    }

    async playSound(name,url){
        if(this.sounds.has(name)){this.stopSound(name)}
        const sound = new Sound(
            name,
            url,
            GlobalManager.scene,
            () => sound.play(),
            {loop:false, volume: 0.8}
        );
        this.sounds.set(name, sound);
    }

    /*
        permet de mettre une musique a jouer en loop 
    */
    async playMusic(name,url){
         if(this.sounds.has(name)){this.stopSound(name)}
        const music = new Sound(
            name,
            url,
            GlobalManager.scene,
            () => music.play(),
            {loop:true, volume: 0.2}
        );
        this.sounds.set(name, music);
    }


    stopSound(name){
        const sound = this.sounds.get(name);
        if (!sound) {
        console.warn(`SoundManager: pas de son nommé "${name}" à arrêter.`);
        return;
        }
        sound.stop();
        sound.dispose();
        this.sounds.delete(name);
    }

}

const {instance} = SoundManager;
export {instance as SoundManager};