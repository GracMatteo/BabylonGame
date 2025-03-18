
class SoundManager {
    
    Sound;

    constructor(){

    }
    
    static get instance() {
        return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] || new this());    
    }
    
    init(){

    }

    update(){

    }
}

const {instance} = SoundManager;
export {instance as SoundManager};