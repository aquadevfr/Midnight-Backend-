const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js");
const functions = require("../../../structs/functions.js");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./Config/config.json").toString());

module.exports = {
    commandInfo: {
        name: "deactivate",
        description: "Force log out a user from the launcher by invalidating their session.",
        options: [
            {
                name: "username",
                description: "Target username to log out.",
                required: true,
                type: 3
            },
            {
                name: "reason",
                description: "Reason for logging out the user (optional).",
                required: false,
                type: 3
            }
        ]
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        // Check if user has moderator permissions
        if (!config.moderators.includes(interaction.user.id)) {
            return interaction.editReply({ 
                content: "❌ You do not have moderator permissions to use this command.", 
                ephemeral: true 
            });
        }

        const { options } = interaction;
        const username = options.get("username").value;
        const reason = options.get("reason")?.value || "No reason provided";

        // Find the target user
        const targetUser = await User.findOne({ username_lower: username.toLowerCase() });

        if (!targetUser) {
            return interaction.editReply({ 
                content: `❌ The account username **${username}** does not exist.`, 
                ephemeral: true 
            });
        }

        // Set forceLogout flag in database
        await targetUser.updateOne({ $set: { forceLogout: true } });

        // Invalidate all tokens for this user
        let refreshToken = global.refreshTokens.findIndex(i => i.accountId == targetUser.accountId);
        if (refreshToken != -1) {
            global.refreshTokens.splice(refreshToken, 1);
        }

        let accessToken = global.accessTokens.findIndex(i => i.accountId == targetUser.accountId);
        if (accessToken != -1) {
            global.accessTokens.splice(accessToken, 1);

            // Close XMPP connection if user is online
            let xmppClient = global.Clients.find(client => client.accountId == targetUser.accountId);
            if (xmppClient) {
                xmppClient.client.close();
            }
        }

        // Update tokens
        if (accessToken != -1 || refreshToken != -1) {
            functions.UpdateTokens();
        }

        // Try to DM the user
        let dmStatus = "";
        if (targetUser.discordId) {
            try {
                const discordUser = await interaction.client.users.fetch(targetUser.discordId);
                const logoutEmbed = new MessageEmbed()
                    .setTitle("🔒 Logged Out by Moderator")
                    .setDescription("You have been logged out of the launcher by a moderator.")
                    .setColor("#ff6600")
                    .addField("Reason", reason, false)
                    .addField("What to do?", "You can log back in to the launcher. If you believe this was a mistake, please contact a moderator.")
                    .setTimestamp()
                    .setFooter({
                        text: "Midnight Backend Admin Team",
                        iconURL: interaction.guild?.iconURL() || undefined
                    });

                await discordUser.send({ embeds: [logoutEmbed] });
                dmStatus = " (User notified via DM)";
            } catch (err) {
                dmStatus = " (Could not DM user - DMs closed or user not found)";
            }
        } else {
            dmStatus = " (User has no linked Discord)";
        }

        // Check if user was actually logged in
        const wasLoggedIn = accessToken != -1 || refreshToken != -1;
        const statusText = wasLoggedIn 
            ? "Successfully logged out" 
            : "User was not logged in, but tokens have been cleared";

        // Create response embed
        const responseEmbed = new MessageEmbed()
            .setTitle("🔒 User Deactivated")
            .setDescription(`${statusText} **${targetUser.username}** from the launcher.${dmStatus}`)
            .setColor("#ff6600")
            .addField("Username", targetUser.username, true)
            .addField("Email", targetUser.email, true)
            .addField("Was Logged In", wasLoggedIn ? "Yes" : "No", true)
            .addField("Reason", reason, false)
            .addField("Action By", interaction.user.tag, false)
            .setTimestamp();

        return interaction.editReply({ embeds: [responseEmbed], ephemeral: true });
    }
}
