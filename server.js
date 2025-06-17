const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir arquivos estáticos
app.use(express.static('./'));

// Caminho para o arquivo de estatísticas
const statsFilePath = path.join(__dirname, 'stats.json');

// Set para armazenar IPs únicos
const uniqueIPs = new Set();

// Carregar ou criar estatísticas iniciais
let stats;
try {
    stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    stats.activeUsers = 0; // Reseta usuários ativos ao iniciar o servidor
} catch (error) {
    stats = {
        downloads: 0,
        activeUsers: 0
    };
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
}

// Salvar estatísticas no arquivo
function saveStats() {
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
}

// Função para obter IP real do cliente
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress;
}

// Gerenciar conexões WebSocket
wss.on('connection', (ws, req) => {
    const clientIP = getClientIP(req);
    
    // Verifica se é um novo IP
    if (!uniqueIPs.has(clientIP)) {
        uniqueIPs.add(clientIP);
        stats.activeUsers++;
        saveStats();
        broadcastStats();
    }

    // Enviar estatísticas iniciais para o novo cliente
    ws.send(JSON.stringify(stats));

    // Lidar com mensagens do cliente
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'download') {
            stats.downloads++;
            saveStats();
            broadcastStats();
        }
    });

    // Quando usuário desconecta
    ws.on('close', () => {
        uniqueIPs.delete(clientIP);
        if (stats.activeUsers > 0) {
            stats.activeUsers--;
        }
        saveStats();
        broadcastStats();
    });

    // Manter conexão ativa
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// Verificar conexões inativas a cada 30 segundos
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(() => {});
    });
}, 30000);

// Limpar intervalo quando o servidor é fechado
wss.on('close', () => {
    clearInterval(interval);
});

// Função para enviar atualizações para todos os clientes
function broadcastStats() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stats));
        }
    });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 