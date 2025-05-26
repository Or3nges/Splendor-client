import {fetchGems} from "./player.js";
import {initTurnIndication} from "./turn-indication.js";
import {initNobles} from "./nobles.js";
import {initPopup, initBuyOption} from "./popup.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {retrieveTokens} from "./tokens.js";
import {fetchDevelopmentCards} from "./render-cards.js";

const gameId = storageAbstractor.loadFromStorage("gameId");

function initGame() {
   fetchDevelopmentCards(gameId);
   initPopup();
   fetchGems();
   initTurnIndication();
   initBuyOption();
   initNobles();
   retrieveTokens(gameId);
}

initGame();