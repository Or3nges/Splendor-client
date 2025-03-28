import {fetchDevelopmentCards} from "./render-cards.js";
import {fetchGems} from "./player.js";
import {initTurnIndication} from "./turn-indication.js";
import {initPopup} from "./popup.js";

function initGame() {
   fetchDevelopmentCards();
   initPopup();
   fetchGems();
   initTurnIndication();
}

initGame();