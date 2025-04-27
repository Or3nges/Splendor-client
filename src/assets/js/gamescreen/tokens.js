import {fetchGame, createLiElement, findGemByName, findGemByTokenId} from "../util.js";
import {fetchFromServer} from "../data-connector/api-communication-abstractor.js";
import {loadFromStorage} from "../data-connector/local-storage-abstractor.js";
import { fetchPlayers } from './player.js';

let selectedTokens = {};
let availableTokens = {};
let isMyTurn = false;

const TOKEN_SELECTED_MAX = 3;

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

function getCurrentPlayerTokens(gameId, playerName) {
    return fetchGame(gameId)
        .then(gameData => gameData.players.find(p => p.name === playerName)?.tokens ?? null) // moet optional chaining gebruiken anders geeft sonarqube een issue
        .catch(() => null);
}


function retrieveTokens(gameId) {
    fetchGame(gameId)
        .then(data => {
            availableTokens = {...data.unclaimedTokens};

            isMyTurn = data.currentPlayer === loadFromStorage("playerName");

            displayTokens(data.unclaimedTokens);
        });
}

function displayTokens(tokens) {
    const $tokensContainer = document.querySelector("#tokens ul");
    $tokensContainer.innerHTML = '';

    renderTokensList(tokens, $tokensContainer);
    setupTokenClickEvents();

    selectedTokens = {};
    updateSelectionVisuals();
    updateTakeTokensButton();
}

function renderTokensList(tokens, container) {
    Object.keys(tokens).forEach(tokenName => {
        const gem = findGemByName(tokenName);
        if (gem) {
            container.insertAdjacentHTML("beforeend", createLiElement(tokens[tokenName], gem.tokenId, tokenName));
        }
    });
}

