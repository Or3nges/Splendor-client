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