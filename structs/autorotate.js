const axios = require('axios');
const fs = require('fs');
const path = require('path');
const log = require("./log.js");
const { generateShopImage } = require('./shopImageGenerator.js');
const { MessageEmbed, MessageAttachment } = require("discord.js");

const fortniteapi = "https://fortnite-api.com/v2/cosmetics/br";
const catalogcfg = path.join(__dirname, "..", 'Config', 'catalog_config.json');

const getConfig = () => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'Config', 'config.json')).toString());
    } catch (err) {
        log.error("Failed to read config.json in autorotate.js");
        return {};
    }
};

const getChapterLimit = () => getConfig().bChapterlimit || "1";
const getSeasonLimit = () => getConfig().bSeasonlimit || "10";
const getDailyItemsAmount = () => getConfig().bDailyItemsAmount || 6;
const getFeaturedItemsAmount = () => getConfig().bFeaturedItemsAmount || 2;

async function fetchitems() {
    try {
        const cfg = getConfig();
        const response = await axios.get(fortniteapi);
        const cosmetics = response.data.data || [];
        const excludedItems = cfg.bExcludedItems || [];

        return cosmetics.filter(item => {
            const { id, introduction, rarity } = item;
            const chapter = introduction?.chapter ? parseInt(introduction.chapter, 10) : null;
            const season = introduction?.season ? introduction.season.toString() : null;
            const itemRarity = rarity?.displayValue?.toLowerCase();

            if (!chapter || !season) return false;
            if (excludedItems.includes(id)) return false;

            const maxChapter = parseInt(getChapterLimit(), 10);
            const maxSeason = getSeasonLimit().toString();

            if (maxSeason === "OG") {
                return chapter >= 1 && chapter <= maxChapter && itemRarity !== "common";
            }

            if (
                chapter < 1 || chapter > maxChapter ||
                (chapter === maxChapter && (season === "X" || parseInt(season, 10) > parseInt(maxSeason, 10)))
            ) {
                return false;
            }

            return itemRarity !== "common";
        });
    } catch (error) {
        log.error('Error fetching cosmetics:', error.message || error);
        return [];
    }
}

async function fetchItemsByDate(dateStr) {
    try {
        const cfg = getConfig();
        const response = await axios.get(fortniteapi);
        const cosmetics = response.data.data || [];
        const excludedItems = cfg.bExcludedItems || [];
        const targetDate = dateStr.trim();

        const filtered = cosmetics.filter(item => {
            const { id, rarity, added } = item;
            if (!added) return false;

            const itemDate = added.substring(0, 10);
            if (itemDate !== targetDate) return false;

            if (excludedItems.includes(id)) return false;

            const itemRarity = rarity?.displayValue?.toLowerCase();
            if (itemRarity === "common") return false;

            return true;
        });

        log.AutoRotation(`Found ${filtered.length} cosmetics added on ${targetDate}`);
        return filtered;
    } catch (error) {
        log.error('Error fetching cosmetics by date:', error.message || error);
        return [];
    }
}

function pickRandomItems(items, count) {
    const itemTypeBuckets = {
        athenaCharacter: [],
        athenaDance: [],
        athenaBackpack: [],
        athenaGlider: [],
        athenaPickaxe: [],
        loadingScreen: [],
        emoji: []
    };

    items.forEach(item => {
        const type = item.type?.value.toLowerCase();
        switch (type) {
            case "outfit":
                itemTypeBuckets.athenaCharacter.push(item);
                break;
            case "emote":
                itemTypeBuckets.athenaDance.push(item);
                break;
            case "backpack":
                itemTypeBuckets.athenaBackpack.push(item);
                break;
            case "glider":
                itemTypeBuckets.athenaGlider.push(item);
                break;
            case "pickaxe":
                itemTypeBuckets.athenaPickaxe.push(item);
                break;
            case "loadingscreen":
                itemTypeBuckets.loadingScreen.push(item);
                break;
            case "emoji":
                itemTypeBuckets.emoji.push(item);
                break;
            default:
                break;
        }
    });

    const selectedItems = [];

    function addItemsFromBucket(bucket, requiredCount) {
        const availableItems = bucket.sort(() => 0.5 - Math.random()).slice(0, requiredCount);
        selectedItems.push(...availableItems);
    }

    addItemsFromBucket(itemTypeBuckets.athenaCharacter, Math.min(2, count));
    addItemsFromBucket(itemTypeBuckets.athenaDance, Math.min(1, count));
    addItemsFromBucket(itemTypeBuckets.athenaBackpack, Math.min(1, count));
    addItemsFromBucket(itemTypeBuckets.athenaGlider, Math.min(1, count));
    addItemsFromBucket(itemTypeBuckets.athenaPickaxe, Math.min(1, count));
    addItemsFromBucket(itemTypeBuckets.loadingScreen, Math.min(1, count));
    addItemsFromBucket(itemTypeBuckets.emoji, Math.min(1, count));

    const remainingCount = count - selectedItems.length;
    const remainingItems = items.filter(item => !selectedItems.includes(item));

    const extraItems = remainingItems.sort(() => 0.5 - Math.random()).slice(0, remainingCount);
    selectedItems.push(...extraItems);

    return selectedItems.slice(0, count);
}

