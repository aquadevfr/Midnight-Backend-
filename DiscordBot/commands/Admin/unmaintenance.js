const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../../../Config/config.json");

module.exports = {
    commandInfo: {
        name: "unmaintenance",
        description: "Disable maintenance mode - allow launcher access again.",
        options: []
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        // Read config
        const config = JSON.parse(fs.readFileSync(configPath).toString());

        // Check if user has moderator permissions
        if (!config.moderators.includes(interaction.user.id)) {
            return interaction.editReply({ 
                content: "❌ You do not have moderator permissions to use this command.", 
                ephemeral: true 
            });
        }

        // Check if maintenance mode is disabled
        if (config.maintenanceMode === false) {
            return interaction.editReply({ 
                content: "ℹ️ Maintenance mode is already disabled.", 
                ephemeral: true 
            });
        }

        // Store info before disabling
        const wasEnabledBy = config.maintenanceEnabledBy || "Unknown";
        const wasEnabledAt = config.maintenanceEnabledAt || "Unknown";
        const wasReason = config.maintenanceReason || "No reason provided";

        // Disable maintenance mode
        config.maintenanceMode = false;
        delete config.maintenanceReason;
        delete config.maintenanceEnabledBy;
        delete config.maintenanceEnabledAt;

        // Save config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        // Create response embed
        const responseEmbed = new MessageEmbed()
            .setTitle("✅ Maintenance Mode Disabled")
            .setDescription("The launcher is now accessible again. Users can log in and use the launcher normally.")
            .setColor("#00ff00")
            .addField("Previous Reason", wasReason, false)
            .addField("Was Enabled By", wasEnabledBy, true)
            .addField("Disabled By", interaction.user.tag, true)
            .addField("Status", "🟢 OPERATIONAL", true)
            .addField("What happens now?", "• Users can log in normally\n• All launcher features are available\n• No restrictions are in place")
            .setTimestamp()
            .setFooter({
                text: "Midnight Backend Admin",
                iconURL: interaction.guild?.iconURL() || undefined
            });

        await interaction.editReply({ embeds: [responseEmbed], ephemeral: true });

        console.log(`[MAINTENANCE] Mode disabled by ${interaction.user.tag}`);
    }
}
