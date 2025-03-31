
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

function initBuyOption() {
  document.querySelector("#buy-button").addEventListener("click", function () {
    document.querySelector("#buy-or-reserve-option").classList.add("hidden");
    document.querySelector("#buy-cards-option").classList.remove("hidden");
  });
}




export { initPopup, initBuyOption };
