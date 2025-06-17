const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Ler o arquivo server.js
const serverCode = fs.readFileSync('server.js', 'utf8');

// Configurações de ofuscação
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 3000,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Função para copiar arquivo
function copyFile(source, target) {
    try {
        fs.copyFileSync(source, target);
        console.log(`Arquivo copiado: ${source} -> ${target}`);
    } catch (error) {
        console.error(`Erro ao copiar ${source}:`, error);
    }
}

// Criar diretório dist se não existir
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Ofuscar o código do servidor
const obfuscatedCode = JavaScriptObfuscator.obfuscate(serverCode, obfuscationOptions);
fs.writeFileSync('dist/server.min.js', obfuscatedCode.getObfuscatedCode());

// Ofuscar o código do cliente
const clientCode = fs.readFileSync('script.js', 'utf8');
const obfuscatedClientCode = JavaScriptObfuscator.obfuscate(clientCode, obfuscationOptions);
fs.writeFileSync('dist/script.min.js', obfuscatedClientCode.getObfuscatedCode());

// Copiar arquivos estáticos
const staticFiles = [
    'index.html',
    'style.css',
    'suporte-ao-cliente.png',
    'ferramentas.png',
    '7912f64df57df1efc9e2ea2bb7433676.jpg',
    'engrenagem.png',
    'discordia-removebg-preview.png',
    'King of the Kill (2013 Version).mp3'
];

staticFiles.forEach(file => {
    copyFile(file, path.join('dist', file));
});

// Atualizar referências no HTML
let htmlContent = fs.readFileSync('dist/index.html', 'utf8');
htmlContent = htmlContent.replace('script.js', 'script.min.js');
fs.writeFileSync('dist/index.html', htmlContent);

console.log('Build completo! Os arquivos estão na pasta dist/'); 