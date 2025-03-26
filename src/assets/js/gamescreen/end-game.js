
function initEndGame() {
  document.querySelector(".close").addEventListener("click", closePopup);
}
function closePopup() {
  document.querySelector("#prestige-popup").classList.add("hidden");
}

export {initEndGame}