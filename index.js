const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-autoeat');
const armorManager = require('mineflayer-armor-manager');
const fs = require('fs');
const v = require('vec3');

let config;
try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (err) {
    console.log('Gagal memuat config.json, menggunakan pengaturan default.');
    config = { host: 'localhost', port: 25565, auth: 'microsoft', reconnect: true, features: { killAura: true, antiKb: true } };
}

function createBot() {
    const bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        auth: config.auth,
        version: config.version
    });

    bot.loadPlugin(autoeat);
    bot.loadPlugin(armorManager);

    bot.on('login', () => {
        console.clear();
        console.log('      ::::::::  :::    :::  ::::::::  :::::::::  :::    :::  :::::::: ');
        console.log('     :+:    :+: :+:    :+: :+:    :+: :+:    :+: :+:    :+: :+:    :+:');
        console.log('     +:+         +:+  +:+  +:+    +:+ +:+    +:+ +:+    +:+ +:+       ');
        console.log('     +#++:++#++   +#++:+   +#+    +:+ +#+    +:+ +#+    +:+ +#++:++#++');
        console.log('            +#+  +#+  +#+  +#+    +#+ +#+    +#+ +#+    +#+        +#+');
        console.log('     #+#    #+# #+#    #+# #+#    #+# #+#    #+# #+#    #+# #+#    #+#');
        console.log('      ########  ###    ###  ########  #########   ########   ######## ');
        console.log('========================================================================');
        console.log(`[STATUS] Terhubung ke: ${config.host}:${config.port}`);
        console.log(`[USER] Username: ${bot.username}`);
        console.log('========================================================================');
    });

    bot.once('spawn', () => {
        console.log('[SYSTEM] Bot berhasil muncul di dunia.');
        bot.chat('Exodus-X Terminal Edition aktif! Ketik !help untuk bantuan.');
        
        bot.autoEat.options.priority = 'foodValue';
        bot.autoEat.options.bannedFood = ['rotten_flesh', 'spider_eye'];
    });

    // Fitur Kill Aura
    setInterval(() => {
        if (!config.features.killAura || !bot.entity) return;
        const target = bot.nearestEntity((e) => (e.type === 'player' || e.type === 'mob') && e.position.distanceTo(bot.entity.position) < 4.5);
        if (target) {
            bot.lookAt(target.position.offset(0, target.height, 0));
            bot.attack(target);
        }
    }, 150);

    // Fitur Anti-Knockback
    bot.on('entityVelocity', (entity) => {
        if (config.features.antiKb && entity.id === bot.entity.id) {
            bot.setVelocity(v(0, 0, 0));
        }
    });

    // Chat Commands
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        const msg = message.toLowerCase();

        if (msg === '!status') {
            bot.chat(`HP: ${Math.round(bot.health)} | Lapar: ${Math.round(bot.food)} | Koordinat: ${Math.round(bot.entity.position.x)}, ${Math.round(bot.entity.position.y)}, ${Math.round(bot.entity.position.z)}`);
        }
        
        if (msg === '!killaura on') { config.features.killAura = true; bot.chat('KillAura Diaktifkan'); }
        if (msg === '!killaura off') { config.features.killAura = false; bot.chat('KillAura Dimatikan'); }
    });

    // Auto Reconnect Logic
    bot.on('end', (reason) => {
        console.log(`[DISCONNECT] Terputus: ${reason}`);
        if (config.reconnect) {
            console.log('[RECONNECT] Mencoba menghubungkan kembali dalam 10 detik...');
            setTimeout(createBot, 10000);
        }
    });

    bot.on('error', (err) => {
        console.log(`[ERROR] Terjadi kesalahan: ${err.message}`);
    });
}

createBot();

