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

function addCardEventListeners($template, $popup) {
    $template.addEventListener('click', async () => {
        document.querySelectorAll("#gameScreen div figure").forEach(cardElement => {
            cardElement.classList.remove("selected");
        });
        $template.classList.add("selected");
        $popup.style.display = "block";
    });

    const $closeButton = $popup.querySelector('.close');
    $closeButton.addEventListener('click', () => {
        document.querySelectorAll("#gameScreen div figure").forEach(cardElement => {
            cardElement.classList.remove("selected");
        });
        $popup.style.display = "none";
    });
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