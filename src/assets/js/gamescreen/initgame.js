import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import {initEndGame} from "./end-game.js";
import { fetchPlayers} from "../gamescreen/player.js";

function initGame() {
   fetchDevelopmentCards();
   initEndGame();
    fetchPlayers();
}

initGame();