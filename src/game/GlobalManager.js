import {} from '@babylonjs/core';


class GlobalManager {
   
    engine;
    canvas;
    scene;
    camera = [];

    shadowGenerator = [];

    deltaTime;
    constructor() {

   }
   
   //singleton
   static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] || new this());    
   }

   init(engine,canvas){
        this.canvas = canvas;
        this.engine = engine;
   }

   update(){
        this.deltaTime = this.engine.getDeltaTime() / 1000.0; 
   }

}

const {instance} = GlobalManager;
export {instance as GlobalManager};