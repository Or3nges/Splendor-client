
function initPopup() {
  document.querySelectorAll(".close").forEach(element => {
    element.addEventListener("click", () => closePopup(element));
  });
}

function closePopup(element) {
  const popup = document.querySelectorAll(".popup");

  popup.forEach(popupSection => {
    if (popupSection.contains(element)) {
      popupSection.classList.add("hidden");
    }
  });
}

export { initPopup };
