import * as communicationAbstractor from "../data-connector/api-communication-abstractor.js";
import * as storageAbstractor from "../data-connector/local-storage-abstractor.js";
import {allDevelopmentCards} from "../Objects/developmentCards.js"

const gameId = storageAbstractor.loadFromStorage("game id")

function fetchDevelopmentCards() {
    communicationAbstractor.fetchFromServer(`/games/${gameId}`, "GET")
        .then(data => renderDevelopmentCards(data.market));
}

function renderDevelopmentCards(market) {
    console.log(market);
    for (let row = 0; row < market.length; row++) {
        for (let col = 0; col < market[0].visibleCards.length; col++) {
            displayDevelopmentCards(row);
        }
    }
}

function displayDevelopmentCards(row) {
    const $gamescreenArticle = document.querySelector("#gamescreen article");
    const $template = document.querySelector('#developmentCard').content.firstElementChild.cloneNode(true);
    console.log($template);
    $template.querySelector('img').setAttribute('src', allDevelopmentCards[row].img);
    $gamescreenArticle.insertAdjacentHTML('beforeend', $template.outerHTML);
}

export {renderDevelopmentCards, fetchDevelopmentCards};