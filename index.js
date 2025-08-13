const { Client, GatewayIntentBits, EmbedBuilder, Events, Partials } = require(`discord.js`);
const mongoose = require('mongoose');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences], partials: [Partials.Message, Partials.GuildMessageReactions, Partials.Channel, Partials.MessageReactionAdd, Partials.MessageReactionRemove, Partials.Reaction]
});

const path = require('path')
const express = require('express');
const axios = require('axios');
const session = require('express-session');
require('dotenv').config();
const { Routes } = require('discord-api-types/v10');
const { REST } = require('@discordjs/rest');
const url = require('url');
const bodyParser = require('body-parser');
const port = 1500;
const app = express();
const rest = new REST({ version: '10' }).setToken(process.env.token);


//* ===================Express=========================== 


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// app.use('/html', express.static('src/dashboard/html'));
// app.use('/js', express.static('src/dashboard/js'));
// app.use('/css', express.static('src/dashboard/css'));
app.use('/html', express.static(path.join(__dirname, 'src/dashboard/css')));
app.use('/js', express.static(path.join(__dirname, 'src/dashboard/css')));
app.use('/css', express.static(path.join(__dirname, 'src/dashboard/css')));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/index.html');
});


app.get('/reaction-role', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/reactionRole.html');
});

app.get('/welcome-system', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/welcome.html');
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/dashboard.html');
});

app.get('/server.html', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/server.html');
});

app.get('/auto-responder', (req, res) => {
    res.sendFile(__dirname + '/dashboard/html/autoResponder.html');
});





//! ===================OAuth2 Redirect=========================== 

app.get('/api/auth/discord/redirect', async (req, res) => {
    const { code } = req.query;
    if (code) {
        const formData = new url.URLSearchParams({
            client_id: process.env.ClientID,
            client_secret: process.env.ClientSecret,
            grant_type: 'authorization_code',
            code: code.toString(),
            redirect_uri: `https://www.sonicweb.xyz/api/auth/discord/redirect`,
        });
        try {
            const output = await axios.post('https://discord.com/api/v10/oauth2/token',
                formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (output.data) {
                const access = output.data.access_token;
                const userinfo = await axios.get('https://discord.com/api/v10/users/@me', {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                    },
                });

                const guilds = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
                    headers: {
                        'Authorization': `Bearer ${access}`,
                    },
                });

                const avatarUrl = `https://cdn.discordapp.com/avatars/${userinfo.data.id}/${userinfo.data.avatar}.png`;

                req.session.user = {
                    username: userinfo.data.username,
                    avatar: avatarUrl,
                    guilds: guilds.data
                };

                res.redirect('/dashboard.html');
            }
        } catch (error) {
            console.error('Error during OAuth2 token exchange', error);
            res.status(500).send('Authentication Failed');
        }
    } else {
        res.status(400).send('No code provided');
    }
});


//! ===================API's=========================== 



app.get('/api/user-info', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(400).send('Unauthorized');
    }
});

app.get('/api/bot-guilds', async (req, res) => {
    try {
        const botGuilds = await rest.get(Routes.userGuilds());
        res.json(botGuilds);
    } catch (error) {
        console.error('Error fetching bot guilds,', error);
        res.status(500).send('Internal Server Error');
    }
});



const welcomeSystemSchema = new mongoose.Schema({
    message: String,
    guildId: String,
    channelId: String,
    joinRole: String,
    embed: {
        title: String,
        description: String,
        color: String,
        thumbnail: String,
        image: String,
        footer: String
    }
});

const WelcomeSystem = mongoose.model('WelcomeSystem', welcomeSystemSchema);


app.post('/api/set-welcome', async (req, res) => {
    const { guildId, welcomeChannel, welcomeMessage, embed, joinRole } = req.body;

    try {
        const welcomeSystem = new WelcomeSystem({
            guildId,
            channelId: welcomeChannel,
            message: welcomeMessage,
            joinRole,
            embed
        });

        await welcomeSystem.save();
        res.status(200).send('Welcome system settings saved successfully');
    } catch (error) {
        console.error('Error saving welcome system settings:', error);
        res.status(500).send('Internal Server Error');
    }
});



const reactionRoleSchema = new mongoose.Schema({
    message: String,
    pairs: Array,
    channelId: String,
});

const ReactionRole = mongoose.model('ReactionRole', reactionRoleSchema);

app.post('/api/reaction-role', async (req, res) => {
    const { message, pairs, channelId } = req.body;
    try {
        const reactionRole = new ReactionRole({ message, pairs, channelId });
        await reactionRole.save();
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            const sentMessage = await channel.send(message);
            
            for (const pair of pairs) {
                const emojiId = pair.emojiId;
                const emoji = client.emojis.cache.get(emojiId);
                
                await sentMessage.react(emoji);
            }
            res.status(200).send('Reaction role message sent successfully');
        } else {
            res.status(404).send('Channel not found');
        }
    } catch (error) {
        console.error('Error sending reaction role message:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/guild-channels/:guildId', async (req, res) => {
    const guildId = req.params.guildId;
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const channels = guild.channels.cache.map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type
        }));
        res.json(channels);
    } else {
        res.status(404).json({ error: 'Guild not found' });
    }
});

