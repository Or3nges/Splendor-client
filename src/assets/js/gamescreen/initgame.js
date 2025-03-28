import {fetchDevelopmentCards} from "../gamescreen/rendercards.js";
import {initPopup, initBuyOption} from "./popup.js";
import { fetchPlayers} from "../gamescreen/player.js";

function initGame() {
   fetchDevelopmentCards();
  initPopup();
    fetchPlayers();
    initBuyOption()
}

initGame();