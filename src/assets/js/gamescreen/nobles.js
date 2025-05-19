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

export {initNobles};