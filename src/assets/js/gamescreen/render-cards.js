import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import { retrieveTokens } from "./tokens.js";
import { fetchPlayers } from "./player.js";

const MAX_RESERVED_CARDS = 3;

function createCardTemplate(card) {
    const figure = document.createElement('figure');

    const cardTypeImg = document.createElement('img');
    cardTypeImg.id = 'cardType';
    cardTypeImg.src = '';
    cardTypeImg.alt = 'Card type';
    cardTypeImg.title = 'Card type';

    const cardTokenImg = document.createElement('img');
    cardTokenImg.id = 'cardToken';
    cardTokenImg.src = '';
    cardTokenImg.alt = 'Card token';
    cardTokenImg.title = 'Card token';

    const costUl = document.createElement('ul');
    costUl.id = 'cost';

    figure.appendChild(cardTypeImg);
    figure.appendChild(cardTokenImg);
    figure.appendChild(costUl);

    figure.setAttribute('data-card-level', card.level);
    figure.setAttribute('data-card-name', card.name);

    return figure;
}

function renderReservedCards(reservedCards) {
    const $reservedCardsContainer = document.querySelector("#reservedCardsContainer");
    $reservedCardsContainer.innerHTML = "";

    reservedCards.forEach(card => {
        const $template = createCardTemplate(card);
        populateCardDetails($template, card);

        const $popup = document.querySelector("#buy-or-reserve-option");
        addCardEventListeners($template, $popup);

        $reservedCardsContainer.appendChild($template);
    });
}

function renderDevelopmentCards(gameId) {
    const $cardsContainer = document.querySelector("#cardsContainer");
    if (!$cardsContainer) {
        console.error("#cardsContainer not found!");
        return;
    }

    while ($cardsContainer.firstChild) {
        $cardsContainer.removeChild($cardsContainer.firstChild);
    }

    fetchGame(gameId)
        .then(data => {
            data.market.forEach(tier => {
                handleTier(tier);
            });

            const currentPlayer = data.players.find(player => player.name === StorageAbstractor.loadFromStorage("playerName"));
            if (currentPlayer) {
                renderReservedCards(currentPlayer.reserve);
            }
        })
        .catch(error => {
            console.error("Error fetching game data:", error);
        });
}

function handleTier(tier) {
    tier.visibleCards.forEach(card => {
        displayDevelopmentCards(card);
    });
}

function findCard(tier) {
    return allDevelopmentCards.filter(tierLevel => tier === tierLevel.level)[0];
}

function isCurrentPlayerTurn() {
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    const playerName = StorageAbstractor.loadFromStorage("playerName");

    return CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => {
            const currentPlayer = game.currentPlayer;
            return playerName === currentPlayer;
        })
        .catch(error => {
            console.error("Error fetching current player:", error);
            return false;
        });
}


function handleReserveButtonClick($template, $popup) {
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    const playerName = StorageAbstractor.loadFromStorage("playerName");

    fetchGameData(gameId, playerName)
        .then(gameData => processReserve(gameData, $template, $popup, gameId, playerName))
        .catch(error => handleReserveError(error, $popup));
}

function processReserve(gameData, $template, $popup, gameId, playerName) {
    const { game, currentPlayer } = gameData;

    if (!canReserveCard(currentPlayer)) {
        alert("You cannot reserve more than 3 cards.");
        return null;
    }

    const cardDetails = getCardDetails($template);

    if (isAlreadyReserved(currentPlayer, cardDetails)) {
        alert("You have already reserved this card.");
        return null;
    }

    const cardToReserve = findCardInMarket(game, cardDetails.level, cardDetails.name);
    if (!cardToReserve) {
        console.error("Card not found in market to reserve:", cardDetails.name);
        alert("Error: Could not find the selected card in the market.");
        return null;
    }

    const takeGold = determineGoldAvailability(currentPlayer, game);

    return sendReserveRequest(gameId, playerName, cardToReserve, takeGold)
        .then(result => handleReserveResult(result, $popup, gameId));
}

function canReserveCard(currentPlayer) {
    return !(currentPlayer.reserve && currentPlayer.reserve.length >= MAX_RESERVED_CARDS);
}

