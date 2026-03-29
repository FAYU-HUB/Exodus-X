const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-autoeat');
const armorManager = require('mineflayer-armor-manager');
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const path = require('path');

// --- SETUP EXPRESS & SOCKET ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

app.get('/', (req, res) => {
    res.send(htmlContent); // Mengirim Dashboard ke Browser
});

// --- STATE MANAGEMENT ---
let bot = null;
let botConfig = {
    host: 'localhost',
    port: 25565,
    auth: 'microsoft',
    features: { killAura: false, antiKb: true, autoEat: true }
};

// --- WEBSOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('[WEB] User terhubung ke dashboard.');

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
        socket.emit('log', `Fitur ${feature}: ${botConfig.features[feature] ? 'ON' : 'OFF'}`);
    });
});

// --- MINEFLAYER LOGIC ---
function initBot(socket) {
    socket.emit('log', `[SYSTEM] Mencoba koneksi ke ${botConfig.host}...`);
    
    bot = mineflayer.createBot({
        host: botConfig.host,
        port: parseInt(botConfig.port),
        auth: botConfig.auth
    });

    bot.loadPlugin(autoeat);
    bot.loadPlugin(armorManager);

    bot.on('login', () => {
        socket.emit('status', { connected: true, username: bot.username });
        socket.emit('log', `[SUCCESS] Berhasil Login sebagai ${bot.username}`);
    });

    bot.on('spawn', () => {
        socket.emit('log', '[WORLD] Bot telah muncul di dunia.');
        
        // Update Stats secara berkala ke Web
        setInterval(() => {
            if (!bot) return;
            socket.emit('updateStats', {
                health: bot.health,
                food: bot.food,
                pos: bot.entity.position
            });
        }, 1000);
    });

    // Kill Aura Logic
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

    bot.on('error', (err) => socket.emit('log', `[ERROR] ${err.message}`));
    bot.on('end', (reason) => {
        socket.emit('status', { connected: false });
        socket.emit('log', `[END] Bot terputus: ${reason}`);
        bot = null;
    });
}

server.listen(port, () => {
    console.log(`==========================================`);
    console.log(` EXODUS-X WEB DASHBOARD AKTIF `);
    console.log(` Buka di browser: http://localhost:${port} `);
    console.log(`==========================================`);
});

// --- DASHBOARD HTML (CSS & JS BROWSER) ---
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Exodus-X Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { background: #0b0f1a; color: #fff; font-family: sans-serif; }
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .btn-active { background: #3b82f6; box-shadow: 0 0 15px #3b82f6; }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        
        <!-- HEADER -->
        <div class="col-span-12 glass p-6 rounded-2xl flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold tracking-tighter text-blue-400"><i class="fas fa-rocket mr-2"></i>EXODUS-X WEB</h1>
                <p class="text-xs text-gray-500">Minecraft Utility Web Interface</p>
            </div>
            <div id="statusBadge" class="px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/50">
                OFFLINE
            </div>
        </div>

        <!-- LEFT: CONTROLS -->
        <div class="col-span-12 md:col-span-4 space-y-4">
            <div class="glass p-6 rounded-2xl">
                <h2 class="text-sm font-bold mb-4 uppercase text-gray-400">Konfigurasi</h2>
                <input id="host" type="text" placeholder="IP Server" class="w-full bg-black/40 border border-white/10 p-2 rounded mb-2 text-sm">
                <input id="port" type="number" value="25565" class="w-full bg-black/40 border border-white/10 p-2 rounded mb-4 text-sm">
                <button onclick="startBot()" class="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition">HUBUNGKAN BOT</button>
            </div>

            <div class="glass p-6 rounded-2xl space-y-2">
                <h2 class="text-sm font-bold mb-4 uppercase text-gray-400">Modul Hack</h2>
                <button onclick="toggleFeature('killAura', this)" class="w-full flex justify-between items-center p-3 rounded bg-white/5 hover:bg-white/10 transition">
                    <span><i class="fas fa-crosshairs mr-2"></i>Kill Aura</span>
                    <i class="fas fa-power-off text-gray-600"></i>
                </button>
                <button onclick="toggleFeature('antiKb', this)" class="w-full flex justify-between items-center p-3 rounded bg-white/5 hover:bg-white/10 transition">
                    <span><i class="fas fa-shield-alt mr-2"></i>Anti-Knockback</span>
                    <i class="fas fa-power-off text-gray-600"></i>
                </button>
            </div>
        </div>

        <!-- RIGHT: CONSOLE & STATS -->
        <div class="col-span-12 md:col-span-8 space-y-4">
            <div class="grid grid-cols-3 gap-4">
                <div class="glass p-4 rounded-xl text-center">
                    <p class="text-xs text-gray-400">HEALTH</p>
                    <p id="hpLabel" class="text-xl font-bold text-red-500">--</p>
                </div>
                <div class="glass p-4 rounded-xl text-center">
                    <p class="text-xs text-gray-400">FOOD</p>
                    <p id="foodLabel" class="text-xl font-bold text-orange-500">--</p>
                </div>
                <div class="glass p-4 rounded-xl text-center">
                    <p class="text-xs text-gray-400">COORDS</p>
                    <p id="posLabel" class="text-xs font-mono mt-2 text-blue-400">--</p>
                </div>
            </div>

            <div class="glass rounded-2xl h-80 flex flex-col">
                <div class="p-3 border-b border-white/10 text-xs font-bold text-gray-500">LOG & CHAT</div>
                <div id="logBox" class="flex-1 p-4 overflow-y-auto text-xs font-mono space-y-1"></div>
                <div class="p-2 flex gap-2">
                    <input id="cmdInput" type="text" placeholder="Ketik pesan..." class="flex-1 bg-black/40 border border-white/10 p-2 rounded text-sm outline-none">
                    <button onclick="sendChat()" class="bg-blue-600 px-4 rounded"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        function startBot() {
            const host = document.getElementById('host').value;
            const port = document.getElementById('port').value;
            socket.emit('startBot', { host, port });
        }

        function toggleFeature(name, el) {
            socket.emit('toggleFeature', name);
            el.classList.toggle('btn-active');
            const icon = el.querySelector('.fa-power-off');
            icon.classList.toggle('text-white');
        }

        function sendChat() {
            const inp = document.getElementById('cmdInput');
            if(inp.value) {
                socket.emit('sendCommand', inp.value);
                inp.value = '';
            }
        }

        socket.on('log', msg => {
            const div = document.getElementById('logBox');
            div.innerHTML += \`<p class="text-gray-400">[SYSTEM] \${msg}</p>\`;
            div.scrollTop = div.scrollHeight;
        });

        socket.on('chatMsg', data => {
            const div = document.getElementById('logBox');
            div.innerHTML += \`<p><span class="text-blue-400">\${data.user}:</span> \${data.msg}</p>\`;
            div.scrollTop = div.scrollHeight;
        });

        socket.on('status', data => {
            const badge = document.getElementById('statusBadge');
            if(data.connected) {
                badge.innerText = 'ONLINE: ' + data.username;
                badge.className = 'px-4 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/50';
            } else {
                badge.innerText = 'OFFLINE';
                badge.className = 'px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/50';
            }
        });

        socket.on('updateStats', data => {
            document.getElementById('hpLabel').innerText = Math.round(data.health);
            document.getElementById('foodLabel').innerText = Math.round(data.food);
            document.getElementById('posLabel').innerText = \`X: \${Math.round(data.pos.x)} Y: \${Math.round(data.pos.y)} Z: \${Math.round(data.pos.z)}\`;
        });
    </script>
</body>
</html>
`;

