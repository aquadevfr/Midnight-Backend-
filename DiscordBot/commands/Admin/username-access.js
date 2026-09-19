const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./Config/config.json").toString());

module.exports = {
    commandInfo: {
        name: "username-access",
        description: "Grant or revoke unlimited username changes for a user.",
        options: [
            {
                name: "username",
                description: "Target username.",
                required: true,
                type: 3
            },
            {
                name: "action",
                description: "Grant or revoke unlimited username changes.",
                required: true,
                type: 3,
                choices: [
                    {
                        name: "Grant",
                        value: "grant"
                    },
                    {
                        name: "Revoke",
                        value: "revoke"
                    }
                ]
            }
        ]
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        // Check if user has moderator permissions
        if (!config.moderators.includes(interaction.user.id)) {
            return interaction.editReply({ 
                content: "❌ You do not have administrator permissions to use this command.", 
                ephemeral: true 
            });
        }

        const { options } = interaction;
        const username = options.get("username").value;
        const action = options.get("action").value;

        // Find the target user
        const targetUser = await User.findOne({ username_lower: username.toLowerCase() });

        if (!targetUser) {
            return interaction.editReply({ 
                content: `❌ The account username **${username}** does not exist.`, 
                ephemeral: true 
            });
        }

        // Grant or revoke unlimited username changes
        if (action === "grant") {
            if (targetUser.unlimitedUsernameChanges) {
                return interaction.editReply({ 
                    content: `ℹ️ **${targetUser.username}** already has unlimited username changes.`, 
                    ephemeral: true 
                });
            }

            await targetUser.updateOne({ $set: { unlimitedUsernameChanges: true } });

            // Try to DM the user
            let dmStatus = "";
            if (targetUser.discordId) {
                try {
                    const discordUser = await interaction.client.users.fetch(targetUser.discordId);
                    const grantEmbed = new MessageEmbed()
                        .setTitle("✨ Unlimited Username Changes Granted")
                        .setDescription(`Your account **${targetUser.username}** has been granted unlimited username changes!`)
                        .setColor("#00ff00")
                        .addField("What does this mean?", "You can now change your username as many times as you want without waiting for the 20-day cooldown period.")
                        .setTimestamp()
                        .setFooter({
                            text: "Midnight Backend Admin Team",
                            iconURL: interaction.guild?.iconURL() || undefined
                        });

                    await discordUser.send({ embeds: [grantEmbed] });
                    dmStatus = " (User notified via DM)";
                } catch (err) {
                    dmStatus = " (Could not DM user)";
                }
            } else {
                dmStatus = " (User has no linked Discord)";
            }

            const responseEmbed = new MessageEmbed()
                .setTitle("✅ Username Access Granted")
                .setDescription(`Successfully granted unlimited username changes to **${targetUser.username}**.${dmStatus}`)
                .setColor("#00ff00")
                .addField("Username", targetUser.username, true)
                .addField("Email", targetUser.email, true)
                .addField("Action By", interaction.user.tag, false)
                .setTimestamp();

            return interaction.editReply({ embeds: [responseEmbed], ephemeral: true });

        } else if (action === "revoke") {
            if (!targetUser.unlimitedUsernameChanges) {
                return interaction.editReply({ 
                    content: `ℹ️ **${targetUser.username}** does not have unlimited username changes.`, 
                    ephemeral: true 
                });
            }

            await targetUser.updateOne({ $set: { unlimitedUsernameChanges: false } });

            // Try to DM the user
            let dmStatus = "";
            if (targetUser.discordId) {
                try {
                    const discordUser = await interaction.client.users.fetch(targetUser.discordId);
                    const revokeEmbed = new MessageEmbed()
                        .setTitle("⚠️ Unlimited Username Changes Revoked")
                        .setDescription(`Your unlimited username changes for account **${targetUser.username}** have been revoked.`)
                        .setColor("#ff9900")
                        .addField("What does this mean?", "You are now subject to the standard 20-day cooldown period between username changes.")
                        .setTimestamp()
                        .setFooter({
                            text: "Midnight Backend Admin Team",
                            iconURL: interaction.guild?.iconURL() || undefined
                        });

                    await discordUser.send({ embeds: [revokeEmbed] });
                    dmStatus = " (User notified via DM)";
                } catch (err) {
                    dmStatus = " (Could not DM user)";
                }
            } else {
                dmStatus = " (User has no linked Discord)";
            }

            const responseEmbed = new MessageEmbed()
                .setTitle("⚠️ Username Access Revoked")
                .setDescription(`Successfully revoked unlimited username changes from **${targetUser.username}**.${dmStatus}`)
                .setColor("#ff9900")
                .addField("Username", targetUser.username, true)
                .addField("Email", targetUser.email, true)
                .addField("Action By", interaction.user.tag, false)
                .setTimestamp();

            return interaction.editReply({ embeds: [responseEmbed], ephemeral: true });
        }
    }
}
