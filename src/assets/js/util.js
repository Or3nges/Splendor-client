import * as communicationAbstractor from "../js/data-connector/api-communication-abstractor.js";
import {allGems} from "./Objects/gems.js";

function createLiElement(amount, id){
    return `<li class="${id}" data-token>${amount}</li>`;
}

function fetchGame(gameId) {
    return communicationAbstractor.fetchFromServer(`/games/${gameId}`, "GET");
}

function findGemByName(gemName) {
    return allGems.filter(gem => gem.name === gemName)[0];
}

function findGemByTokenId(gemTokenId) {
    return allGems.filter(gem => gem.tokenId === gemTokenId)[0];
}

export {createLiElement, fetchGame, findGemByName, findGemByTokenId};