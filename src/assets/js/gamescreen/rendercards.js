import * as communicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {allDevelopmentCards} from "../Objects/developmentCards.js"
import {allGems} from "../Objects/gems.js";
import {createLiElement} from "../util.js";

const gameId = storageAbstractor.loadFromStorage("gameId");

function fetchDevelopmentCards() {
    communicationAbstractor.fetchFromServer(`/games/${gameId}`, "GET")
        .then(data => renderDevelopmentCards(data.market));
}

function renderDevelopmentCards(market) {
    console.log(market);
    market.forEach(tier => {
        handleTier(tier);
    });
}

function handleTier(tier) {
    tier.visibleCards.forEach(card => {
        displayDevelopmentCards(card);
    });
}

function findGem(gemName) {
    return allGems.filter(gem => gem.name === gemName)[0];
}

function findCard(tier) {
    return allDevelopmentCards.filter(tierLevel => tier === tierLevel.level)[0];
}

function displayDevelopmentCards(card) {
    const $gamescreenArticle = document.querySelector("#gameScreen div");
    const $template = document.querySelector('#developmentCard').content.firstElementChild.cloneNode(true);
    const $cost = $template.querySelector('#cost');
    console.log();

    const p = `<p>${card.prestigePoints}</p>`;
    if (card.prestigePoints !== 0) {
        $template.insertAdjacentHTML('beforeend', p);
    }

    Object.keys(card.cost).forEach(bonusCost => {$cost.insertAdjacentHTML('beforeend', createLiElement(card.cost[bonusCost], findGem(bonusCost).tokenId))});
    $template.querySelector('#cardType').setAttribute('src', findCard(card.level).img);
    $template.querySelector('#cardToken').setAttribute('src', findGem(card.bonus).img);
    $gamescreenArticle.insertAdjacentHTML('beforeend', $template.outerHTML);
}

export {renderDevelopmentCards, fetchDevelopmentCards};