import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {createLiElement} from "../util.js";
import {allGems} from "../Objects/gems.js";

const gameId = StorageAbstractor.loadFromStorage("gameId");

function initNobles() {
    fetchUnclaimedNobles();
}

function fetchUnclaimedNobles() {
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`)
        .then(data => data.unclaimedNobles.forEach(noble => renderNoble(noble)));
}




function renderNoble(noble) {
    console.log(noble)
    const $template = document.querySelector("template#noble-template");
    const $section = document.querySelector("div#noblesContainer")
    const playerClone = $template.content.firstElementChild.cloneNode(true);

    const nobleCardImage = playerClone.querySelector("img");
    const nobleCostUl = playerClone.querySelector("ul");
    const prestigeP = playerClone.querySelector("p")

    nobleCardImage.setAttribute("src", "assets/images/nobleDevelopmentCard.png");
    nobleCardImage.setAttribute("alt", `${noble.name}`);
    nobleCardImage.setAttribute("title", `${noble.name}`);
    Object.keys(noble.neededBonuses).forEach(bonusCost => {nobleCostUl.insertAdjacentHTML('beforeend', createLiElement(noble.neededBonuses[bonusCost], findGem(bonusCost).cardId))});
    const p = `<p>${noble.prestigePoints}</p>`;
    if (noble.prestigePoints !== 0) {
        playerClone.insertAdjacentHTML('beforeend', p);
    }
    $section.insertAdjacentHTML('beforeend', playerClone.outerHTML);
}

function findGem(gemName) {
    return allGems.filter(gem => gem.name === gemName)[0];
}

export {initNobles}