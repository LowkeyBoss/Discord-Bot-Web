const channels = ['Loading....'];
const roles = ['Loading...'];
let guildInfo;



const welcomeChannelSelect = document.getElementById('welcome-channel');
channels.forEach(channel => {
    const option = document.createElement('option');
    option.value = channel;
    option.textContent = '#' + channel;
    welcomeChannelSelect.appendChild(option);
});

const joinRoleSelect = document.getElementById('join-role');
roles.forEach(role => {
    const option = document.createElement('option');
    option.value = role;
    option.textContent = role;
    joinRoleSelect.appendChild(option);
});

// Set welcome system
document.getElementById('set-welcome').addEventListener('click', () => {
    const welcomeChannel = document.getElementById('welcome-channel').value;
    const welcomeMessage = document.getElementById('welcome-message').value;
    const embedTitle = document.getElementById('embed-title').value;
    const embedDescription = document.getElementById('embed-description').value;
    const embedColor = document.getElementById('embed-color').value;
    const embedThumbnail = document.getElementById('embed-thumbnail').value;
    const embedImage = document.getElementById('embed-image').value;
    const embedFooter = document.getElementById('embed-footer').value;
    const joinRole = document.getElementById('join-role').value;

    // Here you would typically send this data to your backend
    console.log('Setting welcome system:', {
        welcomeChannel,
        welcomeMessage,
        embed: {
            title: embedTitle,
            description: embedDescription,
            color: embedColor,
            thumbnail: embedThumbnail,
            image: embedImage,
            footer: embedFooter
        },
        joinRole
    });
    alert('Welcome system set successfully!');
});


window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');
    const userResponse = await fetch('/api/user-info');

    try {
        if (guildId) {
            
            const overViewLink = document.getElementById('over-view-link');
            overViewLink.href = `/server.html?guildId=${guildId}`;

            
            const autoResponderLink = document.getElementById('auto-responder-link');
            autoResponderLink.href = `/auto-responder?guildId=${guildId}`;


            const reactionRolesLink = document.getElementById('reaction-roles-link');
            reactionRolesLink.href = `/reaction-role?guildId=${guildId}`;

            const response = await fetch(`/api/guild-info/${guildId}`);
            guildInfo = await response.json();


            // Populate roles
            const roleSelect = document.getElementById('join-role');
            guildInfo.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                roleSelect.appendChild(option);
            });


            // Populate channels
            const channelSelect = document.getElementById('welcome-channel');
            const channelResponse = await fetch(`/api/guild-channels/${guildId}`);
            if (channelResponse.ok) {
                const channels = await channelResponse.json();
                channels.forEach(channel => {
                    const option = document.createElement('option');
                    option.value = channel.id;
                    option.textContent = channel.name; 
                    channelSelect.appendChild(option);
                });
            }


            if (response.ok) {
                document.getElementById('guild-name').innerText = guildInfo.name;
                document.getElementById('guild-icon').src = guildInfo.icon
                    ? `https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png`
                    : 'https://via.placeholder.com/150';


            }
        }



        if (userResponse.ok) {
            const userInfo = await userResponse.json();
            const { username, avatar } = userInfo;
            document.getElementById('navbar-username').innerText = username;
            if (avatar) {
                document.getElementById('navbar-avatar').src = avatar;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}


document.getElementById('set-welcome').addEventListener('click', async () => {
    const welcomeChannel = document.getElementById('welcome-channel').value;
    const welcomeMessage = document.getElementById('welcome-message').value;
    const embedTitle = document.getElementById('embed-title').value;
    const embedDescription = document.getElementById('embed-description').value;
    const embedColor = document.getElementById('embed-color').value;
    const embedThumbnail = document.getElementById('embed-thumbnail').value;
    const embedImage = document.getElementById('embed-image').value;
    const embedFooter = document.getElementById('embed-footer').value;
    const joinRole = document.getElementById('join-role').value;

    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');

    const data = {
        guildId,
        welcomeChannel,
        welcomeMessage,
        embed: {
            title: embedTitle,
            description: embedDescription,
            color: embedColor,
            thumbnail: embedThumbnail,
            image: embedImage,
            footer: embedFooter
        },
        joinRole
    };

    try {
        const response = await fetch('/api/set-welcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Welcome system set successfully!');
        } else {
            alert('Failed to set welcome system');
        }
    } catch (error) {
        console.error('Error setting welcome system:', error);
        alert('An error occurred while setting the welcome system');
    }
});
