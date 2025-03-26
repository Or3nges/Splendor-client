import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";

function fetchPlayers(){
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => renderPlayers(game));

}

function renderPlayers(game){
    console.log(game);
    const players = game.players;
    for (const player of players) {
        if (player.name === StorageAbstractor.loadFromStorage("playerName")) {
            displayPlayer(player);
        } else { displaySelf(player) }

    }
}

function displayPlayer(player){
    const playerList = document.querySelector("article.players ul");
    const playerTemplate = document.querySelector("template#player-template");


}

function displaySelf(player){
    const playerList = document.querySelector("");
    const playerTemplate = document.querySelector("template#self-template");

}

fetchPlayers();