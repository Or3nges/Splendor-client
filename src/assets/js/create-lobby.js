import * as StorageAbstractor from "./data-connector/local-storage-abstractor.js";
import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import { addDataToLocalStorage } from "./util.js";

function handleLeaveButtonClick() {
    const leaveButton = document.querySelector('#leaveButton');
    if (leaveButton) {
        leaveButton.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
}

function handleGameConfigFormSubmit() {
    const gameConfigForm = document.querySelector('#gameConfigForm');
    if (gameConfigForm) {
        gameConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(gameConfigForm);

            const lobbyData = {
                gameName: formData.get('gameName'),
                numberOfPlayers: parseInt(formData.get('playerAmount')),
                playerName: StorageAbstractor.loadFromStorage("playerName")

            };


            CommunicationAbstractor.fetchFromServer('/games', 'POST', lobbyData)
                .then(responseData => {
                    addDataToLocalStorage(responseData);
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
