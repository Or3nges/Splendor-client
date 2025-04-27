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

function setupTokenClickEvents() {
    document.querySelectorAll("#tokens ul li").forEach(li => {
        const tokenId = li.classList[0];
        const tokenName = findGemByTokenId(tokenId)?.name;
        if (tokenName) {
            li.setAttribute("data-token", tokenName);

            if (isMyTurn && tokenName !== "Gold") {
                li.addEventListener("click", selectToken);
                li.classList.add('selectable-token');
            } else {
                li.classList.add('unselectable-token');
            }
        }
    });
}

function selectToken(e) {
    const li = e.currentTarget;
    const tokenName = li.getAttribute("data-token");

    if (!isValidToken(tokenName)) return;

    if (isTokenAlreadySelected(tokenName)) {
        deselectToken(tokenName);
    } else {
        attemptTokenSelection(tokenName);
    }

    updateSelectionVisuals();
    updateTakeTokensButton();
}

function isValidToken(tokenName) {
    return tokenName && tokenName !== "Gold";
}

function isTokenAlreadySelected(tokenName) {
    return selectedTokens[tokenName] > 0;
}

function deselectToken(tokenName) {
    selectedTokens[tokenName]--;
    if (selectedTokens[tokenName] === 0) {
        delete selectedTokens[tokenName];
    }
}

function attemptTokenSelection(tokenName) {
    const initialCount = availableTokens[tokenName] || 0;
    const totalSelectedCount = getTotalSelectedCount();
    const differentSelectedTypes = getDifferentSelectedTypes();
    const selectionMade = trySpecialSelection(tokenName, initialCount, totalSelectedCount, differentSelectedTypes)
        || tryNormalSelection(tokenName, totalSelectedCount, differentSelectedTypes);

    if (!selectionMade) {
        console.log("Selection conditions not met.");
    }
}

function trySpecialSelection(tokenName, initialCount, totalSelectedCount, differentSelectedTypes) {
    if (initialCount >= 4) {
        if (totalSelectedCount === 0) {
            selectedTokens[tokenName] = 2;
            return true;
        } else if (totalSelectedCount === 1 && differentSelectedTypes === 1 && selectedTokens[tokenName] === 1) {
            selectedTokens[tokenName]++;
            return true;
        } else {
            console.log("Picked 2 tokens.");
        }
    }
    return false;
}

function tryNormalSelection(tokenName, totalSelectedCount, differentSelectedTypes) {
    const hasTwoSame = Object.values(selectedTokens).some(count => count === 2);

    if (!hasTwoSame && totalSelectedCount < TOKEN_SELECTED_MAX && differentSelectedTypes < TOKEN_SELECTED_MAX) {
        selectedTokens[tokenName] = 1;
        return true;
    }
    return false;
}

function getTotalSelectedCount() {
    return Object.values(selectedTokens).reduce((sum, count) => sum + count, 0);
}

function getDifferentSelectedTypes() {
    return Object.keys(selectedTokens).length;
}

function updateSelectionVisuals() {
    document.querySelectorAll("#tokens ul li").forEach(li => {
        const tokenName = li.getAttribute("data-token");
        const count = selectedTokens[tokenName] || 0;

        if (count > 0) {
            li.classList.add('selected');
            li.setAttribute('data-selection-count', count);
        } else {
            li.classList.remove('selected');
            li.removeAttribute('data-selection-count');
        }
    });
}