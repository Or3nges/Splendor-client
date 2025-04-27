import {fetchGame} from "../util.js";

import {loadFromStorage} from "../data-connector/local-storage-abstractor.js";


function isCurrentPlayerTurn() {
    const gameId = loadFromStorage("gameId");
    const playerName = loadFromStorage("playerName");

    if (!gameId || !playerName) return Promise.resolve(false);

    return fetchGame(gameId)
        .then(game => {
            return game.currentPlayer === playerName;
        })
        .catch(() => {
            return false;
        });
}

