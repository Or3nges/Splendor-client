import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import {fetchPlayers} from "./player.js";

const gameLoopDelay = 2000;
const playerName = StorageAbstractor.loadFromStorage("playerName");
const gameId = StorageAbstractor.loadFromStorage("gameId");

function initTurnIndication(){
    gameLoop();
}

function gameLoop(){
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`).then(data => {
        setTimeout(fetchPlayers, 500);
        if (data.currentPlayer === playerName) {
        } else {
            setTimeout(gameLoop, gameLoopDelay);
        }
    });
}

export {initTurnIndication};