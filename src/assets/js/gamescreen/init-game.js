import {fetchDevelopmentCards} from "./render-cards.js";
import {initEndGame} from "./end-game.js";
import {fetchgems} from "./player.js";
import {initTurnIndication} from "./turn-indication.js";

function initGame() {
   fetchDevelopmentCards();
   initEndGame();
    fetchgems();
    initTurnIndication()
}

initGame();