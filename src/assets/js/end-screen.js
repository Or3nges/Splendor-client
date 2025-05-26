import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";
import { fetchGame } from "./util.js";

const FOURTH_PLACE = 3;

function goToIndex() {
  window.location.href = "../index.html";
}

function updateLeaderboard() {
  document.querySelector("#quit").addEventListener("click", goToIndex);
  const gameId = StorageAbstractor.loadFromStorage("gameId");
  fetchGame(gameId)
    .then(gameDetails => {
      const players = gameDetails.game.players;
      const sortedPlayers = players.sort((a, b) => b.totalPrestigePoints - a.totalPrestigePoints);
      const firstPlace = document.querySelector("#firstPlace");
      const secondPlace = document.querySelector("#secondPlace");
      const thirdPlace = document.querySelector("#thirdPlace");
      const fourthPlace = document.querySelector("#fourthPlace");

      if (sortedPlayers[0]) {
        firstPlace.textContent = `1st: ${sortedPlayers[0].name}: ${sortedPlayers[0].totalPrestigePoints}`;
      }
      if (sortedPlayers[1]) {
        secondPlace.textContent = `2nd: ${sortedPlayers[1].name}: ${sortedPlayers[1].totalPrestigePoints}`;
      }
      if (sortedPlayers[2]) {
        thirdPlace.textContent = `3rd: ${sortedPlayers[2].name}: ${sortedPlayers[2].totalPrestigePoints}`;
      }
      if (sortedPlayers[FOURTH_PLACE]) {
        fourthPlace.textContent = `4th: ${sortedPlayers[FOURTH_PLACE].name}: ${sortedPlayers[FOURTH_PLACE].totalPrestigePoints}`;
      }
    });
}

updateLeaderboard();