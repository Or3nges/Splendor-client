
import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import { retrieveTokens } from "./tokens.js";
import { fetchPlayers } from "./player.js";

const MAX_RESERVED_CARDS = 3;
//pas dit aan jitse
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
        addReserveCardEventListeners();
        $reservedCardsContainer.appendChild($template);
    });
}

function addReserveCardEventListeners() {
    const $reservedCards = document.querySelectorAll("#reservedCardsContainer figure");
    console.log($reservedCards)
    const $popup = document.querySelector("#buy-or-reserve-option");

    $reservedCards.forEach($figure => {
        $figure.addEventListener('click', () => {
            highlightSelectedCard($figure.getAttribute('data-card-name'));
            attachReserveAndBuyHandlers($figure, $popup);
            $popup.classList.remove('hidden');
        });
    });

    attachCloseButtonListener($popup);
}

//pas deze functie aan jitse
function renderDevelopmentCards(gameId) {
    const $cardsContainer = document.querySelector("#cardsContainer");
    if (!$cardsContainer) {
        console.error("#cardsContainer not found!");
        return;
    }

        $cardsContainer.innerHTML = "";

    fetchGame(gameId)
        .then(data => {
            for (const tierIndex in data.game.market.visibleCards) {
                const tier = data.game.market.visibleCards[tierIndex];
                handleTier(tier.cards);
            }
            /*
            data.game.market.forEach(tier => {
                console.log(tier);
                handleTier(tier);
            });*/
            const currentPlayer = data.game.players.find(player => player.name === StorageAbstractor.loadFromStorage("playerName"));
            if (currentPlayer) {
                renderReservedCards(currentPlayer.reserved);
            }
        })
        .catch(error => {
            console.error("Error fetching game data:", error);
        });
}

function handleTier(tier) {
    tier.forEach(card => {
        displayDevelopmentCards(card);
    });
}

function findCard(tier) {
    return allDevelopmentCards.filter(tierLevel => tier === tierLevel.level)[0];
}

function handleReserveButtonClick($template, $popup) {
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    const playerName = StorageAbstractor.loadFromStorage("playerName");

    fetchGameData(gameId, playerName)
        .then(gameData => processReserve(gameData, $template, $popup, gameId, playerName))
        .catch(error => handleReserveError(error, $popup));
}

function processReserve(gameData, $figure, $popup, gameId, playerName) {
    const { game, currentPlayer } = gameData;
    const cardDetails = getCardDetails($figure);
    const cardToReserve = findCardInMarket(game, cardDetails.level, cardDetails.name);
    const takeGold = determineGoldAvailability(currentPlayer, game);

    return sendReserveRequest(gameId, playerName, cardToReserve, takeGold)
        .then(result => handleReserveResult(result, $popup, gameId));
}

function getCardDetails($template) {
    const cardLevel = parseInt($template.getAttribute('data-card-level'));
    const cardName = $template.getAttribute('data-card-name');
    return { level: cardLevel, name: cardName };
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
    const gameId = StorageAbstractor.loadFromStorage("gameId");
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

    const playerBonuses = calculateAllBonuses(currentPlayer);
    const payment = calculatePayment(cardToBuy.cost, currentPlayer.tokens, playerBonuses);

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

function calculateAllBonuses(currentPlayer) {
    let bonuses = {};

    if (currentPlayer.bonuses && typeof currentPlayer.bonuses === 'object') {
        bonuses = {...currentPlayer.bonuses};
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
            const currentPlayer = game.game.players.find(player => player.name === playerName);
            return { game, currentPlayer };
        })
        .catch(error => {
            console.error(`Error fetching game data in fetchGameData for game ${gameId}:`, error);
            throw error;
        });
}

function findCardInMarket(game, cardLevel, cardName) {
    const marketTier = game.game.market.visibleCards[cardLevel - 1];
    return marketTier.cards.find(card => card.name === cardName);
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
    $popup.classList.add('hidden');
}

function addCardEventListeners($template) {
    const $popup = document.querySelector("#buy-or-reserve-option");
    const allCards = document.querySelectorAll("#gameScreen div#cardsContainer figure");

    allCards.forEach(card => {
        card.addEventListener('click', () => {cardClickHandler($template, card.getAttribute('data-card-name'), $popup);});
    });

    attachCloseButtonListener($popup);
}

