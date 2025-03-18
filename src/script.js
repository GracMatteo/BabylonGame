import Game from "./game/Game.js";
import {Engine} from '@babylonjs/core';

import Ammo from 'ammo.js';

let engine;
let canvas;
let game;

window.onload = () => {
    canvas = document.getElementById("canvas");
    engine = new Engine(canvas, true);
    window.addEventListener("resize", function() {
        engine.resize();
    })


    game = new Game(engine, canvas);
    game.start();

};




