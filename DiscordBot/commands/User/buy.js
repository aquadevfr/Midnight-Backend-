const { MessageEmbed } = require("discord.js");
const Users = require('../../../model/user.js');
const Profiles = require('../../../model/profiles.js');
const log = require("../../../structs/log.js");
const functions = require("../../../structs/functions.js");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

let shopCache = {
    timestamp: 0,
    items: []
};

module.exports = {
    commandInfo: {
        name: "buy",
        description: "Buy a cosmetic from the current item shop.",
        options: [
            {
                name: "slot",
                description: "The shop slot to buy from.",
                type: 3,
                required: true,
                autocomplete: true
            }
        ]
    },
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const catalogConfigPath = path.join(__dirname, '..', '..', '..', 'Config', 'catalog_config.json');

        try {
            let fileStats = fs.statSync(catalogConfigPath);
            if (fileStats.mtimeMs > shopCache.timestamp || shopCache.items.length === 0) {
                const catalogConfig = JSON.parse(fs.readFileSync(catalogConfigPath, 'utf8'));
                const newItems = [];

                const promises = [];

                for (const [key, entry] of Object.entries(catalogConfig)) {
                    if (key === "//" || !entry.itemGrants || entry.itemGrants.length === 0) continue;

                    const grant = entry.itemGrants[0];
                    const cleanId = grant.split(':')[1] || grant;
                    const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/(\d+)/, " $1");

                    promises.push(
                        axios.get(`https://fortnite-api.com/v2/cosmetics/br/search`, {
                            params: { id: cleanId }
                        }).then(response => {
                            if (response.data && response.data.data) {
                                return {
                                    name: `${response.data.data.name} (${displayKey})`,
                                    value: key
                                };
                            }
                            return { name: `Unknown Item (${displayKey})`, value: key };
                        }).catch(err => {
                            return { name: `${grant} (${displayKey})`, value: key };
                        })
                    );
                }

                const results = await Promise.all(promises);
                shopCache.items = results;
                shopCache.timestamp = Date.now();
            }

            const filtered = shopCache.items.filter(choice => 
                choice.name.toLowerCase().includes(focusedValue.toLowerCase())
            );

            await interaction.respond(filtered.slice(0, 25));

        } catch (error) {
            log.error(`Autocomplete error: ${error}`);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const user = await Users.findOne({ discordId: interaction.user.id });
            if (!user) {
                return interaction.editReply({ content: "You are not registered", ephemeral: true });
            }

            const slot = interaction.options.getString("slot");
            const catalogConfigPath = path.join(__dirname, '..', '..', '..', 'Config', 'catalog_config.json');
            
            if (!fs.existsSync(catalogConfigPath)) {
                return interaction.editReply({ content: "Item shop configuration not found.", ephemeral: true });
            }

            const catalogConfig = JSON.parse(fs.readFileSync(catalogConfigPath, 'utf8'));
            const shopEntry = catalogConfig[slot];

            if (!shopEntry || !shopEntry.itemGrants || shopEntry.itemGrants.length === 0) {
                return interaction.editReply({ content: "This slot is currently empty.", ephemeral: true });
            }

            const price = shopEntry.price;
            const itemGrants = shopEntry.itemGrants;

            const userProfile = await Profiles.findOne({ accountId: user.accountId });
            if (!userProfile) {
                return interaction.editReply({ content: "Profile not found.", ephemeral: true });
            }

            const common_core = userProfile.profiles["common_core"];
            const profile0 = userProfile.profiles["profile0"];
            const athena = userProfile.profiles["athena"];

            for (const grant of itemGrants) {
                const alreadyOwned = Object.values(athena.items).some(item => 
                    item.templateId.toLowerCase() === grant.toLowerCase()
                );

                if (alreadyOwned) {
                    return interaction.editReply({ content: `You already own one or more items from this slot (${grant}).`, ephemeral: true });
                }
            }

            let vbucksItemKey = null;
            let currentVBucks = 0;

            for (const key in common_core.items) {
                if (common_core.items[key].templateId.toLowerCase().startsWith("currency:mtx")) {
                    vbucksItemKey = key;
                    currentVBucks = common_core.items[key].quantity;
                    break;
                }
            }

            if (!vbucksItemKey || currentVBucks < price) {
                return interaction.editReply({ 
                    content: `You cannot afford this item. Price: **${price}**. You have: **${currentVBucks}**.`, 
                    ephemeral: true 
                });
            }

            const newQuantity = currentVBucks - price;
            
            const newItems = {};
            const createdItemNames = [];

            for (const grant of itemGrants) {
                const newItemId = functions.MakeID();
                const newItem = {
                    templateId: grant,
                    attributes: {
                        item_seen: false,
                        variants: [],
                        favorite: false,
                        creation_time: new Date().toISOString()
                    },
                    quantity: 1
                };
                newItems[newItemId] = newItem;
                createdItemNames.push(grant);
            }

            const updateSet = {};
            
            updateSet[`profiles.common_core.items.${vbucksItemKey}.quantity`] = newQuantity;
            updateSet[`profiles.profile0.items.${vbucksItemKey}.quantity`] = newQuantity;

            for (const [id, item] of Object.entries(newItems)) {
                updateSet[`profiles.athena.items.${id}`] = item;
            }

            const commonCoreRvn = (common_core.rvn || 0) + 1;
            const commonCoreCmdRvn = (common_core.commandRevision || 0) + 1;
            const profile0Rvn = (profile0.rvn || 0) + 1;
            const profile0CmdRvn = (profile0.commandRevision || 0) + 1;
            const athenaRvn = (athena.rvn || 0) + 1;
            const athenaCmdRvn = (athena.commandRevision || 0) + 1;

            updateSet["profiles.common_core.rvn"] = commonCoreRvn;
            updateSet["profiles.common_core.commandRevision"] = commonCoreCmdRvn;
            updateSet["profiles.profile0.rvn"] = profile0Rvn;
            updateSet["profiles.profile0.commandRevision"] = profile0CmdRvn;
            updateSet["profiles.athena.rvn"] = athenaRvn;
            updateSet["profiles.athena.commandRevision"] = athenaCmdRvn;

            await Profiles.updateOne(
                { accountId: user.accountId },
                { $set: updateSet }
            );

             const embed = new MessageEmbed()
                .setTitle("Purchase Successful!")
                .setDescription(`You bought **${slot}** for **${price} V-Bucks**.\n\nItems added:\n${createdItemNames.join('\n')}`)
                .setColor("#1eff00")
                .setFooter({
                    text: `New Balance: ${newQuantity} V-Bucks`,
                    iconURL: "https://i.imgur.com/2RImwlb.png"
                });

            await interaction.editReply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            log.error(`Buy command error: ${error}`);
            if (!interaction.replied) {
                await interaction.editReply({ content: "An error occurred while processing your purchase.", ephemeral: true });
            }
        }
    }
};