function cardClickHandler($template, cardName, $popup) {
    highlightSelectedCard(cardName)
    attachReserveAndBuyHandlers(getCardByName(cardName), $popup);
    $popup.classList.remove('hidden');
}
function getCardByName(cardName) {
    const allCards = document.querySelectorAll("#gameScreen div#cardsContainer figure");

    for (const card of allCards) {
        if (card.getAttribute('data-card-name') === cardName) {
            return card;
        }
    }
}

function highlightSelectedCard(cardName) {
    const allCards = document.querySelectorAll("#gameScreen div#cardsContainer figure");
    allCards.forEach(card => {
        if (card.getAttribute('data-card-name') === cardName) {
            card.classList.add("selected");
        } else {
            card.classList.remove("selected");
        }
    });
}

function attachReserveAndBuyHandlers($figure, $popup) {
    const $reserveButton = document.querySelector('#reserve-button');
    const $buyButton = document.querySelector('#buy-button');

    const reserveHandler = () => handleReserveButtonClick($figure, $popup);
    const buyHandler = () => handleBuyButtonClick($figure, $popup);

    $reserveButton.addEventListener('click', reserveHandler);
    $buyButton.addEventListener('click', buyHandler);

    $reserveButton.clickHandler = reserveHandler;
    $buyButton.clickHandler = buyHandler;
}

function attachCloseButtonListener($popup) {
    const $closeButton = $popup.querySelector('.close');
        $closeButton.addEventListener('click', () => closeHandler($popup));
}

function closeHandler($popup) {
    closePopup($popup);
}
//pas dit aan jitse
function populateCardDetails($template, card) {
    appendPrestigePoints($template, card);
    populateCostDetails($template, card);
    setCardTypeImage($template, card);
    setCardTokenImage($template, card);
}
//pas dit aan jitse
function appendPrestigePoints($template, card) {
    if (card.prestigePoints !== 0) {
        const p = document.createElement('p');
        p.textContent = card.prestigePoints;
        $template.appendChild(p);
    }
}

function populateCostDetails($template, card) {
    const $cost = $template.querySelector('#cost');
    Object.keys(card.cost).forEach(bonusCost => {
        const gemInfo = findGemByName(bonusCost);
        if (gemInfo && gemInfo.tokenId) {
            const costItem = createCostItem(gemInfo, card.cost[bonusCost]);
            $cost.appendChild(costItem);
        }
    });
}

function createCostItem(gemInfo, costValue) {
    const costItem = document.createElement('li');
    costItem.className = gemInfo.tokenId;
    costItem.textContent = costValue;
    return costItem;
}

function setCardTypeImage($template, card) {
    const cardTypeImg = $template.querySelector('#cardType');
    const cardTypeInfo = findCard(card.level);
    if (cardTypeImg && cardTypeInfo) {
        cardTypeImg.setAttribute('src', cardTypeInfo.img);
        cardTypeImg.setAttribute('alt', `Level ${card.level} card`);
        cardTypeImg.setAttribute('title', `Level ${card.level} card`);
    }
}

function setCardTokenImage($template, card) {
    const cardTokenImg = $template.querySelector('#cardToken');
    const bonusInfo = findGemByName(card.bonus);
    if (cardTokenImg && bonusInfo) {
        cardTokenImg.setAttribute('src', bonusInfo.img);
        cardTokenImg.setAttribute('alt', card.bonus + ' bonus');
        cardTokenImg.setAttribute('title', card.bonus + ' bonus');
    }
}
//pas dit aan jitse
function displayDevelopmentCards(card) {
    const $cardsContainer = document.querySelector("#cardsContainer");
    if (!$cardsContainer) {
        console.error("Cannot find cards container (#cardsContainer)!");
        return;
    }

    const $template = createCardTemplate(card);
    populateCardDetails($template, card);

    $cardsContainer.appendChild($template);
}

export {renderDevelopmentCards, addCardEventListeners, addReserveCardEventListeners};
