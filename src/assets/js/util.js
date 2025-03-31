import * as communicationAbstractor from "../js/data-connector/api-communication-abstractor.js";
import {allGems} from "./Objects/gems.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";

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

function addDataToLocalStorage(data) {
    StorageAbstractor.saveToStorage("gameId", data.gameId);
    StorageAbstractor.saveToStorage("playerToken", data.playerToken);
}


export { createLiElement ,addDataToLocalStorage, fetchGame, findGemByName, findGemByTokenId};
