import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {createLiElement, fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {initTurnIndication} from "./turn-indication.js";
import * as communicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {allGems} from "../Objects/gems.js";

let boughtFromReserve = false;
let currentCard;

document.querySelector("#buy-cards-option #with").addEventListener('click', handleBuyChoice);
document.querySelector("#buy-cards-option #without").addEventListener('click', handleBuyChoice);
const $gamescreenArticle = document.querySelector("#gameScreen #cardsContainer");

function fetchDevelopmentCards(gameId) {
    $gamescreenArticle.innerHTML = "";
    communicationAbstractor.fetchFromServer(`/games/${gameId}`, "GET")
        .then(data =>
            renderDevelopmentCards(data.game.market.visibleCards));
}

function fetchReservedCards(gameId) {
    const playerName = StorageAbstractor.loadFromStorage("playerName");

    fetchGame(gameId).then(data => {
        console.log(data.game.players)
        const player = data.game.players.find(player => player.name === playerName);
        if (player) {
            renderReservedCards(player.reserved);
        }
    }).catch(error => {
        console.error("Error fetching game data:", error);
    });
}

function renderDevelopmentCards(tiers) {
    console.log(tiers);
    tiers.forEach(tier => {
        handleTier(tier);
    });
}

function handleTier(tier) {
    tier.cards.forEach(card => {
        displayDevelopmentCards(card, $gamescreenArticle);
    });
}

function findGem(gemName) {
    return allGems.filter(gem => gem.name === gemName)[0];
}

function findCard(tier) {
    return allDevelopmentCards.filter(tierLevel => tier === tierLevel.level)[0];
}

function displayDevelopmentCards(card, container) {
    const $template = document.querySelector('#developmentCardContainer').content.firstElementChild.cloneNode(true);
    const $cost = $template.querySelector('#cost');

    // Add prestige points if applicable
    if (card.prestigePoints !== 0) {
        const p = `<p>${card.prestigePoints}</p>`;
        $template.insertAdjacentHTML('beforeend', p);
    }

    Object.keys(card.cost).forEach(bonusCost => {
        $cost.insertAdjacentHTML('beforeend', createLiElement(card.cost[bonusCost], findGem(bonusCost).tokenId));
    });
    $template.querySelector('#cardType').setAttribute('src', findCard(card.level).img);
    $template.querySelector('#cardToken').setAttribute('src', findGem(card.bonus).img);

    $template.setAttribute('data-card-name', card.name);
    $template.setAttribute('data-card-level', card.level);
    $template.setAttribute('data-use-gold', false);

    container.insertAdjacentHTML('beforeend', $template.outerHTML);
}

function renderReservedCards(reservedCards) {
    const container = document.querySelector("#reservedCardsContainer");
    container.innerHTML = "";

    reservedCards.forEach(card => {
        displayDevelopmentCards(card, container);
    });
}

function addCardEventListeners() {
    const popup = document.querySelector("#buy-or-reserve-option");
    const allCards = document.querySelectorAll("#gameScreen #cardsContainer li");

    for (const element of allCards) {
        element.addEventListener('click', function () {
            currentCard = element;
            boughtFromReserve = false;
            popup.classList.remove('hidden');
        });
    }

    const closeButton = popup.querySelector('.close');
    closeButton.addEventListener('click', function() {
        popup.classList.add('hidden');
    });

    setupPopupButtons();
}

function addReserveCardEventListeners() {
    const popup = document.querySelector("#buy-or-reserve-option");
    const reservedCards = document.querySelectorAll("#reservedCardsContainer li");

    for (const element of reservedCards) {
        element.addEventListener('click', function () {
            currentCard = element;
            boughtFromReserve = true;
            popup.classList.remove('hidden');
        });
    }
}

function setupPopupButtons() {
    const reserveButton = document.querySelector('#reserve-button');
    const buyButton = document.querySelector('#buy-button');

    reserveButton.addEventListener('click', handleReserveClick);
    buyButton.addEventListener('click', function() {
        document.querySelector("#buy-or-reserve-option").classList.add('hidden');
        document.querySelector("#buy-cards-option").classList.remove('hidden');
    });
}

function handleReserveClick() {
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const cardLevel = parseInt(currentCard.getAttribute('data-card-level'));
    const cardName = currentCard.getAttribute('data-card-name');

    fetchGame(gameId).then(data => {
        const card = findCardInGame(data.game, cardLevel, cardName);
        const hasGold = data.game.unclaimedTokens.GOLD > 0;

        const requestBody = {
            development: { name: card.name },
            takeGold: hasGold
        };

        return CommunicationAbstractor.fetchFromServer(
            `/games/${gameId}/players/${playerName}/reserve`,
            'POST',
            requestBody
        );
    }).then(() => {
        document.querySelector("#buy-or-reserve-option").classList.add('hidden');
        initTurnIndication();
    });
}

function handleBuyChoice(e) {
    const { gameId, playerName, cardLevel, cardName, useGold } = buildBuyRequestData(e);

    fetchGame(gameId)
        .then(data => prepareBuyRequest(data.game, cardLevel, cardName, playerName, useGold))
        .then(({ requestBody, card, boughtFromReserve: boughtFromReserveFlag }) =>
            sendBuyRequest(gameId, playerName, card, requestBody, boughtFromReserveFlag)
        )
        .then(() => {
            document.querySelector("#buy-cards-option").classList.add('hidden');
            initTurnIndication();
        });
}

function buildBuyRequestData(e) {
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const cardLevel = parseInt(currentCard.getAttribute('data-card-level'));
    const cardName = currentCard.getAttribute('data-card-name');
    const useGold = e.currentTarget.id === 'with';
    return { gameId, playerName, cardLevel, cardName, useGold };
}

function prepareBuyRequest(game, cardLevel, cardName, playerName, useGold) {
    const card = findCardInGame(game, cardLevel, cardName);
    const player = findPlayerInGame(game, playerName);
    const payment = useGold ? calculatePaymentWithGold(card, player) : card.cost;
    const requestBody = {
        development: { name: card.name },
        payment: payment
    };
    return { requestBody, card, boughtFromReserve };
}

function sendBuyRequest(gameId, playerName, card, requestBody, boughtFromReserveFlag) {
    if (boughtFromReserveFlag) {
        return CommunicationAbstractor.fetchFromServer(
            `/games/${gameId}/players/${playerName}/reserve/${card.name}`,
            'DELETE',
            requestBody
        );
    } else {
        return CommunicationAbstractor.fetchFromServer(
            `/games/${gameId}/players/${playerName}/developments`,
            'POST',
            requestBody
        );
    }
}

function findCardInGame(game, level, name) {
    if (boughtFromReserve) {
        const playerName = StorageAbstractor.loadFromStorage("playerName");
        const player = findPlayerInGame(game, playerName);
        for (const element of player.reserved) {
            if (element.name === name) {
                return element;
            }
        }
    } else {
        const tier = game.market.visibleCards[level - 1];
        for (const element of tier.cards) {
            if (element.name === name) {
                return element;
            }
        }
    }
    return null;
}

function findPlayerInGame(game, playerName) {
    for (const element of game.players) {
        if (element.name === playerName) {
            return element;
        }
    }
    return null;
}

function calculatePaymentWithGold(card, player) {
    let neededGold = 0;
    const payment = {};
    const cardCost = card.cost;

    for (const gemType in cardCost) {
        const cost = cardCost[gemType];
        const bonus = player.bonuses[gemType] || 0;
        const availableTokens = player.purse.tokensMap[gemType] || 0;
        let shortage = cost - (bonus + availableTokens);
        if (shortage > 0) {
            neededGold += shortage;
        }
        payment[gemType] = cost - shortage;
    }
    payment['GOLD'] = neededGold;
    return payment;
}

export {addCardEventListeners, addReserveCardEventListeners, fetchDevelopmentCards, fetchReservedCards};