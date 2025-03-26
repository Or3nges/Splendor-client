import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";

function init() {
  testConnection();
}

function testConnection(){
  CommunicationAbstractor.fetchFromServer('/gems', 'GET').then(gems => console.log(gems)).catch(ErrorHandler.handleError);
}

function getPlayerName(){
  return document.querySelector("#name").value;
}

function validateName(){
  const playerName = getPlayerName();
  const pattern = /^[a-zA-Z]\w{2,15}$/;
  if(!pattern.test(playerName)){
    alert("Invalid username. Username must be between 3 and 14 characters long and cannot consist of special characters");
    return false;
  }
  return true;
}

document.querySelector("#create").addEventListener("click", () => {
  if (!validateName()) return;
  localStorage.setItem("playerName", getPlayerName());
  window.location.href = "html/createlobby.html";
});

document.querySelector("#join").addEventListener("click", () => {
  if (!validateName()) return;
  localStorage.setItem("playerName", getPlayerName());
  window.location.href = "html/joingame.html";
});

document.querySelector("#rules").addEventListener("click", () => {
  window.open('assets/rulebook/splendor-rulebook.pdf');
});

init();
