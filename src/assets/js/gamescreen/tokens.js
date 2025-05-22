import {createLiElement, fetchGame, findGemByName, findGemByTokenId} from "../util.js";
import {fetchFromServer} from "../data-connector/api-communication-abstractor.js";
import {loadFromStorage} from "../data-connector/local-storage-abstractor.js";
import {fetchPlayers} from './player.js';

document.querySelector('#confirm-token-selection').addEventListener('click', confirmTokenSelection);

let selectedTokens = {};
let availableTokens = {};
let isMyTurn = false;

const TOKEN_SELECTED_MAX = 3;

function isCurrentPlayerTurn() {
    const gameId = loadFromStorage("gameId");
    const playerName = loadFromStorage("playerName");

    return fetchGame(gameId)
        .then(game => {
            return game.game.currentPlayer === playerName;
        })
        .catch(() => {
            return false;
        });
}

function getCurrentPlayerTokens(gameId, playerName) {
    if (!gameId || !playerName) {
        return null;
    }

    return fetchGame(gameId)
        .then(gameData => {
            const player = gameData.game.players.find(p => p.name === playerName);
            if (player && player.purse.tokensMap !== undefined) {
                return player.purse.tokensMap;
            }
            return null;
        })
        .catch(() => null);
}


function retrieveTokens(gameId) {
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
    setupTokenClickEvents();

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
        const token = findGemByTokenId(tokenId);

        if (token && token.name) {
            const tokenName = token.name;
            li.setAttribute("data-token", tokenName);

            if (isMyTurn && tokenName !== "GOLD") {
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
    const $selectedTokenDiv = document.querySelector("div#bottomrow article div#selectedTokens");

    if (!isValidToken(tokenName)) return;
    addTokenToSelection(tokenName);
    renderSelectedTokens($selectedTokenDiv);
    updateTakeTokensButton();
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

function renderSelectedTokens($selectedTokenDiv) {
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
        selectedTokens = Object.fromEntries(
            Object.entries(selectedTokens).filter(([key]) => key !== tokenName));
    }else if (selectedTokens[tokenName] > 1) {
        selectedTokens[tokenName] -= 1;
    }
    /*
    if (obj[key] === 1) {
        delete obj[key];
    } else if (obj[key] === 2) {
        obj[key] = 1;
    }*/
    renderSelectedTokens(document.querySelector("div#bottomrow article div#selectedTokens"));
}

function updateTakeTokensButton() {
    const button = document.querySelector('#confirm-token-selection');
    if (!button) return;

    if (!isMyTurn) {
        button.disabled = true;
        return;
    }

    const totalSelectedCount = Object.values(selectedTokens).reduce((sum, count) => sum + count, 0);
    const differentSelectedTypes = Object.keys(selectedTokens).length;

    let isValidSelection = false;
    if (totalSelectedCount === TOKEN_SELECTED_MAX && differentSelectedTypes === TOKEN_SELECTED_MAX) {
        isValidSelection = true;
    }
    if (totalSelectedCount === 2 && differentSelectedTypes === 1 && Object.values(selectedTokens)[0] === 2) {
        isValidSelection = true;
    }

    button.disabled = !isValidSelection;
}

function confirmTokenSelection() {
    const button = document.querySelector('#confirm-token-selection');
    button.disabled = true;

    const gameId = loadFromStorage("gameId");
    const playerName = loadFromStorage("playerName");

    if (!validatePlayerAndGameInfo(gameId, playerName)) return;

    isCurrentPlayerTurn().then(stillMyTurn => {
        if (!handleTurnValidation(stillMyTurn, gameId)) return;

        getCurrentPlayerTokens(gameId, playerName)
            .then(currentTokens => {
                if (!handleCurrentTokensValidation(currentTokens)) return;

                if (!validateTokenLimits(currentTokens, selectedTokens)) return;

                sendSelectedTokens(gameId, playerName);
            });
    });
}

function validatePlayerAndGameInfo(gameId, playerName) {
    if (!gameId || !playerName) {
        alert("Error: Missing game or player information. Cannot take tokens.");
        updateTakeTokensButton();
        return false;
    }
    return true;
}

function handleTurnValidation(stillMyTurn, gameId) {
    if (!stillMyTurn) {
        alert("It's no longer your turn!");
        retrieveTokens(gameId);
        fetchPlayers();
        return false;
    }
    return true;
}

function handleCurrentTokensValidation(currentTokens) {
    if (currentTokens === null) {
        alert("Error checking player tokens. Cannot proceed.");
        updateTakeTokensButton();
        return false;
    }
    return true;
}

function validateTokenLimits(currentTokens, selectedTokensParam) {
    const currentTotal = Object.values(currentTokens).reduce((sum, count) => sum + count, 0);
    const selectedTotal = Object.values(selectedTokensParam).reduce((sum, count) => sum + count, 0);

    if (currentTotal + selectedTotal > 10) {
        alert(`Cannot take tokens. You have ${currentTotal} and taking ${selectedTotal} would exceed the limit of 10.`);
        updateTakeTokensButton();
        return false;
    }
    return true;
}

function sendSelectedTokens(gameId, playerName) {
    const requestBody = {take: selectedTokens};
    fetchFromServer(`/games/${gameId}/players/${playerName}/tokens`, "PATCH", requestBody)
        .then(() => {
            retrieveTokens(gameId);
            fetchPlayers();
        })
        .catch(() => {
            alert('Could not take tokens. Please try again.');
            updateTakeTokensButton();
        });
}


export {retrieveTokens, updateTakeTokensButton};
