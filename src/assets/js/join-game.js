import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";


function init() {
    loadGames();
}

document.querySelector("#backButton").addEventListener("click", () => {
    window.location.href = "../index.html";
});
function loadGames(){
        CommunicationAbstractor.fetchFromServer(`/games?started=false`, 'GET')
        .then(data => {
            document.querySelector('main').innerHTML = "";
            const games = data.games;

            games.forEach((game, index = 1) => {
                addGame(game, index + 1);
            });
            document.querySelectorAll("main ul").forEach(item => item.addEventListener('click', chooseGame));
            setTimeout(loadGames, 5000);
        });
}

function addGame(game, gameIdx) {
    const countOfPlayers = game.players.length;
    const $game = document.querySelector('template').content.firstElementChild.cloneNode(true);
    const $gameList = document.querySelector('main');
    if (game.id === StorageAbstractor.loadFromStorage("selectedGame")) {
        $game.classList.add("selected");
    }
    $game.setAttribute('id', game.gameId);
    $game.querySelector('#gameIdx').innerText = `Game ${gameIdx}:`;
    $game.querySelector('#gameName').innerText = game.gameName;
    $game.querySelector('#players').innerText = `${countOfPlayers}/${game.numberOfPlayers}`;

    $gameList.insertAdjacentHTML("beforeend", $game.outerHTML);
}

function chooseGame(e) {
    let selectedGameID = e.currentTarget.id;

    StorageAbstractor.saveToStorage("selectedGame", selectedGameID);
    if (selectedGameID === "" || e.target.tagName === 'LI') {
        selectedGameID = e.target.parentNode.id;
    }
    if (selectedGameID) {
        const $allGames = document.querySelectorAll(`main ul`);
        $allGames.forEach($game => {
            $game.classList.remove("selected");
        });

        const $selectedGame = document.querySelector(`#${selectedGameID}`);
        const $joinButton = document.querySelector("#join-game");
        $selectedGame.classList.add("selected");
        $joinButton.classList.add("active");
        $joinButton.addEventListener('click', joinGame);
    }

}

function joinGame() {
    const playerName = StorageAbstractor.loadFromStorage("playerName");
    const gameId = StorageAbstractor.loadFromStorage("selectedGame");
    if (gameId === null) {
        alert("Please select a game first");
        return;
    }
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}/players/${playerName}`, "POST")
        .then(data => {
            StorageAbstractor.saveToStorage("playerToken", data.playerToken);
            StorageAbstractor.saveToStorage("gameId", data.gameId);
            window.location.href = "gameLobby.html";
        })
        .catch(error => {
            alert(error.cause);
        });
}


init();