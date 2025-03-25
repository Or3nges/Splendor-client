document.addEventListener('DOMContentLoaded', () => {
    const leaveButton = document.getElementById('leaveButton');

    if (leaveButton) {
        leaveButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    const gameConfigForm = document.getElementById('gameConfigForm');
    if (gameConfigForm) {
        gameConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(gameConfigForm);
            const data = {
                playerName: localStorage.getItem('playerName'),
                maxPlayers: formData.get('playerAmount'),
                treasurePerPlayer: formData.get('treasurePerPlayer'),
                gameName: formData.get('gameName'),
            };

            fetch(`/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.success) {
                        window.location.href = 'lobby.html';
                    } else {
                        alert('Failed to create game');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to connect to server.');
                });
        });
    }
});
