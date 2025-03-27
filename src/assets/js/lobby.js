import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";

const TIMEOUT = 5000;

document.querySelector("#backButton").addEventListener("click", () => {
    StorageAbstractor.deleteMultipleKeysFromStorage("gameId", "gameName", "numberOfPlayers");
    window.location.href = "../index.html";
});

document.querySelector("#startGameButton").addEventListener("click", () => {
    window.location.href = "../html/gamescreen.html";
});

function fetchGameLobby() {
    const gameId = StorageAbstractor.loadFromStorage("gameId");
    if (!gameId) {
        console.error("No gameId found in storage.");
        return;
    }

    CommunicationAbstractor.fetchFromServer("/games", "GET")
        .then(data => {
            const games = data.games;

            const currentGame = games.find(game => game.gameId === gameId);
            if (currentGame) {
                displayLobby(currentGame);
            } else {
                console.error("Game with the specified gameId not found.");
            }
        })
        .catch(error => {
            console.error("Error fetching games:", error);
        });
}


function displayLobby(game) {
    const main = document.querySelector("main");
    main.innerHTML = "";

    const $lobby = document.querySelector('#lobby-template').content.firstElementChild.cloneNode(true);
    const countOfPlayers = game.players.length;

    $lobby.querySelector('#gameName').innerText = `Game Lobby: ${game.gameName}`;
    $lobby.querySelector('#playerAmount').innerText = `Players: ${countOfPlayers}/${game.numberOfPlayers}`;

    const $playersList = $lobby.querySelector('#lobbyPlayers');
    game.players.forEach(player => {
        const li = document.createElement("li");
        li.innerText = player;
        $playersList.appendChild(li);
    });

    main.appendChild($lobby);
}



fetchGameLobby();
setInterval(fetchGameLobby, TIMEOUT);
