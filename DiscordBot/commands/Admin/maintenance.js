const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../../../Config/config.json");

module.exports = {
    commandInfo: {
        name: "maintenance",
        description: "Enable maintenance mode - blocks all launcher access.",
        options: [
            {
                name: "reason",
                description: "Reason for maintenance (optional).",
                required: false,
                type: 3
            }
        ]
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

        const { options } = interaction;
        const reason = options.get("reason")?.value || "Server maintenance in progress";

        // Check if already in maintenance mode
        if (config.maintenanceMode === true) {
            return interaction.editReply({ 
                content: "ℹ️ Maintenance mode is already enabled.", 
                ephemeral: true 
            });
        }

        // Enable maintenance mode
        config.maintenanceMode = true;
        config.maintenanceReason = reason;
        config.maintenanceEnabledBy = interaction.user.tag;
        config.maintenanceEnabledAt = new Date().toISOString();

        // Save config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        // Create response embed
        const responseEmbed = new MessageEmbed()
            .setTitle("🔧 Maintenance Mode Enabled")
            .setDescription("The launcher has been put into maintenance mode. All users will be blocked from accessing the launcher.")
            .setColor("#ff9900")
            .addField("Reason", reason, false)
            .addField("Enabled By", interaction.user.tag, true)
            .addField("Status", "🔴 ACTIVE", true)
            .addField("What happens now?", "• All users currently in the launcher will be kicked out within 30 seconds\n• Login attempts will show the maintenance screen\n• Only you can disable maintenance with `/unmaintenance`")
            .setTimestamp()
            .setFooter({
                text: "Midnight Backend Admin",
                iconURL: interaction.guild?.iconURL() || undefined
            });

        await interaction.editReply({ embeds: [responseEmbed], ephemeral: true });

        // Announce in a channel if configured (optional)
        console.log(`[MAINTENANCE] Mode enabled by ${interaction.user.tag}: ${reason}`);
    }
}
