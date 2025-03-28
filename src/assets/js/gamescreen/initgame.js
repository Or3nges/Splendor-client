import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import {initPopup} from "./popup.js";
import { fetchPlayers} from "../gamescreen/player.js";

function initGame() {
   fetchDevelopmentCards();
  initPopup();
    fetchPlayers();
}

initGame();