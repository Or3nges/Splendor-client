import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";

function init() {
    testConnection();
    loadName();
    deleteStorage();
    document.querySelector("#createlobby").addEventListener("click", navigation);
    document.querySelector("#joingame").addEventListener("click", navigation);
    document.querySelector("#rules").addEventListener("click", navigation);
}

function deleteStorage() {
    StorageAbstractor.deleteMultipleKeysFromStorage("gameId", "gameName", "numberOfPlayers", "selectedGame", "playerToken");
}

function testConnection() {
    CommunicationAbstractor.fetchFromServer('/gems', 'GET').then(gems => console.log(gems)).catch(ErrorHandler.handleError);
}

function loadName() {
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    if (playerName) {
        document.querySelector("#name").value = playerName;
    }
}

function getPlayerName() {
    return document.querySelector("#name").value;
}

function validateName() {
    const playerName = getPlayerName();
    const pattern = /^[a-zA-Z]\w{2,15}$/;
    if (!pattern.test(playerName)) {
        alert("Invalid username. Username must be between 3 and 14 characters long and cannot consist of special characters");
        return false;
    }
    return true;
}

function navigation(e) {
    e.preventDefault();
    if (!validateName()) return;
    const target = e.currentTarget;
    const targetId = target.getAttribute("id");
    StorageAbstractor.saveToStorage("playerName", getPlayerName());
    window.location.href = `html/${targetId}.html`;
}

init();
