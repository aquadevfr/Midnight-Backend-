const express = require("express");
const app = express.Router();
const User = require("../model/user.js");
const log = require("../structs/log.js");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// Helper function to check maintenance mode
function isMaintenanceMode() {
    try {
        const configPath = path.join(__dirname, "../Config/config.json");
        const config = JSON.parse(fs.readFileSync(configPath).toString());
        return config.maintenanceMode === true;
    } catch (err) {
        console.error("Error reading maintenance mode:", err);
        return false;
    }
}

function getMaintenanceInfo() {
    try {
        const configPath = path.join(__dirname, "../Config/config.json");
        const config = JSON.parse(fs.readFileSync(configPath).toString());
        return {
            reason: config.maintenanceReason || "Server maintenance in progress",
            enabledBy: config.maintenanceEnabledBy || "Administrator",
            enabledAt: config.maintenanceEnabledAt || new Date().toISOString()
        };
    } catch (err) {
        return {
            reason: "Server maintenance in progress",
            enabledBy: "Administrator",
            enabledAt: new Date().toISOString()
        };
    }
}


app.get("/api/launcher/login", async (req, res) => {
    // Check maintenance mode
    if (isMaintenanceMode()) {
        const maintenanceInfo = getMaintenanceInfo();
        return res.status(503).json({
            maintenance: true,
            reason: maintenanceInfo.reason,
            enabledBy: maintenanceInfo.enabledBy,
            enabledAt: maintenanceInfo.enabledAt
        });
    }

    const { email, password } = req.query;

    if (!email) return res.status(400).send('The email was not entered.');
    if (!password) return res.status(400).send('No password put in.');

    try {
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).send('User not found.');

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const username = user.username;

            return res.status(200).json({
                username: username,
                discordId: user.discordId,
                avatarHash: user.avatarHash,
                lastUsernameChange: user.lastUsernameChange,
                unlimitedUsernameChanges: user.unlimitedUsernameChanges
            });
        } else {
            return res.status(400).send('Error!');
        }
    } catch (err) {
        log.error('Launcher Api Error:', err);
        return res.status(500).send('Error encountered, look at the console');
    }
});

app.post("/api/launcher/update-username", async (req, res) => {
    const { email, password, newUsername } = req.body;

    console.log('[UPDATE USERNAME] Request received:', { email, newUsername, hasPassword: !!password });

    if (!email) return res.status(400).send('Email is required.');
    if (!password) return res.status(400).send('Password is required.');
    if (!newUsername) return res.status(400).send('New username is required.');

    // Validate username (3-16 characters, alphanumeric and underscores)
    if (newUsername.length < 3 || newUsername.length > 16) {
        console.log('[UPDATE USERNAME] Validation failed: length');
        return res.status(400).send('Username must be between 3 and 16 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        console.log('[UPDATE USERNAME] Validation failed: invalid characters');
        return res.status(400).send('Username can only contain letters, numbers, and underscores.');
    }

    try {
        // Verify user credentials
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log('[UPDATE USERNAME] User not found:', email);
            return res.status(404).send('User not found.');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('[UPDATE USERNAME] Invalid password for:', email);
            return res.status(401).send('Invalid credentials.');
        }

        console.log('[UPDATE USERNAME] Current username:', user.username);
        console.log('[UPDATE USERNAME] New username:', newUsername);
        console.log('[UPDATE USERNAME] Unlimited changes:', user.unlimitedUsernameChanges);

        // Check if username is already taken
        const existingUser = await User.findOne({ username_lower: newUsername.toLowerCase() });
        if (existingUser && existingUser.accountId !== user.accountId) {
            console.log('[UPDATE USERNAME] Username already taken:', newUsername);
            return res.status(400).send('Username is already taken.');
        }

        // Check cooldown (20 days = 1728000000 milliseconds)
        // Skip cooldown check if user has unlimited username changes
        if (!user.unlimitedUsernameChanges) {
            const twentyDays = 20 * 24 * 60 * 60 * 1000;
            if (user.lastUsernameChange) {
                const timeSinceLastChange = Date.now() - new Date(user.lastUsernameChange).getTime();
                console.log('[UPDATE USERNAME] Time since last change:', timeSinceLastChange, 'ms');
                if (timeSinceLastChange < twentyDays) {
                    const daysRemaining = Math.ceil((twentyDays - timeSinceLastChange) / (24 * 60 * 60 * 1000));
                    console.log('[UPDATE USERNAME] Cooldown active, days remaining:', daysRemaining);
                    return res.status(429).send(`You can change your username again in ${daysRemaining} days.`);
                }
            }
        } else {
            console.log('[UPDATE USERNAME] Cooldown bypassed - user has unlimited changes');
        }

        // Update username
        user.username = newUsername;
        user.username_lower = newUsername.toLowerCase();
        user.lastUsernameChange = new Date();
        await user.save();

        console.log('[UPDATE USERNAME] Username updated successfully:', newUsername);
        log.backend(`Username updated: ${email} -> ${newUsername}`);

        return res.status(200).json({
            username: newUsername,
            lastUsernameChange: user.lastUsernameChange
        });
    } catch (err) {
        console.error('[UPDATE USERNAME] Error:', err);
        log.error('Username Update Error:', err);
        return res.status(500).send('Error encountered, look at the console');
    }
});