function getCardDetails($template) {
    const cardLevel = parseInt($template.getAttribute('data-card-level'));
    const cardName = $template.getAttribute('data-card-name');
    return { level: cardLevel, name: cardName };
}

function isAlreadyReserved(currentPlayer, cardDetails) {
    return currentPlayer.reserve && currentPlayer.reserve.some(
        reservedCard => reservedCard.name === cardDetails.name && reservedCard.level === cardDetails.level
    );
}
function determineGoldAvailability(currentPlayer, game) {
    const currentTokenCount = Object.values(currentPlayer.tokens || {}).reduce((sum, count) => sum + count, 0);
    const goldAvailable = game.unclaimedTokens && game.unclaimedTokens.Gold > 0;
    const canTakeGold = currentTokenCount < 10;
    return goldAvailable && canTakeGold;
}

function handleReserveResult(result, $popup, gameId) {
    if (result) {
        closePopup($popup);
        retrieveTokens(gameId);
        renderDevelopmentCards(gameId);
        fetchPlayers();
    }
}

function handleReserveError(error, $popup) {
    console.error("Error handling reserve button click:", error);
    closePopup($popup);
}
function calculatePayment(cardCost, playerTokens, playerBonuses) {
    const payment = {};
    const neededGold = calculateNeededGold(cardCost, playerTokens, playerBonuses, payment);

    if (!validateGoldTokens(neededGold, playerTokens)) {
        return null;
    }

    if (neededGold > 0) {
        payment['Gold'] = neededGold;
    }

    if (!validatePaymentTokens(payment, playerTokens)) {
        return null;
    }

    return payment;
}

function calculateNeededGold(cardCost, playerTokens, playerBonuses, payment) {
    let neededGold = 0;

    for (const gemType in cardCost) {
        const cost = cardCost[gemType];
        const bonus = playerBonuses[gemType] || 0;
        let needed = cost - bonus;

        if (needed > 0) {
            const availableTokens = playerTokens[gemType] || 0;
            const tokensToUse = Math.min(needed, availableTokens);

            if (tokensToUse > 0) {
                payment[gemType] = tokensToUse;
                needed -= tokensToUse;
            }

            if (needed > 0) {
                neededGold += needed;
            }
        }
    }

    return neededGold;
}

function validateGoldTokens(neededGold, playerTokens) {
    const availableGold = playerTokens['Gold'] || 0;
    if (neededGold > availableGold) {
        console.error("Insufficient funds: Not enough gold tokens.");
        alert("Insufficient funds to buy this card (not enough gold).");
        return false;
    }
    return true;
}

function validatePaymentTokens(payment, playerTokens) {
    for (const gemType in payment) {
        const required = payment[gemType];
        const available = playerTokens[gemType] || 0;
        if (available < required) {
            console.error(`Insufficient funds: Not enough ${gemType} tokens. Required: ${required}, Available: ${available}`);
            alert(`Insufficient funds to buy this card (not enough ${gemType} tokens).`);
            return false;
        }
    }
    return true;
}

function handleBuyButtonClick($template, $popup) {
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const cardLevel = parseInt($template.getAttribute('data-card-level'));
    const cardName = $template.getAttribute('data-card-name');

    fetchGameData(gameId, playerName)
        .then(gameData => processGameData(gameData, cardLevel, cardName, gameId, playerName))
        .then(buyResult => handleBuyResult(buyResult, $popup, gameId))
        .catch(error => handleBuyError(error, $popup));
}

function processGameData(gameData, cardLevel, cardName, gameId, playerName) {
    const { game, currentPlayer } = gameData;
    const cardToBuy = findCardToBuy(game, currentPlayer, cardLevel, cardName);

    if (!cardToBuy) {
        console.error("Card details not found for:", cardName, "Level:", cardLevel);
        alert("Could not find the card details.");
        return;
    }

    const playerBonuses = calculateAllBonuses(currentPlayer, game);
    const payment = calculatePayment(cardToBuy.cost, currentPlayer.tokens, playerBonuses);

    if (!payment) {
        return;
    }

    const requestBody = {
        development: { name: cardToBuy.name },
        payment: payment,
        fromReserve: cardToBuy.boughtFromReserve
    };

    return CommunicationAbstractor.fetchFromServer(
        `/games/${gameId}/players/${playerName}/developments`,
        'POST',
        requestBody
    );
}

