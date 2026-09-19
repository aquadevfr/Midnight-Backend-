const blessed = require('blessed');
const contrib = require('blessed-contrib');
const chalk = require('chalk');

let screen;
let log;
let stats;
let header;
let startTime = Date.now();
let logsReady = false;
let pendingLogs = [];

function init() {
    screen = blessed.screen({
        smartCSR: true,
        title: '🌙 Midnight Backend - Dashboard',
        fullUnicode: true,
        mouse: true
    });

    const grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

    
    header = grid.set(0, 0, 2, 12, blessed.box, {
        content: `\n {bold}{magenta-fg} MIDNIGHT BACKEND {/magenta-fg}{/bold}\n {cyan-fg}Made by 19.10 and Aqua{/cyan-fg}`,
        tags: true,
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } }
    });

    
    log = grid.set(2, 0, 8, 9, blessed.log, {
        fg: "cyan",
        label: ' 🌙 Midnight Logs ',
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } },
        mouse: false,
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
            ch: '█',
            inverse: true,
            style: {
                fg: 'magenta'
            }
        }
    });

    
    stats = grid.set(2, 9, 8, 3, blessed.box, {
        label: ' ⚡ System Status ',
        content: 'Loading...',
        tags: true,
        border: { type: 'line' },
        style: { border: { fg: 'cyan' } }
    });

    
    const footer = grid.set(10, 0, 2, 12, blessed.box, {
        content: ' {bold}{magenta-fg}F6{/magenta-fg}{/bold}: Restart  |  {bold}{magenta-fg}W{/magenta-fg}{/bold} - Scroll Up  |  {bold}{cyan-fg}S{/cyan-fg}{/bold} - Scroll Down',
        tags: true,
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } }
    });

    screen.key(['f6'], function() {
        
        return process.exit(0);
    });

    
    screen.key(['w', 'W'], function() {
        log.scroll(-2);
        screen.render();
    });

    screen.key(['s', 'S'], function() {
        log.scroll(2);
        screen.render();
    });

    screen.render();
}

function addLog(message) {
    if (!logsReady) {
        pendingLogs.push(message);
        return;
    }
    
    if (log && log.log) {
        log.log(message);
        screen.render();
    } else {
        console.log(message);
    }
}

function flushPendingLogs() {
    if (log && log.log) {
        pendingLogs.forEach(msg => {
            log.log(msg);
        });
        pendingLogs = [];
        screen.render();
    }
}

