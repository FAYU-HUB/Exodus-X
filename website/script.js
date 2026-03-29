const socket = io();

function startBot() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    socket.emit('startBot', { host, port });
}

function toggleFeature(name, el) {
    socket.emit('toggleFeature', name);
    el.classList.toggle('btn-active');
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
    div.innerHTML += `<p class="text-gray-400">>> ${msg}</p>`;
    div.scrollTop = div.scrollHeight;
});

socket.on('chatMsg', data => {
    const div = document.getElementById('logBox');
    div.innerHTML += `<p><b class="text-blue-400">${data.user}:</b> ${data.msg}</p>`;
    div.scrollTop = div.scrollHeight;
});

socket.on('status', data => {
    const badge = document.getElementById('statusBadge');
    if(data.connected) {
        badge.innerText = 'ONLINE: ' + data.username;
        badge.className = 'px-4 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/50';
    } else {
        badge.innerText = 'TERPUTUS';
        badge.className = 'px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/50';
    }
});

socket.on('updateStats', data => {
    document.getElementById('hpLabel').innerText = Math.round(data.health);
    document.getElementById('foodLabel').innerText = Math.round(data.food);
    document.getElementById('posLabel').innerText = `X:${Math.round(data.pos.x)} Y:${Math.round(data.pos.y)} Z:${Math.round(data.pos.z)}`;
});

document.getElementById('cmdInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendChat();
});

