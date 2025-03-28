import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";

function createLiElement(amount, id){
    return `<li class="${id}">${amount}</li>`;
}

function addDataToLocalStorage(data) {
    StorageAbstractor.saveToStorage("gameId", data.gameId);
    StorageAbstractor.saveToStorage("playerToken", data.playerToken);
}


export { createLiElement ,addDataToLocalStorage };