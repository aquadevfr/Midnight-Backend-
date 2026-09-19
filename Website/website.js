module.exports = function(websiteApp) {
    const express = require("express");
    const path = require("path");
    const config = require("../Config/config.json");
    const User = require("../model/user.js");
    const UserStats = require("../model/userstats.js");
    const log = require("../structs/log.js");

    const DISCORD_API_URL = 'https://discord.com/api';
    const CLIENT_ID = config.Website.clientId;
    const CLIENT_SECRET = config.Website.clientSecret;
    const REDIRECT_URI = config.Website.redirectUri.replace("${websiteport}", config.Website.websiteport);

    websiteApp.use(express.json());
    websiteApp.use(express.urlencoded({ extended: true }));
    
    websiteApp.use('/Images', express.static(path.join(__dirname, './Data/Images')));
    websiteApp.use('/css', express.static(path.join(__dirname, './Data/css')));
    websiteApp.use('/html', express.static(path.join(__dirname, './Data/html')));

    websiteApp.get('/', (req, res) => {
        res.redirect('/login');
    });

    websiteApp.get('/login', (req, res) => {
        const authURL = `${DISCORD_API_URL}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;

        res.redirect(authURL);
    });

    const oauthCallback = require('./Data/js/oauthCallback')(DISCORD_API_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    websiteApp.get('/oauth2/callback', oauthCallback);

    websiteApp.post('/register-user', require('./Data/js/registerUser.js'));

    websiteApp.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, './Data/html/register.html'));
    });

    websiteApp.get('/account-exists', (req, res) => {
        res.sendFile(path.join(__dirname, './Data/html/accountExists.html'));
    });

    websiteApp.get('/leaderboard', (req, res) => {
        res.sendFile(path.join(__dirname, './Data/html/leaderboard.html'));
    });

    websiteApp.get('/api/website/leaderboard', async (req, res) => {
        try {
            const playlist = req.query.playlist || "solo";
            const typeStat = req.query.type || "placetop1";
            const region = req.query.region || "Global";
            const limit = parseInt(req.query.limit) || 50;
            const search = req.query.search ? req.query.search.toLowerCase() : null;

            const allUsers = await User.find({ isServer: false });
            const leaderboardEntries = [];

            for (const user of allUsers) {
                const stat = await UserStats.findOne({ accountId: user.accountId });
                
                const playlistStats = stat ? stat[playlist] : null;
                const value = playlistStats ? (playlistStats[typeStat] || 0) : 0;
                
                
                if (region !== "Global" && region !== "NA" && region !== "EU" && region !== "ASIA") {
                }

                leaderboardEntries.push({
                    rank: 0,
                    accountId: user.accountId,
                    username: user.username,
                    value: value,
                    kills: playlistStats ? (playlistStats.kills || 0) : 0,
                    wins: playlistStats ? (playlistStats.placetop1 || 0) : 0,
                    matches: playlistStats ? (playlistStats.matchesplayed || 0) : 0
                });
            }

            leaderboardEntries.sort((a, b) => b.value - a.value);
            
            
            leaderboardEntries.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            if (search) {
                const searchResult = leaderboardEntries.find(e => e.username.toLowerCase().includes(search));
                return res.json(searchResult ? [searchResult] : []);
            }

            res.json(leaderboardEntries.slice(0, limit));
        } catch (err) {
            log.error("Website Leaderboard API Error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    });
};
