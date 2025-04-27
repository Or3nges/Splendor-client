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

