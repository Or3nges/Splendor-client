import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";

const gameId = StorageAbstractor.loadFromStorage("gameId");
const playerName = StorageAbstractor.loadFromStorage("playerName");


function initLeave(){
  document.querySelector("#SettingsGame .leaveGame").addEventListener("click", deletePlayer);
  document.querySelector("#dontLeaveGame").addEventListener("click", returnToGame);
}

function deletePlayer(){
  CommunicationAbstractor.fetchFromServer(`/games/${gameId}/players/${playerName}`, "DELETE");
}

//document.querySelector("#leaveGame").addEventListener("click", goToIndex)
/*
function goToIndex() {
  window.location.href = "index.html";
}
*/

function returnToGame() {
  document.querySelector("#leave-game-option").classList.add("hidden");
}

initLeave();
export {initLeave, deletePlayer};