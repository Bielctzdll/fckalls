require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const CryptoJS = require('crypto-js');

// Configurações
const CONFIG = {
    PORT: process.env.PORT || 3000,
    ENCRYPTION_KEY: 'bielzin_secure_key_2025',
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configurações de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: CONFIG.RATE_LIMIT_WINDOW * 60 * 1000,
    max: CONFIG.RATE_LIMIT_MAX,
    message: "Muitas requisições deste IP, tente novamente mais tarde."
});

app.use(limiter);

// Função para encriptar dados
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, CONFIG.ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('Erro ao encriptar dados:', error);
        return null;
    }
}

// Função para decriptar dados
function decryptData(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, CONFIG.ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) {
            throw new Error('Decriptação resultou em string vazia');
        }
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error('Erro ao decriptar dados:', error);
        return null;
    }
}

// Servir arquivos estáticos da pasta dist
app.use(express.static(path.join(__dirname, '..')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rota para arquivos estáticos não encontrados
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/socket.io/')) {
        console.log(`Arquivo não encontrado: ${req.path}`);
    }
    next();
});

// Caminho para o arquivo de estatísticas
const statsFilePath = path.join(__dirname, '../stats.json');

// Set para armazenar IPs únicos
const uniqueIPs = new Set();

// Inicializa as estatísticas
let stats;
loadStats();

// Função para salvar estatísticas no arquivo
function saveStats() {
    try {
        // Salva em formato JSON puro
        fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 4));
    } catch (error) {
        console.error('Erro ao salvar estatísticas:', error);
    }
}

// Função para carregar estatísticas do arquivo
function loadStats() {
    try {
        if (!fs.existsSync(statsFilePath)) {
            console.log('Arquivo de estatísticas não encontrado, criando novo...');
            stats = { downloads: 0, activeUsers: 0 };
            saveStats();
            return;
        }

        const fileContent = fs.readFileSync(statsFilePath, 'utf8');
        if (!fileContent) {
            console.log('Arquivo de estatísticas vazio, inicializando...');
            stats = { downloads: 0, activeUsers: 0 };
            saveStats();
            return;
        }

        try {
            stats = JSON.parse(fileContent);
            if (!stats || typeof stats !== 'object') {
                console.log('Dados inválidos, inicializando com valores padrão...');
                stats = { downloads: 0, activeUsers: 0 };
            }
        } catch (parseError) {
            console.error('Erro ao parsear JSON:', parseError);
            stats = { downloads: 0, activeUsers: 0 };
        }

        stats.activeUsers = 0; // Reseta usuários ativos ao iniciar
        saveStats();
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        stats = { downloads: 0, activeUsers: 0 };
        saveStats();
    }
}

// Função para encriptar dados para transmissão
function encryptForTransmission(data) {
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, CONFIG.ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('Erro ao encriptar dados para transmissão:', error);
        return null;
    }
}

// Função para decriptar dados recebidos
function decryptFromTransmission(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, CONFIG.ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) {
            throw new Error('Decriptação resultou em string vazia');
        }
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error('Erro ao decriptar dados recebidos:', error);
        return null;
    }
}

// Função para obter IP real do cliente com proteção
function getClientIP(req) {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               req.connection.socket.remoteAddress;
    
    return CryptoJS.SHA256(ip || 'unknown').toString();
}

// Anti-flood para WebSocket
const connectionLimiter = new Map();
const MAX_CONNECTIONS_PER_IP = 5;
const CONNECTION_WINDOW = 60000; // 1 minuto

// Gerenciar conexões WebSocket
wss.on('connection', (ws, req) => {
    const clientIP = getClientIP(req);
    
    // Verificar limite de conexões
    if (!connectionLimiter.has(clientIP)) {
        connectionLimiter.set(clientIP, { count: 1, timestamp: Date.now() });
    } else {
        const connectionInfo = connectionLimiter.get(clientIP);
        if (Date.now() - connectionInfo.timestamp > CONNECTION_WINDOW) {
            connectionInfo.count = 1;
            connectionInfo.timestamp = Date.now();
        } else if (connectionInfo.count >= MAX_CONNECTIONS_PER_IP) {
            ws.close();
            return;
        } else {
            connectionInfo.count++;
        }
    }
    
    // Verifica se é um novo IP
    if (!uniqueIPs.has(clientIP)) {
        uniqueIPs.add(clientIP);
        stats.activeUsers++;
        saveStats();
        broadcastStats();
    }

    // Enviar estatísticas iniciais para o novo cliente
    try {
        const encryptedStats = encryptForTransmission(stats);
        if (encryptedStats) {
            ws.send(encryptedStats);
        }
    } catch (error) {
        console.error('Erro ao enviar estatísticas iniciais:', error);
    }

    // Lidar com mensagens do cliente
    ws.on('message', (message) => {
        try {
            const decryptedMessage = decryptFromTransmission(message);
            if (decryptedMessage && decryptedMessage.type === 'download') {
                stats.downloads++;
                saveStats();
                broadcastStats();
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
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
    try {
        const encryptedStats = encryptForTransmission(stats);
        if (encryptedStats) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(encryptedStats);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao broadcast:', error);
    }
}

// Tratamento de erros
process.on('uncaughtException', (err) => {
    console.error('Erro não tratado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Promessa rejeitada não tratada:', err);
});

// Iniciar servidor
server.listen(CONFIG.PORT, () => {
    console.log(`Servidor rodando na porta ${CONFIG.PORT}`);
}); 