function showWelcomeMessage() {
    if (log && log.log) {
        setTimeout(() => {
            log.log('');
            log.log('');
            screen.render();
        }, 100);
        
        setTimeout(() => {
            log.log('    ███╗   ███╗██╗██████╗ ███╗   ██╗██╗ ██████╗ ██╗  ██╗████████╗');
            screen.render();
        }, 300);
        
        setTimeout(() => {
            log.log('    ████╗ ████║██║██╔══██╗████╗  ██║██║██╔════╝ ██║  ██║╚══██╔══╝');
            screen.render();
        }, 500);
        
        setTimeout(() => {
            log.log('    ██╔████╔██║██║██║  ██║██╔██╗ ██║██║██║  ███╗███████║   ██║   ');
            screen.render();
        }, 700);
        
        setTimeout(() => {
            log.log('    ██║╚██╔╝██║██║██║  ██║██║╚██╗██║██║██║   ██║██╔══██║   ██║   ');
            screen.render();
        }, 900);
        
        setTimeout(() => {
            log.log('    ██║ ╚═╝ ██║██║██████╔╝██║ ╚████║██║╚██████╔╝██║  ██║   ██║   ');
            screen.render();
        }, 1100);
        
        setTimeout(() => {
            log.log('    ╚═╝     ╚═╝╚═╝╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ');
            screen.render();
        }, 1300);
        
        setTimeout(() => {
            log.log('');
            screen.render();
        }, 1500);
        
        setTimeout(() => {
            log.log('                      ██████╗  █████╗  ██████╗██╗  ██╗███████╗███╗   ██╗██████╗ ');
            screen.render();
        }, 1700);
        
        setTimeout(() => {
            log.log('                      ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝████╗  ██║██╔══██╗');
            screen.render();
        }, 1900);
        
        setTimeout(() => {
            log.log('                      ██████╔╝███████║██║     █████╔╝ █████╗  ██╔██╗ ██║██║  ██║');
            screen.render();
        }, 2100);
        
        setTimeout(() => {
            log.log('                      ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██║╚██╗██║██║  ██║');
            screen.render();
        }, 2300);
        
        setTimeout(() => {
            log.log('                      ██████╔╝██║  ██║╚██████╗██║  ██╗███████╗██║ ╚████║██████╔╝');
            screen.render();
        }, 2500);
        
        setTimeout(() => {
            log.log('                      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ');
            screen.render();
        }, 2700);
        
        setTimeout(() => {
            log.log('');
            log.log('');
            screen.render();
        }, 2900);
        
        setTimeout(() => {
            log.log('');
            screen.render();
        }, 3100);
        
        setTimeout(() => {
            log.log('    ██╗      ██████╗  █████╗ ██████╗ ██╗███╗   ██╗ ██████╗     ██╗      ██████╗  ██████╗ ███████╗');
            screen.render();
        }, 3300);
        
        setTimeout(() => {
            log.log('    ██║     ██╔═══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝     ██║     ██╔═══██╗██╔════╝ ██╔════╝');
            screen.render();
        }, 3500);
        
        setTimeout(() => {
            log.log('    ██║     ██║   ██║███████║██║  ██║██║██╔██╗ ██║██║  ███╗    ██║     ██║   ██║██║  ███╗███████╗');
            screen.render();
        }, 3700);
        
        setTimeout(() => {
            log.log('    ██║     ██║   ██║██╔══██║██║  ██║██║██║╚██╗██║██║   ██║    ██║     ██║   ██║██║   ██║╚════██║');
            screen.render();
        }, 3900);
        
        setTimeout(() => {
            log.log('    ███████╗╚██████╔╝██║  ██║██████╔╝██║██║ ╚████║╚██████╔╝    ███████╗╚██████╔╝╚██████╔╝███████║');
            screen.render();
        }, 4100);
        
        setTimeout(() => {
            log.log('    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝');
            screen.render();
        }, 4300);
        
        setTimeout(() => {
            log.log('');
            log.log('');
            screen.render();
        }, 4500);
        
        // After 5 seconds from the Loading Logs message, enable logs and flush pending ones
        setTimeout(() => {
            logsReady = true;
            flushPendingLogs();
        }, 9300);
    }
}

function formatUptime() {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const secs = uptimeSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStats(data) {
    if (stats) {
        let content = '\n';
        content += `{bold}{magenta-fg}🌐 Port:{/magenta-fg}{/bold} {cyan-fg}${data.port || 'N/A'}{/cyan-fg}\n\n`;
        content += `{bold}{magenta-fg}🌍 Website:{/magenta-fg}{/bold} {cyan-fg}${data.websitePort || 'N/A'}{/cyan-fg}\n\n`;
        content += `{bold}{magenta-fg}🗄️  MongoDB:{/magenta-fg}{/bold} ${data.mongodb || '{yellow-fg}Connecting...{/yellow-fg}'}\n\n`;
        content += `{bold}{magenta-fg}💬 XMPP:{/magenta-fg}{/bold} ${data.xmpp ? '{green-fg}✓ ON{/green-fg}' : '{red-fg}✗ OFF{/red-fg}'}\n\n`;
        content += `{bold}{magenta-fg}🤖 Bot:{/magenta-fg}{/bold} ${data.bot ? '{green-fg}✓ ON{/green-fg}' : '{red-fg}✗ OFF{/red-fg}'}\n\n`;
        content += `{bold}{magenta-fg}👥 Players:{/magenta-fg}{/bold} {cyan-fg}${data.players || 0}{/cyan-fg}`;
        
        stats.setContent(content);
        screen.render();
    }
}

module.exports = {
    init,
    addLog,
    updateStats,
    showWelcomeMessage
};
