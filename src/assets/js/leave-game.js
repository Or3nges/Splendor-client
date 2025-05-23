document.querySelector("#leaveGame").addEventListener("click", () => {
  window.location.href = "../index.html";
});

document.querySelector("#dontLeaveGame").addEventListener("click", () => {
  document.querySelector("#leave-game-option").classList.add("hidden");
});