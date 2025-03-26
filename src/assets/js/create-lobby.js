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

function handleGameConfigFormSubmit() {
    const gameConfigForm = document.querySelector('#gameConfigForm');
    if (gameConfigForm) {
        gameConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(gameConfigForm);
            const data = {
                playerName: StorageAbstractor.loadFromStorage('playerName'),
                numberOfPlayers: parseInt(formData.get('playerAmount'), 10),
                gameName: formData.get('gameName'),
            };
            console.log(data);
            CommunicationAbstractor.fetchFromServer('/games', 'POST', data)
                .then((res) => {
                    console.log('API response:', res);
                    window.location.href = '../html/lobby.html';
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to connect to server.');
                });
        });
    }
}

handleLeaveButtonClick();
handleGameConfigFormSubmit();

export {handleLeaveButtonClick, handleGameConfigFormSubmit};
