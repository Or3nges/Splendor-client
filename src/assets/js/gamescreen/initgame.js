import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import {initEndGame} from "./end-game.js";

function initGame() {
   fetchDevelopmentCards();
   initEndGame();
}

initGame();