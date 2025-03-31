import {renderDevelopmentCards} from "../gamescreen/rendercards.js";
import {initPopup} from "./popup.js";
import { fetchPlayers} from "../gamescreen/player.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {retrieveTokens} from "./tokens.js";

const gameId = storageAbstractor.loadFromStorage("gameId");

function initGame() {
  renderDevelopmentCards(gameId);
  initPopup();
  fetchPlayers();
  retrieveTokens(gameId);
}

initGame();