function findCardToBuy(game, currentPlayer, cardLevel, cardName) {
    let cardToBuy = findCardInMarket(game, cardLevel, cardName);
    let boughtFromReserve = false;

    if (!cardToBuy) {
        cardToBuy = currentPlayer.reserve && currentPlayer.reserve.find(card => card.name === cardName && card.level === cardLevel);
        if (cardToBuy) {
            boughtFromReserve = true;
        }
    }

    if (cardToBuy) {
        cardToBuy.boughtFromReserve = boughtFromReserve;
    }

    return cardToBuy;
}

function calculateAllBonuses(currentPlayer, game) {
    let bonuses = {};

    if (currentPlayer.bonuses && typeof currentPlayer.bonuses === 'object') {
        bonuses = {...currentPlayer.bonuses};
        console.log("Using pre-calculated bonuses:", bonuses);
        return bonuses;
    }

    if (currentPlayer.built && Array.isArray(currentPlayer.built)) {
        currentPlayer.built.forEach(card => {
            if (card && card.bonus) {
                bonuses[card.bonus] = (bonuses[card.bonus] || 0) + 1;
            }
        });
        console.log("Bonuses from built cards:", bonuses);
    }

    if (currentPlayer.developments && Array.isArray(currentPlayer.developments)) {
        currentPlayer.developments.forEach(dev => {
            if (dev && dev.bonus) {
                bonuses[dev.bonus] = (bonuses[dev.bonus] || 0) + 1;
            }
        });
    }

    return bonuses;
}

function calculatePlayerBonuses(developments) {
    const playerBonuses = {};
    const devArray = developments || [];

    devArray.forEach(dev => {
        if (dev && dev.bonus) {
            playerBonuses[dev.bonus] = (playerBonuses[dev.bonus] || 0) + 1;
        }
    });

    return playerBonuses;
}

function handleBuyResult(buyResult, $popup, gameId) {
    closePopup($popup);
    retrieveTokens(gameId);
    fetchPlayers();
    renderDevelopmentCards(gameId);
}

function handleBuyError(error, $popup) {
    console.error("Error buying card:", error);
    alert(`Failed to buy card: ${error.message || error}`);
    closePopup($popup);
}


function fetchGameData(gameId, playerName) {
    return CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => {
            const currentPlayer = game.players.find(player => player.name === playerName);
            if (!currentPlayer) {
                console.error(`Could not find player with name ${playerName} in game data!`);
            }
            if (!currentPlayer.tokens) {
                console.warn(`currentPlayer object for ${playerName} is missing the 'tokens' property!`, JSON.parse(JSON.stringify(currentPlayer)));
            }
            return { game, currentPlayer };
        })
        .catch(error => {
            console.error(`Error fetching game data in fetchGameData for game ${gameId}:`, error);
            throw error;
        });
}

function findCardInMarket(game, cardLevel, cardName) {
    const marketTier = game.market.find(tier => tier.level === cardLevel);
    if (!marketTier) {
        console.warn("Market tier not found for level:", cardLevel);
        return null;
    }
    return marketTier.visibleCards.find(card => card.name === cardName);
}

function sendReserveRequest(gameId, playerName, cardToReserve, takeGold) {
    const requestBody = {
        development: { name: cardToReserve.name },
        takeGold: takeGold
    };

    return CommunicationAbstractor.fetchFromServer(
        `/games/${gameId}/players/${playerName}/reserve`,
        'POST',
        requestBody
    )
        .catch(error => {
            console.error("Error in sendReserveRequest:", error);
            alert(`API Error reserving card: ${error.message || error}`);
            throw error;
        });
}

function closePopup($popup) {
    document.querySelectorAll("#gameScreen div figure, #reservedCards figure").forEach(cardElement => {
        cardElement.classList.remove("selected");
    });
    $popup.style.display = "none";
}

function selectCard($template, $popup) {
    document.querySelectorAll("#gameScreen div figure").forEach(cardElement => {
        cardElement.classList.remove("selected");
    });
    $template.classList.add("selected");
    $popup.style.display = "block";
}