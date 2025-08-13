let channels = ['Loading...'];
let roles = ['Loading....'];
let emojis = ['😀', '😂', '😍', '🥳', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];
let guildInfo;

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

                // Populate roles
                const roleSelect = document.getElementById('role-select');
                guildInfo.roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = role.name;
                    roleSelect.appendChild(option);
                });

                // Populate emojis
                const emojiGrid = document.getElementById('emoji-grid');
                guildInfo.emojis.forEach(async emoji => {
                    const button = document.createElement('button');
                    const emojiIcon = button.innerHTML = `<img src="https://cdn.discordapp.com/emojis/${emoji.id}"></img>`;

                    button.className = 'text-2xl hover:bg-gray-100 p-2 rounded';
                    button.onclick = () => selectEmoji(emojiIcon, emoji.id);
                    emojiGrid.appendChild(button);
                });

                // Populate channels
                const channelSelect = document.getElementById('channel');
                const channelResponse = await fetch(`/api/guild-channels/${guildId}`);
                if (channelResponse.ok) {
                    const channels = await channelResponse.json();
                    channels.forEach(channel => {
                        const option = document.createElement('option');
                        option.value = channel.id; // Use channel ID for the value
                        option.textContent = channel.name; // Display channel name
                        channelSelect.appendChild(option);
                    });
                }

                document.getElementById('emoji-select').addEventListener('click', openEmojiPicker);

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
    } catch (error) {
        console.error('Error loading user or guild info:', error);
    }
}

// Send reaction role message
document.getElementById('send-reaction-role').addEventListener('click', async () => {
    const message = document.getElementById('message').value;
    const channelId = document.getElementById('channel').value;
    const pairs = Array.from(document.querySelectorAll('#role-emoji-pairs > div')).map(div => ({
        roleId: div.querySelector('.role-select').value,
        emojiId: div.querySelector('.emoji-select').getAttribute('data-emoji-id')
    }));
    try {
        const response = await axios.post('/api/reaction-role', {
            message,
            pairs,
            channelId
        });

        alert(response.data);
    } catch (error) {
        console.error('Error sending reaction role:', error);
        alert('Failed to send reaction role message');
    }
});



// Populate channel dropdown
const channelSelect = document.getElementById('channel');
channels.forEach(channel => {
    const option = document.createElement('option');
    option.value = channel;
    option.textContent = channel;
    channelSelect.appendChild(option);
});

// Function to populate role dropdown
function populateRoleSelect(select) {

    guildInfo.roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        select.appendChild(option);
    });
}

// Populate emoji picker
const emojiGrid = document.getElementById('emoji-grid');
emojis.forEach(emoji => {
    const button = document.createElement('button');
    button.textContent = emoji;
    button.className = 'text-2xl hover:bg-gray-100 p-2 rounded';
    button.onclick = () => selectEmoji(emoji);
    emojiGrid.appendChild(button);
});

// Add role-emoji pair
document.getElementById('add-pair').addEventListener('click', () => {
    const pairDiv = document.createElement('div');
    pairDiv.className = 'flex items-center space-x-4';
    pairDiv.innerHTML = `
        <select class="role-select w-1/2 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none">
            <option value="">Select a role</option>
        </select>
        <button class="emoji-select w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <span class="text-2xl">😀</span>
        </button>
        <button class="remove-pair text-red-500 hover:text-red-700">
            x  
        </button>
    `;
    document.getElementById('role-emoji-pairs').appendChild(pairDiv);
    populateRoleSelect(pairDiv.querySelector('.role-select'));

    pairDiv.querySelector('.emoji-select').addEventListener('click', openEmojiPicker);
    pairDiv.querySelector('.remove-pair').addEventListener('click', () => pairDiv.remove());
});

// Emoji selection logic
let currentEmojiButton;
function openEmojiPicker(event) {
    currentEmojiButton = event.currentTarget;
    document.getElementById('emoji-picker').classList.remove('hidden');
}

function selectEmoji(emoji, emojiId) {
    if (currentEmojiButton) {
        currentEmojiButton.querySelector('span').innerHTML = emoji;
        currentEmojiButton.setAttribute('data-emoji-id', emojiId);
    }
    document.getElementById('emoji-picker').classList.add('hidden');
}

// Close emoji picker
document.getElementById('close-emoji-picker').addEventListener('click', () => {
    document.getElementById('emoji-picker').classList.add('hidden');
});

