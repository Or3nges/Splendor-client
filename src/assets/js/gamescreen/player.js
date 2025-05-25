import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {allGems} from "../Objects/gems.js";

let gems;
const $playerList = document.querySelector("div.players ul");
const $playerTemplate = document.querySelector("template#player-template");

function fetchGems(){
    CommunicationAbstractor.fetchFromServer(`/gems`, 'GET')
        .then(data => gems = data.gems);
}

function fetchPlayers(){
    const gameId = parseInt(StorageAbstractor.loadFromStorage("gameId"));
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => renderPlayers(game.game));

}

function renderPlayers(game){
    const players = game.players;
    $playerList.innerHTML = "";
    for (const player of players) {
        if (player.name !== StorageAbstractor.loadFromStorage("playerName")) {
            displayPlayer(player, game.currentPlayer);
        } else { displaySelf(player, game.currentPlayer); }
    }
}

function displayPlayer(player, currentPlayer) {
    const playerClone = $playerTemplate.content.firstElementChild.cloneNode(true);
    const $prestigePoints = playerClone.querySelector("p.prestige");
    const $tokenOl = playerClone.querySelector("ol.tokens");
    const $cardOl = playerClone.querySelector("ol.cards");
    $prestigePoints.insertAdjacentHTML('beforeend', `${player.totalPrestigePoints}`);

        if (player.name === currentPlayer) {
            playerClone.classList.remove("unhighlighted");
            playerClone.classList.add("highlighted");
        }

    createLiPreperation(player, $tokenOl, $cardOl);
    playerClone.querySelector("h2").innerText = player.name;
    $playerList.insertAdjacentHTML('beforeend', playerClone.outerHTML);
}

function displaySelf(player, currentPlayer) {
    const $owntokendiv = document.querySelector("div#yourcards");
    const $selfTemplate = document.querySelector("template#self-template");
    const playerClone = $selfTemplate.content.firstElementChild.cloneNode(true);
    const $tokenOl = playerClone.querySelector("ol.tokens");
    const $cardOl = playerClone.querySelector("ol.cards");

    createLiPreperation(player, $tokenOl, $cardOl);
    changeNameAndPrestige(player, currentPlayer);
    checkPrestigePoints(player);
    $owntokendiv.innerHTML = "";
    $owntokendiv.insertAdjacentHTML('beforeend', playerClone.outerHTML);
}

function changeNameAndPrestige(player, currentPlayer){
    const $article = document.querySelector("article#tokenSelection");
    const $prestigePoints = document.querySelector("article#tokenSelection p.prestige2");
    if (player.name === currentPlayer) {
        $article.classList.remove("unhighlighted");
        $article.classList.add("highlighted");
    } else {
        $article.classList.remove("highlighted");
        $article.classList.add("unhighlighted");
    }
    $article.querySelector("h1").innerText = player.name;
    $prestigePoints.innerText = player.totalPrestigePoints;
}

function checkPrestigePoints(player) {
    const MAX_PRESTIGE_POINTS = 15;
    if (player.totalPrestigePoints >= MAX_PRESTIGE_POINTS) {
        alert(`${player.name} has reached ${MAX_PRESTIGE_POINTS} prestige points!`);
    }
}

function createLiElement(amount, id){
    return `<li class="${id}">${amount}</li>`;
}

function getGemId(gem, type){
   const selectedGem = allGems.filter(objectGem => objectGem.name === gem);
    if (type === "token"){
        return selectedGem[0].tokenId;
    }else {
        return selectedGem[0].cardId;
    }
}

function createLiPreperation(player, $tokenOl, $cardOl){
    for (const gem of gems) {
        const tokenId = getGemId(gem, "token");
        const cardId = getGemId(gem, "card");
        const tokenAmount = player.purse.tokensMap[gem] || 0;
        const cardAmount = player.bonuses[gem] || 0;

        $tokenOl.insertAdjacentHTML('beforeend', createLiElement(tokenAmount, tokenId));
        $cardOl.insertAdjacentHTML('beforeend', createLiElement(cardAmount, cardId));
    }
}
export { fetchGems, fetchPlayers };