app.get('/api/guild-info/:guildId', async (req, res) => {
    const { guildId } = req.params;

    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const guildInfo = await axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
            headers: {
                'Authorization': `Bot ${process.env.token}`,
            },
        });

        let allMembers = [];
        let lastMemberId = null;
        let fetching = true;

        while (fetching) {
            const membersResponse = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/members`, {
                headers: {
                    'Authorization': `Bot ${process.env.token}`,
                },
                params: {
                    limit: 1000,
                    after: lastMemberId
                },
            });

            const members = membersResponse.data;
            allMembers = allMembers.concat(members);

            if (members.length < 1000) {
                fetching = false;
            } else {
                lastMemberId = members[members.length - 1].user.id;
            }
        }

        res.json({ ...guildInfo.data, memberCount: allMembers.length, members: allMembers });
    } catch (error) {
        console.error('Error fetching guild info:', error);
        res.status(500).send('Failed to fetch guild information');
    }
});

app.get('/api/recent-activity/:guildId', async (req, res) => {
    const { guildId } = req.params;

    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const activities = await RecentActivity.find({ guildId }).sort({ timestamp: -1 }).limit(10);
        if (activities.length === 0) {
            return res.json({ message: 'No recent activities found' });
        }
        res.json(activities);

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).send('Failed to fetch recent activities');
    }
});



const autoResponderSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    trigger: { type: String, required: true },
    response: { type: String, required: true }
});

const AutoResponder = mongoose.model('AutoResponder', autoResponderSchema);

app.post('/api/auto-responders/:guildId', async (req, res) => {
    const { guildId } = req.params;
    const { trigger, response } = req.body;

    try {
        const autoResponder = new AutoResponder({ guildId, trigger, response });
        await autoResponder.save();
        res.status(201).json(autoResponder);
    } catch (error) {
        console.error('Error adding auto responder:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.delete('/api/auto-responders/:guildId/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await AutoResponder.findByIdAndDelete(id);
        res.status(200).send('Auto responder deleted successfully');
    } catch (error) {
        console.error('Error deleting auto responder:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/auto-responders/:guildId', async (req, res) => {
    const { guildId } = req.params;

    try {
        const autoResponders = await AutoResponder.find({ guildId });
        res.json(autoResponders);
    } catch (error) {
        console.error('Error fetching auto responders:', error);
        res.status(500).send('Internal Server Error');
    }
});


//? Start server
app.listen(port, () => {
    console.log(`Running on http://localhost:${port}`);
});
module.exports = app;



//! ===================Discord Bot=========================== 

const recentActivitySchema = new mongoose.Schema({
    guildId: String,
    username: String,
    avatar: String,
    action: String,
    type: String,
    timestamp: { type: Date, default: Date.now },
});


const RecentActivity = mongoose.model('RecentActivity', recentActivitySchema);
client.on(Events.GuildMemberAdd, async (member) => {
    const avatarUrl = member.user.displayAvatarURL();
    const activity = new RecentActivity({
        guildId: member.guild.id,
        username: member.user.username,
        avatar: avatarUrl,
        action: 'Joined the server',
        type: 'Joined'
    });
    await activity.save();
});

client.on(Events.GuildMemberRemove, async (member) => {
    const avatarUrl = member.user.displayAvatarURL();
    const activity = new RecentActivity({
        guildId: member.guild.id,
        username: member.user.username,
        avatar: avatarUrl,
        action: 'Left the server',
    });
    await activity.save();
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const { message } = reaction;
    const reactionRole = await ReactionRole.findOne({ channelId: message.channel.id, message: message.content });

    if (reactionRole) {
        const pair = reactionRole.pairs.find(pair => pair.emojiId === reaction.emoji.id);
        if (pair) {
            const role = message.guild.roles.cache.get(pair.roleId);
            const member = message.guild.members.cache.get(user.id);
            if (role && member) {
                await member.roles.add(role);
                console.log(`Assigned role ${role.name} to ${user.username}`);
            }
        }
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const { message } = reaction;
    const reactionRole = await ReactionRole.findOne({ channelId: message.channel.id, message: message.content });

    if (reactionRole) {
        const pair = reactionRole.pairs.find(pair => pair.emojiId === reaction.emoji.id);
        if (pair) {
            const role = message.guild.roles.cache.get(pair.roleId);
            const member = message.guild.members.cache.get(user.id);
            if (role && member) {
                await member.roles.remove(role);
                console.log(`Removed role ${role.name} from ${user.username}`);
            }
        }
    }
});


client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeSystem = await WelcomeSystem.findOne({ guildId: member.guild.id });
    if (welcomeSystem) {
        const channel = member.guild.channels.cache.get(welcomeSystem.channelId);
        if (channel) {
            const welcomeMessage = welcomeSystem.message
                .replace('{userMention}', `<@${member.id}>`)
                .replace('{serverMember}', member.guild.memberCount)
                .replace('{serverName}', member.guild.name)
                .replace('{userName}', member.user.username);

            const embed = new EmbedBuilder()
                .setTitle(welcomeSystem.embed.title)
                .setDescription(welcomeSystem.embed.description)
                .setColor(welcomeSystem.embed.color)
                .setThumbnail(welcomeSystem.embed.thumbnail)
                .setImage(welcomeSystem.embed.image)
                .setFooter({ text: welcomeSystem.embed.footer })
                .setTimestamp();

            await channel.send({ content: welcomeMessage, embeds: [embed] });
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const autoResponders = await AutoResponder.find({ guildId: message.guild.id });
    if (!autoResponders) return;

    for (const autoResponder of autoResponders) {
        if (message.content.includes(autoResponder.trigger)) {
            await message.reply(autoResponder.response);
            break;
        }
    }
});

//! ===================MongoDB Connection & Bot Login=========================== 

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


client.login(process.env.token);
