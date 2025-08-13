window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');
    const userResponse = await fetch('/api/user-info');
    const activitiesResponse = await fetch(`/api/recent-activity/${guildId}`);
    const activities = await activitiesResponse.json();

    try {
        if (guildId) {

            const reactionRolesLink = document.getElementById('reaction-roles-link');
            reactionRolesLink.href = `/reaction-role?guildId=${guildId}`;

            const welcomeSystemLink = document.getElementById('welcome-system-link');
            welcomeSystemLink.href = `/welcome-system?guildId=${guildId}`;

            
            const autoResponderLink = document.getElementById('auto-responder-link');
            autoResponderLink.href = `/auto-responder?guildId=${guildId}`;


            const response = await fetch(`/api/guild-info/${guildId}`);
            if (response.ok) {
                const guildInfo = await response.json();
                document.getElementById('guild-name').innerText = guildInfo.name;
                document.getElementById('guild-icon').src = guildInfo.icon
                    ? `https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png`
                    : 'https://via.placeholder.com/150';
                document.getElementById('total-users').innerText = guildInfo.memberCount;
                document.getElementById('total-roles').innerText = guildInfo.roles.length;
                document.getElementById('total-emojis').innerText = guildInfo.emojis.length;
                document.getElementById('total-stickers').innerText = guildInfo.stickers.length;


            }
        }

        if (activitiesResponse.ok) {

            const recentActivitiesContainer = document.getElementById('recent-activities');
            recentActivitiesContainer.innerHTML = '';

            activities.forEach(activity => {
                const activityDiv = document.createElement('div');
                activityDiv.className = "flex items-center gap-4 p-3 rounded-lg bg-white/50 hover:bg-white/60 transition-colors";
                activityDiv.innerHTML = `
                <div class="h-10 w-10 rounded-full bg-gray-200"><img class="h-10 w-10 rounded-full" src='${activity.avatar}'></img></div>
                <div>
                    <p class="font-medium">${activity.username}</p>
                    <p class="text-sm text-${activity.type === 'Joined' ? 'green' : 'red'}-600">${activity.action}</p>
                </div>
            `;
                recentActivitiesContainer.appendChild(activityDiv);
            });
        }


        if (userResponse.ok) {
            const userInfo = await userResponse.json();
            const { username, avatar } = userInfo;
            document.getElementById('navbar-username').innerText = username;
            document.getElementById('welcome-username').innerText = `Welcome back, ${username}!`;
            if (avatar) {
                document.getElementById('navbar-avatar').src = avatar;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}