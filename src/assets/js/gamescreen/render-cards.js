import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {initTurnIndication} from "./turn-indication.js";

let boughtFromReserve = false;
let currentCard;

document.querySelector("#buy-cards-option #with").addEventListener('click', handleBuyChoice);
document.querySelector("#buy-cards-option #without").addEventListener('click', handleBuyChoice);

function createCardTemplate(card) {
    const figure = document.createElement('figure');
    const cardTypeImg = document.createElement('img');
    const cardTokenImg = document.createElement('img');
    const costUl = document.createElement('ul');

    cardTypeImg.id = 'cardType';
    cardTokenImg.id = 'cardToken';
    costUl.id = 'cost';

    figure.appendChild(cardTypeImg);
    figure.appendChild(cardTokenImg);
    figure.appendChild(costUl);
    figure.setAttribute('data-card-level', card.level);
    figure.setAttribute('data-card-name', card.name);

    return figure;
}

function renderDevelopmentCards(gameId) {
    const cardsContainer = document.querySelector("#cardsContainer");
    cardsContainer.innerHTML = "";

    fetchGame(gameId).then(data => {
        for (const tier of data.game.market.visibleCards) {
            for (const card of tier.cards) {
                displayCard(card);
            }
        }

        const playerName = StorageAbstractor.loadFromStorage("playerName");
        let playerFound = false;
        for (let k = 0; k < data.game.players.length && !playerFound; k++) {
            if (data.game.players[k].name === playerName) {
                renderReservedCards(data.game.players[k].reserved);
                playerFound = true;
            }
        }
    });
}

function displayCard(card) {
    const cardsContainer = document.querySelector("#cardsContainer");
    const template = createCardTemplate(card);
    setCardImages(template, card);
    addPrestigePoints(template, card);
    addCostToCard(template, card);
    cardsContainer.appendChild(template);
}

function setCardImages(template, card) {
    const cardTypeImg = template.querySelector('#cardType');
    const cardTokenImg = template.querySelector('#cardToken');

    for (const element of allDevelopmentCards) {
        if (element.level === card.level) {
            cardTypeImg.src = element.img;
        }
    }

    const bonusGem = findGemByName(card.bonus);
    if (bonusGem) {
        cardTokenImg.src = bonusGem.img;
    }
}

function addPrestigePoints(template, card) {
    if (card.prestigePoints > 0) {
        const p = document.createElement('p');
        p.textContent = card.prestigePoints;
        template.appendChild(p);
    }
}

function addCostToCard(template, card) {
    const costList = template.querySelector('#cost');
    const costKeys = Object.keys(card.cost);

    for (const element of costKeys) {
        const gemName = element;
        const amount = card.cost[gemName];
        const gem = findGemByName(gemName);

        if (gem) {
            const li = document.createElement('li');
            li.className = gem.tokenId;
            li.textContent = amount;
            costList.appendChild(li);
        }
    }
}

function renderReservedCards(reservedCards) {
    const container = document.querySelector("#reservedCardsContainer");
    container.innerHTML = "";

    for (const element of reservedCards) {
        const template = createCardTemplate(element);
        setCardImages(template, element);
        addPrestigePoints(template, element);
        addCostToCard(template, element);
        container.appendChild(template);
    }
}

function addCardEventListeners() {
    const popup = document.querySelector("#buy-or-reserve-option");
    const allCards = document.querySelectorAll("#gameScreen div#cardsContainer figure");

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
    const reservedCards = document.querySelectorAll("#reservedCardsContainer figure");

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

