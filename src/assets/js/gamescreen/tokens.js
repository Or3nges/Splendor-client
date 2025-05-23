import {createLiElement, fetchGame, findGemByName, findGemByTokenId} from "../util.js";
import {fetchFromServer} from "../data-connector/api-communication-abstractor.js";
import {loadFromStorage} from "../data-connector/local-storage-abstractor.js";
import {initTurnIndication} from "./turn-indication.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";

document.querySelector('#confirm-token-selection').addEventListener('click', confirmTokenSelection);

let selectedTokens = {};
let availableTokens = {};
let isMyTurn = false;

const TOKEN_SELECTED_MAX = 3;

function retrieveTokens() {
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    fetchGame(gameId)
        .then(data => {
            availableTokens = data.game.unclaimedTokens.tokensMap;
            isMyTurn = data.game.currentPlayer === loadFromStorage("playerName");
            displayTokens(data.game.unclaimedTokens.tokensMap);
        });
}

function displayTokens(tokens) {
    const $tokensContainer = document.querySelector("#tokens ul");
    $tokensContainer.innerHTML = '';
    renderTokensList(tokens, $tokensContainer);
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
    const $tokensContainer = document.querySelector("#tokens ul");
    $tokensContainer.querySelectorAll("#tokens ul li").forEach(li => {
        const tokenId = li.classList[0];
        const token = findGemByTokenId(tokenId);
        if (token && token.name) {
            const tokenName = token.name;
            li.setAttribute("data-token", tokenName);

            if (tokenName !== "GOLD") {
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
    addTokenToSelection(tokenName);
    renderSelectedTokens();
}

function isValidToken(tokenName) {
    return tokenName && tokenName !== "Gold";
}

function addTokenToSelection(tokenName) {
    const differentSelectedTypes = Object.keys(selectedTokens).length;
    const totalSelectedCount = Object.values(selectedTokens).reduce((sum, count) => sum + count, 0);
    if (totalSelectedCount < TOKEN_SELECTED_MAX) {
        if (differentSelectedTypes <= 1 && totalSelectedCount !== 2) {
            if ((differentSelectedTypes <= 1 && selectedTokens[tokenName] <= 1) || selectedTokens[tokenName] === undefined) {
                selectedTokens[tokenName] = (selectedTokens[tokenName] || 0) + 1;
            }
        } else if (differentSelectedTypes !== 1) {
            selectedTokens[tokenName] = 1;
        }
    }
}

function prepareSelectedTokenImage(tokenName) {
    const token = findGemByName(tokenName);
    return `<img class="selectable-token" src=${token.img} alt=${token.name} height="306" width="306">`;
}

function renderSelectedTokens() {
    const $selectedTokenDiv = document.querySelector("div#bottomrow article div#selectedTokens");
    $selectedTokenDiv.innerHTML = '';
    const totalSelectedCount = Object.values(selectedTokens).reduce((sum, count) => sum + count, 0);
    for (const selectedToken in selectedTokens) {
            for (let i = 0; i < selectedTokens[selectedToken]; i++) {
                $selectedTokenDiv.insertAdjacentHTML('beforeend', prepareSelectedTokenImage(selectedToken));
            }
    }
    for (let i = 0; i < TOKEN_SELECTED_MAX - totalSelectedCount; i++) {
        $selectedTokenDiv.insertAdjacentHTML('beforeend', `<img src="media/grey_token.png" alt="grey token" height="306" width="306">`);
    }
    addEventListenersToSelectedTokens($selectedTokenDiv);
}

function addEventListenersToSelectedTokens($selectedTokenDiv) {
    const selectedTokensList = $selectedTokenDiv.querySelectorAll("img");
    selectedTokensList.forEach(token => {
        token.addEventListener("click", removeToken);
    });
}

function removeToken(e) {
    e.preventDefault();
    const tokenName = e.currentTarget.alt;

    if (selectedTokens[tokenName] === 1) {
        delete selectedTokens[tokenName];
    } else if (selectedTokens[tokenName] === 2) {
        selectedTokens[tokenName] = 1;
    }
    renderSelectedTokens();
}

function updateTakeTokensButton(isMyTurn) {
    const button = document.querySelector('#confirm-token-selection');
    if (isMyTurn) {
        button.disabled = false;
    }else {
        button.disabled = true;
    }
}

function confirmTokenSelection() {
    const gameId = loadFromStorage("gameId");
    const playerName = loadFromStorage("playerName");
    console.log("Selected tokens:", selectedTokens);

    sendSelectedTokens(gameId, playerName);
}

function sendSelectedTokens(gameId, playerName) {
    const requestBody = {take: selectedTokens};
    fetchFromServer(`/games/${gameId}/players/${playerName}/tokens`, "PATCH", requestBody)
        .then(() => {
            initTurnIndication();
            selectedTokens = {};
            renderSelectedTokens();
            retrieveTokens();
        })
        .catch(error => {
            alert("Error sending selected tokens");
        });
}


export {retrieveTokens, updateTakeTokensButton, setupTokenClickEvents};
