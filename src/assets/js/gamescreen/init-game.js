import {renderDevelopmentCards} from "../gamescreen/render-cards.js";
import {fetchGems} from "./player.js";
import {initTurnIndication} from "./turn-indication.js";
import {initPopup, initBuyOption} from "./popup.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {retrieveTokens} from "../gamescreen/tokens.js";

const gameId = storageAbstractor.loadFromStorage("gameId");

function initGame() {
   renderDevelopmentCards(gameId);
   initPopup();
   fetchGems();
   initTurnIndication();
   initBuyOption();
   retrieveTokens(gameId);
}

initGame();