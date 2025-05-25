import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import {fetchPlayers} from "./player.js";
import {retrieveTokens, updateTakeTokensButton, setupTokenClickEvents} from "./tokens.js";
import {initNobles} from "./nobles.js";
import {addCardEventListeners, addReserveCardEventListeners, renderDevelopmentCards} from "./render-cards.js";

const GameLoopDelay = 2000;
const setupTime = 200;
const playerName = StorageAbstractor.loadFromStorage("playerName");
const gameId = StorageAbstractor.loadFromStorage("gameId");

function initTurnIndication(){
    gameLoop();
}

function gameLoop(){
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`).then(data => {
        fetchPlayers();
        if (data.game.state === "COMPLETED") {
            initializeEndScreen();
        }
        renderDevelopmentCards(gameId);
        if ( isCurrentPlayerTurn(data.game.currentPlayer)) {
            setTimeout(setupTokenClickEvents, setupTime);
            retrieveTokens();
            updateTakeTokensButton(isCurrentPlayerTurn(data.game.currentPlayer));
            setTimeout(addCardEventListeners, setupTime);
            setTimeout(addReserveCardEventListeners, setupTime);
        } else {
            retrieveTokens();
            initNobles();
            updateTakeTokensButton(isCurrentPlayerTurn(data.game.currentPlayer));
            setTimeout(gameLoop, GameLoopDelay);
        }
    });
}

function isCurrentPlayerTurn(currentplayer) {
    return currentplayer === playerName;
}

function initializeEndScreen() {
    window.location.href = "./html/endscreen.html";
}

export {initTurnIndication};