import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import {initPopup} from "./end-game.js";
import { fetchPlayers} from "../gamescreen/player.js";

function initGame() {
   fetchDevelopmentCards();
  initPopup();
    fetchPlayers();
}

initGame();