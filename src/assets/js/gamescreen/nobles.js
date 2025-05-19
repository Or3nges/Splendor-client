import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {createLiElement} from "../util.js";
import {allGems} from "../Objects/gems.js";
import { fetchPlayers } from "./player.js";

const gameId = StorageAbstractor.loadFromStorage("gameId");

function initNobles() {
    fetchAndRenderUnclaimedNobles();
}

function fetchAndRenderUnclaimedNobles() {
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`)
        .then(data => {
            const unclaimedNobles = data.unclaimedNobles || [];
            const $section = document.querySelector("div#noblesContainer");
            $section.innerHTML = '';
            unclaimedNobles.forEach(noble => renderNoble(noble, $section));
        })
        .catch(error => console.error("Error fetching game data for nobles:", error));
}

function setNobleImage(nobleElement, nobleName) {
    const nobleCardImage = nobleElement.querySelector("img");
    if (nobleCardImage) {
        nobleCardImage.setAttribute("src", "assets/images/nobleDevelopmentCard.png");
        nobleCardImage.setAttribute("alt", nobleName);
        nobleCardImage.setAttribute("title", nobleName);
    }
}

function renderNobleCosts(nobleElement, neededBonuses) {
    const nobleCostUl = nobleElement.querySelector("ul");
    if (nobleCostUl) {
        nobleCostUl.innerHTML = '';
        Object.keys(neededBonuses).forEach(gemName => {
            const amount = neededBonuses[gemName];
            if (amount > 0) {
                const gemObject = findGem(gemName);
                if (gemObject && gemObject.cardId) {
                    nobleCostUl.insertAdjacentHTML('beforeend', createLiElement(amount, gemObject.cardId));
                }
            }
        });
    }
}

function renderNoblePrestigePoints(nobleElement, prestigePoints) {
    if (prestigePoints > 0) {
        const prestigeHtml = `<p class="noble-prestige-points">${prestigePoints}</p>`;
        nobleElement.insertAdjacentHTML('beforeend', prestigeHtml);
    }
}

function renderNoble(noble, $section) {
    const $template = document.querySelector("template#noble-template");
    if (!$template) {
        console.error("Noble template not found.");
        return;
    }

    const nobleElement = $template.content.firstElementChild.cloneNode(true);

    setNobleImage(nobleElement, noble.name);
    renderNobleCosts(nobleElement, noble.neededBonuses);
    renderNoblePrestigePoints(nobleElement, noble.prestigePoints);

    $section.appendChild(nobleElement);
}

function findGem(gemName) {
    return allGems.find(gem => gem.name.toLowerCase() === gemName.toLowerCase());
}


function checkAndClaimNobles() {
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const currentLocalGameId = StorageAbstractor.loadFromStorage("gameId");

    CommunicationAbstractor.fetchFromServer(`/games/${currentLocalGameId}`)
        .then(gameState => {
            const player = gameState.players.find(p => p.name === playerName);
            const playerBonuses = player.bonuses;
            const latestUnclaimedNobles = gameState.unclaimedNobles || [];

            for (const noble of latestUnclaimedNobles) {
                if (canPlayerClaimNoble(noble, playerBonuses)) {
                    attemptToClaimNoble(noble, playerName, currentLocalGameId);

                    break;
                }
            }
        })
        .catch(error => {
            console.error("Error fetching game state for noble check:", error);
        });
}

function canPlayerClaimNoble(noble, playerBonuses) {
    for (const gemType in noble.neededBonuses) {
        const requiredAmount = noble.neededBonuses[gemType];
        if (requiredAmount > 0) {
            const playerHasAmount = playerBonuses[gemType] || 0;
            if (playerHasAmount < requiredAmount) {
                return false;
            }
        }
    }
    return true;
}

function attemptToClaimNoble(noble, playerName, gameIdToClaim) {
    const nobleDataForApi = {
        name: noble.name,
        prestigePoints: noble.prestigePoints,
        neededBonuses: noble.neededBonuses
    };

    CommunicationAbstractor.fetchFromServer(`/games/${gameIdToClaim}/players/${playerName}/nobles`, 'POST', nobleDataForApi)
        .then(response => {
            console.log(`Noble "${noble.name}" claimed successfully by ${playerName}:`, response);

            fetchAndRenderUnclaimedNobles();
            fetchPlayers();
        })
        .catch(error => {
            console.error(`Error claiming noble "${noble.name}" for player ${playerName}:`, error);

            fetchAndRenderUnclaimedNobles();
            fetchPlayers();
        });
}

export {initNobles, checkAndClaimNobles};