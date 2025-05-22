import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import {fetchPlayers} from "./player.js";
import {retrieveTokens, updateTakeTokensButton, setupTokenClickEvents} from "./tokens.js";
import {initNobles} from "./nobles.js";
import {renderDevelopmentCards} from "./render-cards.js";

const GameLoopDelay = 2000;
const playerName = StorageAbstractor.loadFromStorage("playerName");
const gameId = StorageAbstractor.loadFromStorage("gameId");

function initTurnIndication(){
    gameLoop();
}

function gameLoop(){
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`).then(data => {
        fetchPlayers();
        if ( isCurrentPlayerTurn(data.game.currentPlayer)) {
            setTimeout(setupTokenClickEvents, 200)
            fetchPlayers();
            retrieveTokens();
            updateTakeTokensButton(isCurrentPlayerTurn(data.game.currentPlayer));
        } else {
            retrieveTokens(gameId);
            initNobles();
            renderDevelopmentCards(gameId);
            updateTakeTokensButton(isCurrentPlayerTurn(data.game.currentPlayer));
            setTimeout(gameLoop, GameLoopDelay);
        }
    });
}

function isCurrentPlayerTurn(currentplayer) {
    console.log(currentplayer === playerName);
    return currentplayer === playerName;
}

export {initTurnIndication};