function formatitemgrantsyk(item) {
    const { id, backendValue, type } = item;
    let itemType;

    switch (type.value.toLowerCase()) {
        case "outfit":
            itemType = "AthenaCharacter";  
            break;
        case "emote":
            itemType = "AthenaDance";  
            break;
        default:
            itemType = backendValue || `Athena${capitalizeomg(type.value)}`;
            break;
    }

    return [`${itemType}:${id}`];
}

function capitalizeomg(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function notproperpricegen(item) {
    const rarity = item.rarity?.displayValue?.toLowerCase();
    const type = item.type?.value?.toLowerCase();
    const series = item.series?.value?.toLowerCase();

    if (series) {
        switch (series) {
            case 'gaming legends series':
            case 'marvel series':
            case 'star wars series':
            case 'dc series':
            case 'icon series':
                switch (type) {
                    case 'outfit': return 1500;
                    case 'pickaxe': return 1200;
                    case 'backpack': return 1200;
                    case 'emote': return 500;
                    case 'glider': return 1200;
                    case 'wrap': return 700;
                    case 'loadingscreen': return 500;
                    case 'music': return 200;
                    case 'emoji': return 200;
                    default: return 999999;
                }
            case 'lava series':
                switch (type) {
                    case 'outfit':
                    case 'glider':
                    case 'backpack': return 2000;
                    case 'pickaxe': return 1200;
                    case 'loadingscreen': return 500;
                    case 'music': return 200;
                    case 'emoji': return 200;
                    default: return 999999;
                }
            case 'shadow series':
            case 'frozen series':
            case 'slurp series':
            case 'dark series':
                switch (type) {
                    case 'outfit': return 1500;
                    case 'pickaxe': return 1200;
                    case 'backpack': return 1200;
                    case 'glider': return 1200;
                    case 'wrap': return 700;
                    case 'loadingscreen': return 500;
                    case 'music': return 200;
                    case 'emoji': return 200;
                    default: return 999999;
                }
            default: return 999999;
        }
    }

    switch (type) {
        case 'outfit':
            switch (rarity) {
                case 'legendary': return 2000;
                case 'epic': return 1500;
                case 'rare': return 1200;
                case 'uncommon': return 800;
                default: return 999999;
            }
        case 'pickaxe':
            switch (rarity) {
                case 'epic': return 1200;
                case 'rare': return 800;
                case 'uncommon': return 500;
                default: return 999999;
            }
        case 'backpack':
            switch (rarity) {
                case 'legendary': return 2000;
                case 'epic': return 1500;
                case 'rare': return 1200;
                case 'uncommon': return 200;
                default: return 999999;
            }
        case 'emote':
        case 'spray':
        case 'emoji':
            switch (rarity) {
                case 'legendary': return 2000;
                case 'epic': return 800;
                case 'rare': return 500;
                case 'uncommon': return 200;
                default: return 999999;
            }
        case 'glider':
            switch (rarity) {
                case 'legendary': return 2000;
                case 'epic': return 1200;
                case 'rare': return 800;
                case 'uncommon': return 500;
                default: return 999999;
            }
        case 'wrap':
            switch (rarity) {
                case 'legendary': return 1200;
                case 'epic': return 700;
                case 'rare': return 500;
                case 'uncommon': return 300;
                default: return 999999;
            }
        case 'loadingscreen':
            switch (rarity) {
                case 'legendary':
                case 'epic':
                case 'rare': return 500;
                case 'uncommon': return 200;
                default: return 999999;
            }
        case 'music':
            switch (rarity) {
                case 'legendary':
                case 'epic': return 500;
                case 'rare':
                case 'uncommon': return 200;
                default: return 999999;
            }
        default: return 999999;
    }
}

function updatecfgomg(dailyItems, featuredItems) {
    const catalogConfig = { "//": "BR Item Shop Config" };

    dailyItems.forEach((item, index) => {
        catalogConfig[`daily${index + 1}`] = {
            itemGrants: formatitemgrantsyk(item),
            price: notproperpricegen(item)
        };
    });

    featuredItems.forEach((item, index) => {
        catalogConfig[`featured${index + 1}`] = {
            itemGrants: formatitemgrantsyk(item),
            price: notproperpricegen(item)
        };
    });

    fs.writeFileSync(catalogcfg, JSON.stringify(catalogConfig, null, 2), 'utf-8');
    log.AutoRotation("The item shop has rotated!");
}

async function discordpost(itemShop) {
    const cfg = getConfig();
    if (cfg.discord.bUseDiscordBot !== true || !cfg.bItemShopChannelId) return;

    function getNextRotationTime() {
        const now = new Date();
        const [localHour, localMinute] = (cfg.bRotateTime || "00:00").split(':').map(Number);
        const nextRotation = new Date(now);
        nextRotation.setHours(localHour, localMinute, 0, 0);
        if (now >= nextRotation) {
            nextRotation.setDate(nextRotation.getDate() + 1);
        }
        return nextRotation;
    }

    const nextRotation = getNextRotationTime();
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.floor((nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60)));

    try {
        const featuredWithPrices = itemShop.featured.map(item => ({
            ...item, price: notproperpricegen(item)
        }));
        const dailyWithPrices = itemShop.daily.map(item => ({
            ...item, price: notproperpricegen(item)
        }));

        const imageBuffer = await generateShopImage({
            featured: featuredWithPrices,
            daily: dailyWithPrices
        });

        if (global.discordClient) {
            const channel = await global.discordClient.channels.cache.get(cfg.bItemShopChannelId) ||
                await global.discordClient.channels.fetch(cfg.bItemShopChannelId).catch(() => null);

            if (channel) {
                const attachment = new MessageAttachment(imageBuffer, 'shop.png');
                const embed = new MessageEmbed()
                    .setTitle(`Reload ItemShop`)
                    .setDescription(`Shop resets in **${hoursRemaining} hours**.`)
                    .setColor(0x3498db)
                    .setImage('attachment://shop.png')
                    .setFooter({
                        text: `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                    });

                await channel.send({ embeds: [embed], files: [attachment] });
                log.AutoRotation(`Item shop posted successfully via Discord Bot.`);
            } else {
                log.error(`Could not find Discord channel with ID: ${cfg.bItemShopChannelId}`);
            }
        }
    } catch (error) {
        log.error(`Error sending item shop to Discord: ${error.message}`);
    }
}

async function rotateshop() {
    try {
        const cfg = getConfig();
        let dailyItems, featuredItems;

        if (cfg.bUseCustomShopDate && cfg.bCustomShopDate) {
            log.AutoRotation(`Custom shop date enabled, fetching cosmetics from: ${cfg.bCustomShopDate}`);
            const dateItems = await fetchItemsByDate(cfg.bCustomShopDate);

            if (dateItems.length === 0) {
                log.error(`No cosmetics found for date: ${cfg.bCustomShopDate}, falling back to random rotation`);
                const cosmetics = await fetchitems();
                if (cosmetics.length === 0) {
                    log.error('No cosmetics found?');
                    return;
                }
                dailyItems = pickRandomItems(cosmetics, getDailyItemsAmount());
                featuredItems = pickRandomItems(cosmetics, getFeaturedItemsAmount());
            } else {
                const shuffled = dateItems.sort(() => 0.5 - Math.random());
                featuredItems = shuffled.slice(0, Math.min(getFeaturedItemsAmount(), shuffled.length));
                const remaining = shuffled.slice(featuredItems.length);
                dailyItems = remaining.slice(0, Math.min(getDailyItemsAmount(), remaining.length));

                log.AutoRotation(`Custom date shop: ${featuredItems.length} featured, ${dailyItems.length} daily items from ${cfg.bCustomShopDate}`);
            }
        } else {
            const cosmetics = await fetchitems();
            if (cosmetics.length === 0) {
                log.error('No cosmetics found?');
                return;
            }
            dailyItems = pickRandomItems(cosmetics, getDailyItemsAmount());
            featuredItems = pickRandomItems(cosmetics, getFeaturedItemsAmount());
        }

        updatecfgomg(dailyItems, featuredItems);
        await discordpost({ daily: dailyItems, featured: featuredItems });

        const nextRotationTime = milisecstillnextrotation();
        log.AutoRotation(`Scheduling next rotation in: ${nextRotationTime} milliseconds`);
        
        setTimeout(rotateshop, nextRotationTime);

    } catch (error) {
        log.error('Error while rotating:', error.message || error);
    }
}

function milisecstillnextrotation() {
    const cfg = getConfig();
    const now = new Date();
    const [localHour, localMinute] = (cfg.bRotateTime || "00:00").toString().split(':').map(Number);
    let nextRotation = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHour, localMinute, 0);

    if (now.getTime() >= nextRotation.getTime()) {
        nextRotation.setDate(nextRotation.getDate() + 1);
    }

    const millisUntilNextRotation = nextRotation.getTime() - now.getTime();
    log.AutoRotation(`Current time: ${now.toLocaleString()}`);
    log.AutoRotation(`Next rotation time: ${nextRotation.toLocaleString()}`);
    log.AutoRotation(`Milliseconds until next rotation: ${millisUntilNextRotation}`);

    return millisUntilNextRotation;
}

(async () => {
    const cfg = getConfig();
    if (cfg.bUseCustomShopDate === true) {
        log.AutoRotation("Custom shop date IS ENABLED! Running initial rotation...");
        await rotateshop();
    } else {
        log.AutoRotation(`Auto rotation scheduled in ${Math.round(milisecstillnextrotation() / 1000 / 60)} minutes.`);
        setTimeout(rotateshop, milisecstillnextrotation());
    }
})();