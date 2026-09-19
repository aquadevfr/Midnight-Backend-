const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./Config/config.json").toString());
const tui = require("./tui.js");

function getTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US');
    const time = now.toLocaleTimeString();
    
    return `${date} ${time}`; 
}

function formatLog(prefixColor, prefix, ...args) {
    let msg = args.join(" ");
    let formattedMessage = `${prefixColor}[${getTimestamp()}] ${prefix}\x1b[0m: ${msg}`;
    tui.addLog(formattedMessage);
}

function backend(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[35m", "Midnight Backend Log", ...args);
    } else {
        tui.addLog(`\x1b[35mMidnight Backend Log\x1b[0m: ${msg}`);
    }
}

function bot(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[36m", "Midnight Bot Log", ...args);
    } else {
        tui.addLog(`\x1b[36mMidnight Bot Log\x1b[0m: ${msg}`);
    }
}

function xmpp(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[34m", "Midnight Xmpp Log", ...args);
    } else {
        tui.addLog(`\x1b[34mMidnight Xmpp Log\x1b[0m: ${msg}`);
    }
}

function error(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[31m", "Midnight Error Log", ...args);
    } else {
        tui.addLog(`\x1b[31mMidnight Error Log\x1b[0m: ${msg}`);
    }
}

function debug(...args) {
    if (config.bEnableDebugLogs) {
        let msg = args.join(" ");
        if (config.bEnableFormattedLogs) {
            formatLog("\x1b[33m", "Midnight Debug Log", ...args);
        } else {
            tui.addLog(`\x1b[33mMidnight Debug Log\x1b[0m: ${msg}`);
        }
    }
}

function website(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[32m", "Midnight Website Log", ...args);
    } else {
        tui.addLog(`\x1b[32mMidnight Website Log\x1b[0m: ${msg}`);
    }
}

function AutoRotation(...args) {
    if (config.bEnableAutoRotateDebugLogs) {
        let msg = args.join(" ");
        if (config.bEnableFormattedLogs) {
            formatLog("\x1b[96m", "Midnight AutoRotation Debug Log", ...args);
        } else {
            tui.addLog(`\x1b[96mMidnight AutoRotation Debug Log\x1b[0m: ${msg}`);
        }
    }
}

function checkforupdate(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[95m", "Midnight Update Log", ...args);
    } else {
        tui.addLog(`\x1b[95mMidnight Update Log\x1b[0m: ${msg}`);
    }
}

function autobackendrestart(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[92m", "Midnight Auto Restart Log", ...args);
    } else {
        tui.addLog(`\x1b[92mMidnight Auto Restart\x1b[0m: ${msg}`);
    }
}

function calderaservice(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[91m", "Caldera Service Log", ...args);
    } else {
        tui.addLog(`\x1b[91mCaldera Service\x1b[0m: ${msg}`);
    }
}

module.exports = {
    backend,
    bot,
    xmpp,
    error,
    debug,
    website,
    AutoRotation,
    checkforupdate,
    autobackendrestart,
    calderaservice
};