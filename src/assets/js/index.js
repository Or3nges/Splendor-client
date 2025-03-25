import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";

function init() {
  testConnection();
}

function testConnection(){
  CommunicationAbstractor.fetchFromServer('/gems', 'GET').then(gems => console.log(gems)).catch(ErrorHandler.handleError);
}
document.querySelector("#create").addEventListener("click", () => {
  window.location.href = "createlobby.html";
});
document.querySelector("#join").addEventListener("click", () => {
  window.location.href = "joingame.html";
});
document.querySelector("#rules").addEventListener("click", () => {
  console.log("rules");
});

init();
