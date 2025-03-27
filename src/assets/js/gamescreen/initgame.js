import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import { fetchPlayers} from "../gamescreen/player.js";

function initGame() {
   fetchDevelopmentCards();
    fetchPlayers();
}

initGame();