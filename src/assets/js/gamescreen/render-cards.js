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

