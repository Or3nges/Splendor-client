import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {createLiElement, fetchGame, findGemByName} from "../util.js";
import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";

function renderDevelopmentCards(gameId) {
    fetchGame(gameId)
        .then(data => {
            data.market.forEach(tier => {
                handleTier(tier);
            });
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

async function isCurrentPlayerTurn() {
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    const currentPlayer = await CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => game.currentPlayer)
        .catch(error => {
            console.error("Error fetching current player:", error);
            return null;
        });

    const playerName = StorageAbstractor.loadFromStorage("playerName");
    return playerName === currentPlayer;
}

async function handleReserveButtonClick($template, $popup) {
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    const playerName = StorageAbstractor.loadFromStorage("playerName");

    const game = await CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET');
    const currentPlayer = game.players.find(player => player.name === playerName);

    if (currentPlayer.reserve.length >= 3) {
        console.log("You cannot reserve more than 3 cards.");
        return;
    }

    const cardId = $template.getAttribute('data-card-id');
    currentPlayer.reserve.push(cardId);
    currentPlayer.tokens.gold = (currentPlayer.tokens.gold || 0) + 1;

    console.log("Updated Tokens:", currentPlayer.tokens);
    console.log("Reserved Cards:", currentPlayer.reserve);

    await CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'POST', game);
    $popup.style.display = "none";
}

function closePopup($popup) {
    document.querySelectorAll("#gameScreen div figure").forEach(cardElement => {
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

function addCardEventListeners($template, $popup) {
    $template.addEventListener('click', async () => {
        const isTurn = await isCurrentPlayerTurn();
        if (!isTurn) return;

        selectCard($template, $popup);

        const $reserveButton = $popup.querySelector('#reserve-button');
        $reserveButton.addEventListener('click', () => handleReserveButtonClick($template, $popup));
    });

    const $closeButton = $popup.querySelector('.close');
    $closeButton.addEventListener('click', () => closePopup($popup));
}

function populateCardDetails($template, card) {
    const $cost = $template.querySelector('#cost');
    Object.keys(card.cost).forEach(bonusCost => {
        $cost.insertAdjacentHTML('beforeend', createLiElement(card.cost[bonusCost], findGemByName(bonusCost).tokenId));
    });
    $template.querySelector('#cardType').setAttribute('src', findCard(card.level).img);
    $template.querySelector('#cardToken').setAttribute('src', findGemByName(card.bonus).img);
}

function createCardTemplate(card) {
    const $template = document.querySelector('#developmentCard').content.firstElementChild.cloneNode(true);
    if (card.prestigePoints !== 0) {
        $template.insertAdjacentHTML('beforeend', `<p>${card.prestigePoints}</p>`);
    }
    return $template;
}

function displayDevelopmentCards(card) {
    const $gamescreenArticle = document.querySelector("#gameScreen div");
    const $popup = document.querySelector("#buy-or-reserve-option");

    const $template = createCardTemplate(card);
    populateCardDetails($template, card);
    addCardEventListeners($template, $popup);

    $gamescreenArticle.appendChild($template);
}

export {renderDevelopmentCards};