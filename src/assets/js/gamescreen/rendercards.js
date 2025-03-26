import * as communicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {allDevelopmentCards} from "../Objects/developmentCards.js"
import {allGems} from "../Objects/gems.js";

const gameId = storageAbstractor.loadFromStorage("game id")

function fetchDevelopmentCards() {
    communicationAbstractor.fetchFromServer(`/games/${gameId}`, "GET")
        .then(data => renderDevelopmentCards(data.market));
}

function renderDevelopmentCards(market) {
    console.log(market);
    for (let row = 0; row < market.length; row++) {
        for (let col = 0; col < market[0].visibleCards.length; col++) {
            displayDevelopmentCards(row, market[row].visibleCards[col]);
        }
    }
}

function displayDevelopmentCards(row, card) {
    const $gamescreenArticle = document.querySelector("#gamescreen");
    const $template = document.querySelector('#developmentCard').content.firstElementChild.cloneNode(true);
    console.log();
    $template.querySelector('#cardType').setAttribute('src', allDevelopmentCards[row].img);
    $template.querySelector('#cardToken').setAttribute('src', findBonusCard(card.bonus));
    $gamescreenArticle.insertAdjacentHTML('beforeend', $template.outerHTML);
}

function findBonusCard(bonus) {
    return allGems.filter(gem => gem.name === bonus)[0].img;
}

export {renderDevelopmentCards, fetchDevelopmentCards};