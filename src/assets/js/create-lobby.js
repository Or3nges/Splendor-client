import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";

function handleLeaveButtonClick() {
    const leaveButton = document.querySelector('#leaveButton');
    if (leaveButton) {
        leaveButton.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
}

function addDataToLocalStorage(data, formData) {

    StorageAbstractor.saveToStorage("gameId", data.gameId);
    StorageAbstractor.saveToStorage("gameName", formData.get('gameName'));
}

function handleGameConfigFormSubmit() {
    const gameConfigForm = document.querySelector('#gameConfigForm');
    if (gameConfigForm) {
        gameConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(gameConfigForm);

            const lobbyData = {
                gameName: formData.get('gameName'),
                numberOfPlayers: parseInt(formData.get('playerAmount'), 10),
                playerName: StorageAbstractor.loadFromStorage("playerName")

            };


            CommunicationAbstractor.fetchFromServer('/games', 'POST', lobbyData)
                .then(responseData => {

                    addDataToLocalStorage(responseData, formData);
                    window.location.href = '../html/lobby.html';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to connect to server.');
                });
        });
    }
}

handleLeaveButtonClick();
handleGameConfigFormSubmit();

export { handleLeaveButtonClick, handleGameConfigFormSubmit };
