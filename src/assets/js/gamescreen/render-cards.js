import {allDevelopmentCards} from "../Objects/developmentCards.js";
import {createLiElement, fetchGame, findGemByName} from "../util.js";

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

function displayDevelopmentCards(card) {
    const $gamescreenArticle = document.querySelector("#gameScreen div");
    const $template = document.querySelector('#developmentCard').content.firstElementChild.cloneNode(true);
    const $cost = $template.querySelector('#cost');

    const p = `<p>${card.prestigePoints}</p>`;
    if (card.prestigePoints !== 0) {
        $template.insertAdjacentHTML('beforeend', p);
    }

    Object.keys(card.cost).forEach(bonusCost => {$cost.insertAdjacentHTML('beforeend', createLiElement(card.cost[bonusCost], findGemByName(bonusCost).tokenId))});
    $template.querySelector('#cardType').setAttribute('src', findCard(card.level).img);
    $template.querySelector('#cardToken').setAttribute('src', findGemByName(card.bonus).img);
    $gamescreenArticle.insertAdjacentHTML('beforeend', $template.outerHTML);
}

export {renderDevelopmentCards};