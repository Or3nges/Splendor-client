import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import { retrieveTokens } from "./tokens.js";
import { fetchPlayers } from "./player.js";
import {initTurnIndication} from "./turn-indication.js";

const MAX_RESERVED_CARDS = 3;
let boughtFromReserve = false;
let currentCard;
document.querySelector("#buy-cards-option #with").addEventListener('click', handleBuyChoice);
document.querySelector("#buy-cards-option #without").addEventListener('click', handleBuyChoice);

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

        $reservedCardsContainer.appendChild($template);
    });
}

function addReserveCardEventListeners() {
    const $reservedCards = document.querySelectorAll("#reservedCardsContainer figure");
    const $popup = document.querySelector("#buy-or-reserve-option");

    $reservedCards.forEach($figure => {
        $figure.addEventListener('click', () => {
            reservedClickHandler($figure, $popup, true);
            $popup.classList.remove('hidden');
        });
    });

    attachCloseButtonListener($popup);
}

function reservedClickHandler($template, $popup, reserved) {
    boughtFromReserve = reserved;
    currentCard = $template;
    attachReserveAndBuyHandlers($template, $popup);
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

    if (neededGold > 0) {
        payment['GOLD'] = neededGold;
    }

    return payment;
}

function calculateNeededGold(cardCost, playerTokens, playerBonuses) {
    console.log(playerBonuses);
    console.log(cardCost);
    console.log(playerTokens);
    let neededGold = 0;
    const payment = {};

    for (const gemType in cardCost) {
        const cost = cardCost[gemType];
        const bonus = playerBonuses[gemType] || 0;
        const availableTokens = playerTokens[gemType] || 0;

        let shortage = cost - (bonus + availableTokens);
        if (shortage > 0) {
                neededGold += shortage;
            }
        payment[gemType] = availableTokens;
    }
    payment['GOLD'] = neededGold;
    return payment;
}

function handleBuyButtonClick() {
    const $buyChoice = document.querySelector("#buy-cards-option");
    $buyChoice.classList.remove('hidden');
}

function handleBuyChoice(e) {
    e.preventDefault();
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const cardLevel = parseInt(currentCard.getAttribute('data-card-level'));
    const cardName = currentCard.getAttribute('data-card-name');
    let buyChoice = e.currentTarget.id;
    fetchGameData(gameId, playerName)
        .then(gameData => processGameData(gameData.game, cardLevel, cardName, gameId, playerName, buyChoice === 'with'))
        .then(result => handleBuyResult(result))
}

function processGameData(gameData, cardLevel, cardName, gameId, playerName, withGoldBoolean) {
    let currentPlayer = gameData.game.players.find(player => player.name === gameData.game.currentPlayer);
    const cardToBuy = findCardToBuy(gameData, currentPlayer, cardLevel, cardName);
    const playerBonuses = calculateAllBonuses(currentPlayer);
    let payment;
    if (withGoldBoolean) {
        payment = calculateNeededGold(cardToBuy.cost, currentPlayer.purse.tokensMap, playerBonuses);
        console.log(payment);
    } else {
        payment = cardToBuy.cost;
    }


    const requestBody = {
        development: {name: cardToBuy.name},
        payment: payment,
    };
    console.log(requestBody)
    try {
    if (!boughtFromReserve) {
        return CommunicationAbstractor.fetchFromServer(
            `/games/${gameId}/players/${playerName}/developments`,
            'POST',
            requestBody
        );
    } else {
        return CommunicationAbstractor.fetchFromServer(
            `/games/${gameId}/players/${playerName}/reserve/${cardToBuy.name}`,
            'DELETE',
            requestBody
        );
    }} catch (error) {
        alert(`Error buying card: ${error.message || error}`);
        throw error;
    }
}

function findCardToBuy(game, currentPlayer, cardLevel, cardName) {
    let cardToBuy;

    if (!boughtFromReserve) {
        cardToBuy = findCardInMarket(game, cardLevel, cardName);
    } else {
        cardToBuy = currentPlayer.reserved.find(card => card.name === cardName);
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
function handleBuyResult() {
    const $popup = document.querySelector("#buy-cards-option");
    $popup.classList.add('hidden');
    initTurnIndication();
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
    });/*
    $popup.classList.add('hidden');
    */
}

function addCardEventListeners($template) {
    const $popup = document.querySelector("#buy-or-reserve-option");
    const allCards = document.querySelectorAll("#gameScreen div#cardsContainer figure");

    allCards.forEach(card => {
        card.addEventListener('click', () => {cardClickHandler($template, card.getAttribute('data-card-name'), $popup, false);});
    });

    attachCloseButtonListener($popup);
}

function cardClickHandler($template, cardName, $popup, reserved) {
    boughtFromReserve = reserved;
    highlightSelectedCard(cardName)
    currentCard = getCardByName(cardName);
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
    boughtFromReserve = false;
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

    $reserveButton.addEventListener('click', reserveHandler);
    $buyButton.addEventListener('click', handleBuyButtonClick);

    $reserveButton.clickHandler = reserveHandler;
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