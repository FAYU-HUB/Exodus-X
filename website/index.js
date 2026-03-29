const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-autoeat');
const armorManager = require('mineflayer-armor-manager');
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

let bot = null;
let botConfig = {
    host: 'localhost',
    port: 25565,
    auth: 'microsoft',
    features: { killAura: false, antiKb: true, autoEat: true }
};

io.on('connection', (socket) => {
    console.log('[WEB] Pengguna terhubung.');

    socket.on('startBot', (config) => {
        if (bot) return socket.emit('log', 'Bot sudah berjalan!');
        botConfig = { ...botConfig, ...config };
        initBot(socket);
    });

    socket.on('sendCommand', (cmd) => {
        if (bot) bot.chat(cmd);
    });

    socket.on('toggleFeature', (feature) => {
        botConfig.features[feature] = !botConfig.features[feature];
        socket.emit('log', `Fitur ${feature}: ${botConfig.features[feature] ? 'AKTIF' : 'MATI'}`);
    });
});

function initBot(socket) {
    socket.emit('log', `Mencoba menyambung ke ${botConfig.host}...`);
    
    bot = mineflayer.createBot({
        host: botConfig.host,
        port: parseInt(botConfig.port),
        auth: botConfig.auth
    });

    bot.loadPlugin(autoeat);
    bot.loadPlugin(armorManager);

    bot.on('login', () => {
        socket.emit('status', { connected: true, username: bot.username });
        socket.emit('log', `Berhasil masuk sebagai ${bot.username}`);
    });

    bot.on('spawn', () => {
        socket.emit('log', 'Bot telah muncul di dunia.');
        
        setInterval(() => {
            if (!bot) return;
            socket.emit('updateStats', {
                health: bot.health,
                food: bot.food,
                pos: bot.entity.position
            });
        }, 1000);
    });

    setInterval(() => {
        if (!bot || !botConfig.features.killAura) return;
        const target = bot.nearestEntity((e) => (e.type === 'player' || e.type === 'mob') && e.position.distanceTo(bot.entity.position) < 4.5);
        if (target) {
            bot.lookAt(target.position.offset(0, target.height, 0));
            bot.attack(target);
        }
    }, 200);

    bot.on('chat', (username, message) => {
        socket.emit('chatMsg', { user: username, msg: message });
    });

    bot.on('error', (err) => socket.emit('log', `Galat: ${err.message}`));
    bot.on('end', (reason) => {
        socket.emit('status', { connected: false });
        socket.emit('log', `Bot terputus: ${reason}`);
        bot = null;
    });
}

server.listen(port, () => {
    console.log(`==========================================`);
    console.log(` DASHBOARD WEB EXODUS-X AKTIF `);
    console.log(` Alamat: http://localhost:${port} `);
    console.log(`==========================================`);
});

