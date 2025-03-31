import {fetchGame, createLiElement, findGemByName, findGemByTokenId} from "../util.js";

function retrieveTokens(gameId) {
    fetchGame(gameId)
        .then(data => {displayTokens(data.unclaimedTokens)});
}

function displayTokens(tokens) {
    const $tokensContainer = document.querySelector("#tokens ul");
    Object.keys(tokens).forEach(tokenName => {
        $tokensContainer.insertAdjacentHTML("beforeend", createLiElement(tokens[tokenName], findGemByName(tokenName).tokenId, tokenName))});

    document.querySelectorAll("#tokens ul li").forEach(li => {
        const tokenName = findGemByTokenId(li.classList.value).name;
        li.setAttribute("data-token", tokenName);
        li.addEventListener("click", selectToken);
    })
}

function selectToken(e) {
    console.log(e.target);
}

export {retrieveTokens};