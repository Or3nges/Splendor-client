import * as StorageAbstractor from "../data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "../data-connector/api-communication-abstractor.js";
import {allGems} from "../Objects/gems.js";

function fetchPlayers(){
    const gameId = parseInt(StorageAbstractor.loadFromStorage("game id"));
    CommunicationAbstractor.fetchFromServer(`/games/${gameId}`, 'GET')
        .then(game => fetchgems(game));

}

function fetchgems(game){
    CommunicationAbstractor.fetchFromServer(`/gems`, 'GET')
        .then(data => renderPlayers(game, data.gems));
}

function renderPlayers(game, gems){
    const players = game.players;
    console.log(players);
    for (const player of players) {
        if (player.name !== StorageAbstractor.loadFromStorage("playerName")) {
            displayPlayer(player, gems);
        } else { displaySelf(player, gems) }
    }
}

function displayPlayer(player, gems) {
    const $playerList = document.querySelector("article.players ul");
    const $playerTemplate = document.querySelector("template#player-template");
    const playerClone = $playerTemplate.content.firstElementChild.cloneNode(true);
    const $prestigePoints = playerClone.querySelector("p.prestige");
    const $tokenOl = playerClone.querySelector("ol.tokens");
    const $cardOl = playerClone.querySelector("ol.cards");
    $prestigePoints.insertAdjacentHTML('beforeend', `${player.totalPrestigePoints}`);

    createLiPreperation(player, gems, $tokenOl, $cardOl);

    playerClone.querySelector("h2").innerText = player.name;
    $playerList.insertAdjacentHTML('beforeend', playerClone.outerHTML);
}

function displaySelf(player, gems) {
    const $owntokendiv = document.querySelector("div#yourcards");
    const $playerTemplate = document.querySelector("template#self-template");
    const playerClone = $playerTemplate.content.firstElementChild.cloneNode(true);
    const $tokenOl = playerClone.querySelector("ol.tokens");
    const $cardOl = playerClone.querySelector("ol.cards");

    createLiPreperation(player, gems, $tokenOl, $cardOl);
    changeNameAndPrestige(player);
    $owntokendiv.insertAdjacentHTML('beforeend', playerClone.outerHTML);
}

function changeNameAndPrestige(player){
    const $nameholder = document.querySelector("article#tokenSelection h1");
    const $prestigePoints = document.querySelector("article#tokenSelection p.prestige2");
    console.log(player.name);
    console.log(player.totalPrestigePoints);
    console.log($nameholder);
    console.log($prestigePoints);
    $nameholder.innerText = player.name;
    $prestigePoints.innerText = player.totalPrestigePoints;
}

function createLiElement(amount, id){
    return `<li class="${id}">${amount}</li>`;
}

function getGemId(gem, type){
   let selectedGem = allGems.filter(objectGem => objectGem.name === gem)
    if (type === "token"){
        return selectedGem[0].tokenId;
    }else {
        return selectedGem[0].cardId;
    }
}

function createLiPreperation(player, gems, $tokenOl, $cardOl){
    for (const gem of gems) {
        let tokenId = getGemId(gem, "token");
        let cardId = getGemId(gem, "card");

        let tokenAmount = player.tokens[gem] || 0;
        let cardAmount = player.bonuses[gem] || 0;

        $tokenOl.insertAdjacentHTML('beforeend', createLiElement(tokenAmount, tokenId));
        $cardOl.insertAdjacentHTML('beforeend', createLiElement(cardAmount, cardId));
    }
}
export { fetchPlayers };