app.post("/api/launcher/update-profile", async (req, res) => {
    const { email, password, profilePicture } = req.body;

    if (!email) return res.status(400).send('Email is required.');
    if (!password) return res.status(400).send('Password is required.');

    try {
        // Verify user credentials
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).send('User not found.');

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).send('Invalid credentials.');

        // Update profile picture (can be null to remove it)
        user.profilePicture = profilePicture || null;
        await user.save();

        log.backend(`Profile picture updated for: ${email}`);

        return res.status(200).json({
            success: true,
            profilePicture: user.profilePicture
        });
    } catch (err) {
        log.error('Profile Update Error:', err);
        return res.status(500).send('Error encountered, look at the console');
    }
});

app.get("/api/launcher/check-session", async (req, res) => {
    // Check maintenance mode first
    if (isMaintenanceMode()) {
        const maintenanceInfo = getMaintenanceInfo();
        return res.status(503).json({
            valid: false,
            reason: 'maintenance',
            maintenance: true,
            message: maintenanceInfo.reason,
            enabledBy: maintenanceInfo.enabledBy,
            enabledAt: maintenanceInfo.enabledAt
        });
    }

    const { email, password } = req.query;

    if (!email) return res.status(400).send('Email is required.');
    if (!password) return res.status(400).send('Password is required.');

    try {
        // Verify user credentials
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).send('User not found.');

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).send('Invalid credentials.');

        // Check if user has been force logged out
        if (user.forceLogout) {
            console.log('[SESSION CHECK] User has been force logged out:', email);
            // Clear the flag after notifying
            await user.updateOne({ $set: { forceLogout: false } });
            return res.status(403).json({ 
                valid: false, 
                reason: 'force_logout',
                message: 'You have been logged out by a moderator.' 
            });
        }

        // Check if user is banned
        if (user.banned) {
            const isBanExpired = user.banExpires && new Date() > new Date(user.banExpires);
            if (isBanExpired) {
                await user.updateOne({ $set: { banned: false, banExpires: null, banReason: null } });
            } else {
                return res.status(403).json({ 
                    valid: false, 
                    reason: 'banned',
                    message: user.banReason || 'Your account has been banned.' 
                });
            }
        }

        // Session is valid
        return res.status(200).json({ 
            valid: true,
            username: user.username,
            unlimitedUsernameChanges: user.unlimitedUsernameChanges
        });
    } catch (err) {
        log.error('Session Check Error:', err);
        return res.status(500).send('Error encountered, look at the console');
    }
});

module.exports = app;