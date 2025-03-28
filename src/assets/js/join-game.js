import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";
import { addDataToLocalStorage } from "./util.js";

function init() {
    document.querySelector("#search").value = "";
    document.querySelector("#filter").value = "Waiting";
    document.querySelector("#filter").addEventListener("change", loadGames);
    document.querySelector("#search").addEventListener("input", searchGames);
    localStorage.removeItem("selectedGame");
    loadGames();
}

const WAITFORTIMEOUT = 5000;

document.querySelector("#back-button").addEventListener("click", () => {
    window.location.href = "../index.html";
});

function loadGames() {
    const filter = document.querySelector("#filter").value;
    let apiPath;
    if (filter === "Started") {
        apiPath = "/games?started=true";
    } else if (filter === "Waiting") {
        apiPath = "/games?started=false";
    } else {
        apiPath = "/games";
    }
    CommunicationAbstractor.fetchFromServer(apiPath, 'GET')
        .then(data => {
            document.querySelector('main').innerHTML = "";
            const games = data.games;
            games.forEach(game => {
                addGame(game);
            });
            document.querySelectorAll("main ul").forEach(item => item.addEventListener('click', chooseGame));
            searchGames();
            const selectedGameID = localStorage.getItem("selectedGame");
            if (selectedGameID) {
                const $selectedGame = document.querySelector(`#game-${selectedGameID}`);
                if ($selectedGame) {
                    $selectedGame.classList.add("selected");
                    document.querySelector("#join-game").classList.add("active");
                }
            }
            setTimeout(loadGames, WAITFORTIMEOUT);
        });
}

function addGame(game) {
    const countOfPlayers = game.players.length;
    const $game = document.querySelector("template").content.firstElementChild.cloneNode(true);
    const $gameList = document.querySelector("main");
    const selectedGameID = StorageAbstractor.loadFromStorage("selectedGame");

    $game.setAttribute('id', `game-${game.gameId}`);
    $game.querySelector('#gameIdx').innerText = `Game ${game.gameId}:`;
    $game.querySelector('#gameName').innerText = game.gameName;
    $game.querySelector('#players').innerText = `${countOfPlayers}/${game.numberOfPlayers}`;

    if (`game-${game.gameId}` === selectedGameID) {
        $game.classList.add("selected");
    }

    $gameList.insertAdjacentHTML("beforeend", $game.outerHTML);
}

function chooseGame(e) {
    let selectedGameID = e.currentTarget.id;

    if (selectedGameID === "" || e.target.tagName === 'LI') {
        selectedGameID = e.target.parentNode.id;
    }

    if (selectedGameID) {
        const gameIDNumber = selectedGameID.split('-')[1];
        StorageAbstractor.saveToStorage("selectedGame", gameIDNumber);
        localStorage.setItem("selectedGame", gameIDNumber);

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
            addDataToLocalStorage(data);
            window.location.href = "lobby.html";
        })
        .catch(error => {
            alert(error.cause);
        });
}

function searchGames() {
    const query = document.querySelector("#search").value.toLowerCase();
    const games = document.querySelectorAll("main ul");

    games.forEach(game => {
        const gameName = game.querySelector("#gameName").innerText.toLowerCase();
        game.classList.toggle("hidden", !gameName.includes(query));
    });
}

init();