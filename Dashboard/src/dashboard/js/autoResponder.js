
let guildInfo;
let autoResponder = [];

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');
    const userResponse = await fetch('/api/user-info');
    try {
        if (guildId) {
            const overViewLink = document.getElementById('over-view-link');
            overViewLink.href = `/server.html?guildId=${guildId}`;

            
            const welcomeSystemLink = document.getElementById('welcome-system-link');
            welcomeSystemLink.href = `/welcome-system?guildId=${guildId}`;

            
            const autoResponderLink = document.getElementById('auto-responder-link');
            autoResponderLink.href = `/auto-responder?guildId=${guildId}`;

            const response = await fetch(`/api/guild-info/${guildId}`);
            guildInfo = await response.json();
            if (response.ok) {

              
                document.getElementById('guild-name').innerText = guildInfo.name;
                document.getElementById('guild-icon').src = guildInfo.icon
                    ? `https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png`
                    : 'https://via.placeholder.com/150';
            }
        }

        // Populate user info
        if (userResponse.ok) {
            const userInfo = await userResponse.json();
            const { username, avatar } = userInfo;
            document.getElementById('navbar-username').innerText = username;
            if (avatar) {
                document.getElementById('navbar-avatar').src = avatar;
            }
        }

        await loadAutoResponders();
    } catch (error) {
        console.error('Error loading user or guild info:', error);
    }
}


// Fetch auto responders from server
async function loadAutoResponders() {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');

    try {
        const response = await fetch(`/api/auto-responders/${guildId}`);
        if (response.ok) {
            autoResponders = await response.json();
            renderAutoResponders();
        } else {
            console.error("Failed to load auto responders");
        }
    } catch (error) {
        console.error("Error loading auto responders:", error);
    }
}


function renderAutoResponders() {
    const list = document.getElementById('auto-responders-list');
    list.innerHTML = '';
    autoResponders.forEach(ar => {
        list.appendChild(createAutoResponderCard(ar));
    });
}

function createAutoResponderCard(autoResponder) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-4 relative';
    card.innerHTML = `
        <h4 class="font-semibold text-lg mb-2">Trigger: ${autoResponder.trigger}</h4>
        <p class="text-gray-600">${autoResponder.response}</p>
        <button class="absolute top-2 right-2 text-red-500 hover:text-red-700" onclick="deleteAutoResponder('${autoResponder._id}')">
            Delete
        </button>
    `;
    return card;
}

// Add auto responder to the server
document.getElementById('set-auto-responder').addEventListener('click', async () => {
    const triggerWord = document.getElementById('trigger-word').value.trim();
    const response = document.getElementById('response').value.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');

    if (triggerWord && response) {
        try {
            const res = await fetch(`/api/auto-responders/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger: triggerWord, response })
            });
            if (res.ok) {
                const newAutoResponder = await res.json();
                autoResponders.push(newAutoResponder);
                renderAutoResponders();
                document.getElementById('trigger-word').value = '';
                document.getElementById('response').value = '';
            }
        } catch (error) {
            console.error("Error adding auto responder:", error);
        }
    } else {
        alert('Please enter both a trigger word and a response.');
    }
});


// Delete auto responder from the server
async function deleteAutoResponder(id) {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');

    try {
        const response = await fetch(`/api/auto-responders/${guildId}/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            autoResponders = autoResponders.filter(ar => ar._id !== id);
            renderAutoResponders();
        }
    } catch (error) {
        console.error("Error deleting auto responder:", error);
    }
}
