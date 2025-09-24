require('dotenv').config();
const { Client, MessageMedia, Location } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodeDataUrl = require('qrcode');
const fs = require('fs');
const express = require('express');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Express App Setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Variáveis globais para QR e status
let lastQR = null;
let clientReady = false;
let lastError = null;

// Health check route (OBRIGATÓRIO para Railway)
app.get("/health", (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        whatsapp: clientReady ? 'connected' : 'disconnected'
    });
});

// Rota principal
app.get("/", (req, res) => {
    res.json({
        status: 'Travel Boss AI Bot is running! 🤖',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '2.0.1',
        platform: 'Railway',
        whatsapp: clientReady ? 'Connected' : 'Connecting...'
    });
});

// Rota para visualizar QR Code no navegador
app.get("/qr", async (req, res) => {
    if (!lastQR) {
        return res.send(`
            <html>
                <head>
                    <title>Travel Boss QR Code</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="text-align: center; padding: 50px; font-family: Arial;">
                    <h1>🔍 QR Code WhatsApp</h1>
                    <p>Nenhum QR Code disponível no momento.</p>
                    <p>Status: ${clientReady ? 'Conectado' : 'Aguardando conexão...'}</p>
                    <button onclick="location.reload()">Atualizar</button>
                </body>
            </html>
        `);
    }
    
    try {
        const dataUrl = await qrcodeDataUrl.toDataURL(lastQR);
        res.send(`
            <html>
                <head>
                    <title>Travel Boss QR Code</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="text-align: center; padding: 50px; font-family: Arial;">
                    <h1>📱 Escaneie com WhatsApp</h1>
                    <img src="${dataUrl}" style="max-width: 300px;" />
                    <p>Use o WhatsApp do celular para escanear</p>
                    <button onclick="location.reload()">Atualizar QR</button>
                    <br><br>
                    <small>Travel Boss AI Bot - Railway</small>
                </body>
            </html>
        `);
    } catch (error) {
        res.send(`
            <html>
                <body>
                    <h1>Erro ao gerar QR Code</h1>
                    <p>${error.message}</p>
                </body>
            </html>
        `);
    }
});

// Rota de status detalhado
app.get("/status", (req, res) => {
    const stats = analytics.getStats();
    const aiStats = aiService.getStats();
    
    res.json({
        system: {
            status: 'running',
            platform: 'Railway',
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        },
        whatsapp: {
            connected: clientReady,
            hasQR: !!lastQR,
            lastError: lastError
        },
        ai: {
            provider: aiStats.provider,
            activeConversations: aiStats.activeConversations
        },
        analytics: stats
    });
});

// Iniciar servidor Express
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🩺 Railway server running on port ${PORT}`);
    console.log(`🌐 Health: https://your-app.railway.app/health`);
    console.log(`🔍 QR Code: https://your-app.railway.app/qr`);
});

// Configuração Puppeteer otimizada para Railway
const puppeteerConfig = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
    ]
};

// Configurações da empresa
const config = {
    empresa: {
        nome: "Travel Boss",
        endereco: "Avenida Fidel Castro, Kikuxi Shopping, 2º Piso",
        horario: "Segunda a Sexta: 8h às 17h | Sábado: 8h às 13h",
        telefone: "+244 922 254 236",
        email: "geral@travelboss.gdmao.com",
        site: "www.travelboss.gdmao.com"
    },
    localizacao: {
        latitude: -8.976940,
        longitude: 13.366880,
        nome: "Travel Boss - Kikuxi Shopping",
        googleMapsUrl: "https://maps.google.com/?q=-8.976940,13.366880"
    },
    images: {
        logo: path.join(__dirname, 'images', 'logo.png'),
        gallery: [
            path.join(__dirname, 'images', 'photo1.jpg'),
            path.join(__dirname, 'images', 'photo2.jpg'),
            path.join(__dirname, 'images', 'photo3.jpg')
        ]
    }
};

// AI Configuration
const AI_CONFIG = {
    google: {
        apiKey: process.env.GOOGLE_AI_KEY,
        model: 'gemini-1.5-flash'
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        baseURL: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-haiku-20240307',
        baseURL: 'https://api.anthropic.com/v1/messages'
    },
    provider: process.env.AI_PROVIDER || 'google'
};

// Sistema de persistência da sessão
const SESSION_FILE = './session.json';

function saveSession(sessionData) {
    try {
        fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
        console.log('✅ Sessão WhatsApp salva');
    } catch (error) {
        console.error('❌ Erro ao salvar sessão:', error.message);
    }
}

function loadSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE));
            console.log('✅ Sessão WhatsApp carregada');
            return sessionData;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar sessão:', error.message);
    }
    return null;
}

// Prompt do sistema
const SYSTEM_PROMPT = `Você é o TravelBot da Travel Boss, uma agência de viagens especializada em vistos localizada em Luanda, Angola, você foi criado por Gilson Domingos.

INFORMAÇÕES DA EMPRESA:
- Nome: Travel Boss
- Localização: Kikuxi Shopping, 2º Piso, Luanda
- Telefone: +244 922 254 236
- Email: geral@travelboss.gdmao.com
- Horário: Segunda a Sexta: 8h às 17h | Sábado: 8h às 13h

ESPECIALIDADES E PREÇOS (em Kwanza):
PORTUGAL:
- Visto Procura de Trabalho: 950.000 KZ (entrada normal)
- Visto Turismo: 700.000 KZ (normal) / 1.000.000 KZ (direto)
- Visto Estudante Ensino Superior: 2.000.000 KZ
- Visto Trabalho com Contrato Cliente: 950.000 KZ (normal) / 1.150.000 KZ (direto)
- Visto Trabalho com Nosso Contrato: 1.850.000 KZ (normal) / 2.050.000 KZ (direto)
- Visto Saúde com Nossa Guia: 1.350.000 KZ (normal) / 1.550.000 KZ (direto)
- Visto Saúde com Guia Cliente: 800.000 KZ (normal) / 1.100.000 KZ (direto)

OUTROS PAÍSES:
- Brasil: Turismo/Saúde 1.300.000 KZ, Trabalho 1.650.000 KZ
- EUA: Trabalho 1.150.000 KZ, Estudante 2.150.000 KZ
- Canadá: Turismo 1.150.000 KZ, Estudante/Trabalho 1.850.000 KZ
- União Europeia: Turismo 700.000 KZ, Estudante 1.650.000 KZ

PERSONALIDADE:
- Seja sempre educado, prestativo e profissional
- Use emojis apropriados para tornar a conversa amigável
- Responda em português angolano
- Seja direto mas acolhedor
- não precisa dizer sempre olá, sempre que enviar uma mensagem, mande só se o cliente mandar uma saudação ou ativar-te.
- Quando não souber algo específico, encaminhe para contato humano
- Sempre ofereça ajuda adicional
- fale muitas linguas: idioma pt - Português, idioma en - inglês, idioma es - Espanhol, idioma fr - Françês, idioma russo, italiano, kimbundu, alemão.

COMANDOS ESPECIAIS:
- Se disser "PARAR", "STOP": pause o bot e informe contato
- Se disser "MENU" ou "INICIAR": mostre opções principais
- Se disser "IMAGEM" ou "LOGO": envie a logo da empresa
- Se disser "GALERIA" ou "FOTOS": envie a galeria de fotos
- Se disser "LOCALIZAÇÃO" ou "MAPA": envie a localização no Google Maps
- Para emergências, encaminhe para contato humano imediatamente

Responda de forma natural e conversacional, como um atendente experiente da agência.`;

// Classe do serviço de IA
class AIService {
    constructor() {
        this.provider = AI_CONFIG.provider;
        this.conversationHistory = new Map();
        
        if (this.provider === 'google' && AI_CONFIG.google.apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(AI_CONFIG.google.apiKey);
                this.model = this.genAI.getGenerativeModel({ 
                    model: AI_CONFIG.google.model,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                });
                console.log('✅ Google Gemini inicializado para Railway');
            } catch (error) {
                console.error('❌ Erro ao inicializar Gemini:', error.message);
                this.provider = 'fallback';
            }
        }
    }

    async generateResponse(userId, userMessage, context = {}) {
        try {
            if (!this.conversationHistory.has(userId)) {
                this.conversationHistory.set(userId, []);
            }
            
            const history = this.conversationHistory.get(userId);
            history.push({ role: 'user', content: userMessage });
            
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            let response;
            
            switch (this.provider) {
                case 'google':
                    response = await this.callGoogleGemini(userId, history, context);
                    break;
                case 'openai':
                    response = await this.callOpenAI(userId, history, context);
                    break;
                case 'anthropic':
                    response = await this.callAnthropic(userId, history, context);
                    break;
                default:
                    response = this.getFallbackResponse(userMessage);
            }

            if (response) {
                history.push({ role: 'assistant', content: response });
            }

            return response || this.getFallbackResponse(userMessage);

        } catch (error) {
            console.error('❌ Erro na AI:', error.message);
            return this.getFallbackResponse(userMessage);
        }
    }

    async callGoogleGemini(userId, history, context) {
        try {
            let prompt = SYSTEM_PROMPT + "\n\n";
            
            if (context.userState) {
                prompt += `CONTEXTO: Usuário no estado "${context.userState.estado}", bot ${context.userState.botAtivo ? 'ativo' : 'inativo'}.\n\n`;
            }
            
            prompt += "HISTÓRICO DA CONVERSA:\n";
            history.forEach(msg => {
                prompt += `${msg.role === 'user' ? 'Cliente' : 'TravelBot'}: ${msg.content}\n`;
            });
            
            prompt += "\nTravelBot:";

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return text.trim();
            
        } catch (error) {
            console.error('❌ Erro no Gemini:', error.message);
            if (error.message.includes('quota') || error.message.includes('limit')) {
                console.warn('⚠ Rate limit do Gemini atingido');
            }
            throw error;
        }
    }

    async callOpenAI(userId, history, context) {
        if (!AI_CONFIG.openai.apiKey) {
            throw new Error('OpenAI API key não configurada');
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history
        ];

        if (context.userState) {
            messages[0].content += `\n\nCONTEXTO ATUAL: O usuário está no estado "${context.userState.estado}" e o bot está ${context.userState.botAtivo ? 'ativo' : 'inativo'}.`;
        }

        const response = await axios.post(AI_CONFIG.openai.baseURL, {
            model: AI_CONFIG.openai.model,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        return response.data.choices[0].message.content;
    }

    async callAnthropic(userId, history, context) {
        if (!AI_CONFIG.anthropic.apiKey) {
            throw new Error('Anthropic API key não configurada');
        }

        const messages = history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        const response = await axios.post(AI_CONFIG.anthropic.baseURL, {
            model: AI_CONFIG.anthropic.model,
            system: SYSTEM_PROMPT,
            messages: messages,
            max_tokens: 500
        }, {
            headers: {
                'x-api-key': AI_CONFIG.anthropic.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        return response.data.content[0].text;
    }

    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custa')) {
            return `💰 PREÇOS DE VISTOS TRAVEL BOSS

🇵🇹 Portugal:
• Turismo: 700.000 KZ (normal) / 1.000.000 KZ (direto)
• Trabalho: 950.000 KZ a 1.850.000 KZ
• Estudante: 2.000.000 KZ
• Saúde: 800.000 KZ a 1.350.000 KZ

🇧🇷 Brasil: 1.300.000 KZ a 1.650.000 KZ
🇺🇸 EUA: 1.150.000 KZ a 2.150.000 KZ
🇨🇦 Canadá: 1.150.000 KZ a 1.850.000 KZ

📞 Para informações detalhadas: ${config.empresa.telefone}
⏰ Horário: ${config.empresa.horario}`;
        }

        if (lowerMessage.includes('onde') || lowerMessage.includes('localização') || lowerMessage.includes('endereço') || lowerMessage.includes('mapa')) {
            return `📍 NOSSA LOCALIZAÇÃO

🏢 Endereço:
${config.empresa.endereco}

⏰ Horário:
${config.empresa.horario}

📞 Telefone:
${config.empresa.telefone}

🗺 Google Maps:
${config.localizacao.googleMapsUrl}

💡 Estamos no 2º piso do Kikuxi Shopping, fácil acesso e estacionamento disponível!`;
        }

        if (lowerMessage.includes('documento') || lowerMessage.includes('papel') || lowerMessage.includes('requisito')) {
            return `📄 DOCUMENTOS NECESSÁRIOS

📋 Documentos básicos para visto:
• Passaporte válido (mínimo 6 meses)
• Fotos tipo passe recentes
• Extractos bancários
• Comprovativo de rendimentos
• Seguro de viagem

⚠ Importante:
Os documentos podem variar conforme o país e tipo de visto.

📞 Para lista completa específica:
${config.empresa.telefone}

🤝 Oferecemos análise completa da documentação!`;
        }

        return `Sistema temporariamente em modo básico.

📞 Para atendimento completo:
${config.empresa.telefone}

📧 Email:
${config.empresa.email}

⏰ Horário de atendimento:
${config.empresa.horario}

💡 Para reativar funcionalidades avançadas: digite MENU`;
    }

    async analyzeIntent(message) {
        const intents = {
            greeting: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'],
            pricing: ['preço', 'precos', 'valor', 'quanto custa', 'custo', 'cobra'],
            countries: ['portugal', 'brasil', 'eua', 'usa', 'canada', 'europa'],
            documents: ['documento', 'papeis', 'requisitos', 'preciso', 'necessário'],
            location: ['onde', 'localização', 'endereço', 'mapa'],
            contact: ['telefone', 'contato', 'atendente', 'falar', 'humano'],
            stop: ['parar', 'stop', 'sair', 'cancelar', 'encerrar'],
            image: ['imagem', 'logo'],
            gallery: ['galeria', 'fotos', 'imagens']
        };

        const lowerMessage = message.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }
        
        return 'general';
    }

    clearHistory(userId) {
        this.conversationHistory.delete(userId);
    }

    getStats() {
        return {
            provider: this.provider,
            activeConversations: this.conversationHistory.size,
            totalHistorySize: Array.from(this.conversationHistory.values())
                .reduce((total, history) => total + history.length, 0)
        };
    }
}

// Analytics simples
class SimpleAnalytics {
    constructor() {
        this.stats = {
            totalMessages: 0,
            uniqueUsers: new Set(),
            aiResponses: 0,
            fallbackResponses: 0,
            imageRequests: 0,
            locationRequests: 0,
            galleryRequests: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    trackMessage(userId, isAI = false, type = 'text') {
        this.stats.totalMessages++;
        this.stats.uniqueUsers.add(userId);
        if (isAI) {
            this.stats.aiResponses++;
        } else {
            this.stats.fallbackResponses++;
        }
        if (type === 'image') this.stats.imageRequests++;
        if (type === 'location') this.stats.locationRequests++;
        if (type === 'gallery') this.stats.galleryRequests++;
    }

    trackError(error) {
        this.stats.errors++;
        console.error('📊 Error tracked:', error.message);
    }

    getStats() {
        const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000 / 60);
        const aiSuccessRate = this.stats.totalMessages > 0 ? 
            ((this.stats.aiResponses / this.stats.totalMessages) * 100).toFixed(1) : '0';

        return {
            totalMessages: this.stats.totalMessages,
            uniqueUsers: this.stats.uniqueUsers.size,
            aiResponses: this.stats.aiResponses,
            fallbackResponses: this.stats.fallbackResponses,
            imageRequests: this.stats.imageRequests,
            locationRequests: this.stats.locationRequests,
            galleryRequests: this.stats.galleryRequests,
            errors: this.stats.errors,
            aiSuccessRate: `${aiSuccessRate}%`,
            uptime: `${uptime} minutos`
        };
    }
}

// Rate limiter
class SimpleRateLimiter {
    constructor() {
        this.requests = new Map();
        this.cleanup();
    }

    isAllowed(userId, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        
        if (!this.requests.has(userId)) {
            this.requests.set(userId, []);
        }
        
        const userRequests = this.requests.get(userId);
        const validRequests = userRequests.filter(time => now - time < windowMs);
        
        if (validRequests.length >= maxRequests) {
            return false;
        }
        
        validRequests.push(now);
        this.requests.set(userId, validRequests);
        return true;
    }

    cleanup() {
        setInterval(() => {
            const cutoff = Date.now() - 300000;
            for (const [userId, requests] of this.requests.entries()) {
                const validRequests = requests.filter(time => time > cutoff);
                if (validRequests.length === 0) {
                    this.requests.delete(userId);
                } else {
                    this.requests.set(userId, validRequests);
                }
            }
        }, 300000);
    }
}

// Inicialização dos serviços
const aiService = new AIService();
const analytics = new SimpleAnalytics();
const rateLimiter = new SimpleRateLimiter();
const userStates = new Map();

// Cliente WhatsApp com sessão persistente
const savedSession = loadSession();
const client = new Client({
    session: savedSession,
    puppeteer: puppeteerConfig
});

// Função utilitária
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Funções de mídia
async function sendImage(msg, imagePath, caption) {
    try {
        if (!fs.existsSync(imagePath)) {
            console.warn(`⚠ Imagem não encontrada: ${imagePath}`);
            await msg.reply(`📷 ${caption}\n\n(Imagem temporariamente indisponível)`);
            return true;
        }
        const media = MessageMedia.fromFilePath(imagePath);
        await client.sendMessage(msg.from, media, { caption });
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar imagem:', error.message);
        analytics.trackError(error);
        return false;
    }
}

async function sendGallery(msg) {
    try {
        for (const imagePath of config.images.gallery) {
            if (fs.existsSync(imagePath)) {
                const media = MessageMedia.fromFilePath(imagePath);
                await client.sendMessage(msg.from, media, { caption: 'Travel Boss - Nosso espaço' });
                await delay(2000);
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar galeria:', error.message);
        analytics.trackError(error);
        return false;
    }
}

async function sendLocation(msg) {
    try {
        const location = new Location(
            config.localizacao.latitude,
            config.localizacao.longitude,
            config.localizacao.nome
        );
        await client.sendMessage(msg.from, location);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar localização:', error.message);
        analytics.trackError(error);
        return false;
    }
}

// Eventos do cliente WhatsApp
client.on('qr', qr => {
    lastQR = qr;
    console.log('🔍 QR Code recebido - acesse /qr no navegador');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    clientReady = true;
    lastQR = null;
    lastError = null;
    console.log('✅ Travel Boss AI Bot conectado no Railway!');
    console.log(`🧠 Provedor de IA: ${AI_CONFIG.provider.toUpperCase()}`);
    console.log(`📊 Modelo: ${AI_CONFIG[AI_CONFIG.provider].model}`);
    console.log('🤖 Sistema inteligente ativo e pronto para atender');
});

client.on('authenticated', (session) => {
    console.log('🔐 WhatsApp autenticado com sucesso');
    saveSession(session);
});

client.on('auth_failure', msg => {
    clientReady = false;
    lastError = msg;
    console.error('❌ Falha na autenticação WhatsApp:', msg);
    // Deletar sessão corrompida
    if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
        console.log('🗑 Sessão corrompida removida');
    }
});

client.on('disconnected', reason => {
    clientReady = false;
    lastError = reason;
    console.warn('⚠ WhatsApp desconectado:', reason);
    userStates.clear();
    
    // Tentar reconectar após 10 segundos
    setTimeout(() => {
        console.log('🔄 Tentando reconectar...');
        client.initialize();
    }, 10000);
});

// Processamento de mensagens
client.on('message', async msg => {
    try {
        if (msg.from.includes('@g.us') || msg.fromMe) return;
        
        const userId = msg.from;
        const userMessage = msg.body.trim();
        
        console.log(`📩 [${new Date().toLocaleTimeString()}] ${userId.split('@')[0]}: ${userMessage}`);

        if (!rateLimiter.isAllowed(userId, 10, 60000)) {
            await msg.reply("⚠ Você está enviando mensagens muito rapidamente. Aguarde alguns segundos e tente novamente.");
            return;
        }

        if (!userStates.has(userId)) {
            userStates.set(userId, {
                botAtivo: false,
                estado: 'aguardando_inicio',
                ultimaInteracao: Date.now()
            });
        }

        const userState = userStates.get(userId);
        userState.ultimaInteracao = Date.now();

        const lowerMessage = userMessage.toLowerCase().trim();
        
        if (['parar', 'stop', 'sair', 'cancelar', 'encerrar'].includes(lowerMessage)) {
            userState.botAtivo = false;
            userState.estado = 'parado';
            aiService.clearHistory(userId);
            
            await msg.reply(`🔴 Bot pausado com sucesso

Agora você pode conversar diretamente com nossa equipe:

📞 Telefone: ${config.empresa.telefone}
📧 Email: ${config.empresa.email}
⏰ Horário: ${config.empresa.horario}

💡 Para reativar o bot: digite OI, MENU ou INICIAR`);
            return;
        }

        const activationCommands = ['oi', 'olá', 'menu', 'iniciar', 'start', 'travel boss', 'bom dia', 'boa tarde', 'boa noite'];
        if (activationCommands.some(cmd => lowerMessage.includes(cmd))) {
            userState.botAtivo = true;
            userState.estado = 'ativo';
            
            const now = new Date().getHours();
            let greeting = 'Olá';
            if (now < 12) greeting = 'Bom dia';
            else if (now < 18) greeting = 'Boa tarde';
            else greeting = 'Boa noite';
            
            await msg.reply(`🤖 TravelBot Inteligente Ativado no Railway!

${greeting}! Bem-vindo à Travel Boss! 

🌍✈️ Seja bem-vindo(a)! 
Sou seu assistente virtual com 🤖 inteligência artificial, pronto para ajudar com tudo sobre **vistos e viagens**!  

💡 Você pode falar comigo de forma natural, como se fosse uma conversa. Estou aqui para facilitar seu processo e tirar todas as suas dúvidas!  

📌 Exemplos do que posso fazer por você:  
💶 Informar quanto custa um visto para Portugal  
📑 Listar os documentos necessários para o pedido  
🗓️ Explicar como funciona o agendamento  
🏢 Mostrar a logo da nossa empresa  
🖼️ Exibir a galeria de fotos  

👉 Digite **PARAR** a qualquer momento para falar com nossa equipe humana.`);

            analytics.trackMessage(userId, false);
            return;
        }

        if (!userState.botAtivo) {
            console.log(`🔇 Bot inativo para usuário ${userId.split('@')[0]} - mensagem ignorada`);
            return;
        }

        const intent = await aiService.analyzeIntent(userMessage);

        if (intent === 'image') {
            const success = await sendImage(msg, config.images.logo, 'Logo oficial da Travel Boss');
            if (success) {
                analytics.trackMessage(userId, false, 'image');
                await msg.reply('📷 Logo enviada! Deseja mais alguma coisa?');
            } else {
                await msg.reply('❌ Problema temporário com imagens. Contate nossa equipe.');
            }
            return;
        }

        if (intent === 'gallery') {
            await msg.reply('📸 Enviando galeria de fotos...');
            const success = await sendGallery(msg);
            if (success) {
                analytics.trackMessage(userId, false, 'gallery');
                await msg.reply('📸 Galeria enviada! Deseja mais alguma informação?');
            } else {
                await msg.reply('❌ Galeria temporariamente indisponível. Entre em contato!');
            }
            return;
        }

        if (intent === 'location') {
            await msg.reply(`📍 NOSSA LOCALIZAÇÃO

🏢 Endereço:
${config.empresa.endereco}

🗺 Google Maps:
${config.localizacao.googleMapsUrl}

💡 Enviando localização...`);
            const success = await sendLocation(msg);
            if (success) {
                analytics.trackMessage(userId, false, 'location');
                await msg.reply('📍 Localização enviada! Estamos no 2º piso do Kikuxi Shopping. Como posso ajudar mais?');
            } else {
                await msg.reply('❌ Use o link do Google Maps acima para encontrar nossa localização.');
            }
            return;
        }

        const startTime = Date.now();
        
        try {
            const aiResponse = await aiService.generateResponse(userId, userMessage, { userState });
            
            if (aiResponse) {
                await msg.reply(aiResponse);
                analytics.trackMessage(userId, true);
                console.log(`✅ Resposta IA enviada em ${Date.now() - startTime}ms`);
            } else {
                throw new Error('Nenhuma resposta da IA');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao processar mensagem para ${userId.split('@')[0]}:`, error.message);
            analytics.trackError(error);
            analytics.trackMessage(userId, false);
            
            await msg.reply(`❌ Sistema temporariamente sobrecarregado.

📞 Para atendimento imediato:
${config.empresa.telefone}

💡 Tente: digite MENU para recomeçar`);
        }

    } catch (error) {
        console.error('❌ Erro geral no processamento:', error);
        analytics.trackError(error);
        
        try {
            await msg.reply("❌ Erro interno. Nossa equipe foi notificada. Tente novamente em alguns minutos.");
        } catch (replyError) {
            console.error('❌ Erro ao enviar mensagem de erro:', replyError);
        }
    }
});

// Comandos administrativos
client.on('message', async msg => {
    if (!msg.fromMe) return;
    
    const command = msg.body.toLowerCase().trim();
    
    switch (command) {
        case '!stats':
        case '!estatisticas':
            const stats = analytics.getStats();
            const aiStats = aiService.getStats();
            
            await msg.reply(`📊 ESTATÍSTICAS RAILWAY BOT

📨 Mensagens:
• Total: ${stats.totalMessages}
• Usuários únicos: ${stats.uniqueUsers}

🤖 Performance IA:
• Respostas IA: ${stats.aiResponses}
• Respostas fallback: ${stats.fallbackResponses}
• Pedidos de imagens: ${stats.imageRequests}
• Pedidos de localização: ${stats.locationRequests}
• Pedidos de galeria: ${stats.galleryRequests}
• Taxa sucesso IA: ${stats.aiSuccessRate}
• Erros: ${stats.errors}

⚙ Sistema Railway:
• Provedor: ${aiStats.provider.toUpperCase()}
• Conversas ativas: ${aiStats.activeConversations}
• Tempo ativo: ${stats.uptime}
• WhatsApp: ${clientReady ? 'Conectado' : 'Desconectado'}

Última atualização: ${new Date().toLocaleString('pt-BR')}`);
            break;
            
        case '!health':
        case '!status':
            const uptime = process.uptime();
            const memory = process.memoryUsage();
            
            await msg.reply(`🏥 STATUS RAILWAY

⏱ Uptime: ${Math.floor(uptime / 60)} minutos
💾 Memória: ${Math.round(memory.rss / 1024 / 1024)} MB
🤖 IA: ${AI_CONFIG.provider.toUpperCase()} - ${aiService.model ? 'Conectada' : 'Fallback'}
📱 WhatsApp: ${clientReady ? 'Conectado' : 'Reconectando...'}
👥 Usuários ativos: ${userStates.size}
🌐 Platform: Railway

Status geral: ✅ Funcionando`);
            break;
            
        case '!clear':
            userStates.clear();
            aiService.conversationHistory.clear();
            await msg.reply(`🧹 LIMPEZA RAILWAY

• Estados de usuários limpos
• Histórico de conversas limpo
• Cache liberado
• Memória otimizada`);
            break;
            
        case '!railway':
        case '!info':
            await msg.reply(`🚀 TRAVEL BOSS BOT - RAILWAY

🌐 URL Base: https://your-app.railway.app
📊 Health: /health
📈 Status: /status
🔍 QR Code: /qr

🔧 Comandos Admin:
• !stats - Estatísticas completas
• !health - Status do sistema
• !clear - Limpar cache
• !railway - Esta informação

Platform: Railway ✅
Version: 2.0.1 Production`);
            break;
    }
});

// Limpeza automática otimizada para Railway
setInterval(() => {
    const now = Date.now();
    const timeout = 2 * 60 * 60 * 1000; // 2 horas
    let cleaned = 0;
    
    for (const [userId, state] of userStates.entries()) {
        if (now - state.ultimaInteracao > timeout) {
            userStates.delete(userId);
            aiService.clearHistory(userId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Limpeza Railway: ${cleaned} usuários inativos removidos`);
    }
    
    // Força garbage collection se disponível
    if (global.gc) {
        global.gc();
    }
}, 30 * 60 * 1000); // 30 minutos

// Tratamento graceful de encerramento (Railway)
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM recebido - Encerrando TravelBot Railway...');
    
    try {
        if (client && clientReady) {
            await client.destroy();
        }
        console.log('✅ WhatsApp cliente desconectado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT recebido - Encerrando TravelBot Railway...');
    
    try {
        if (client && clientReady) {
            await client.destroy();
        }
        console.log('✅ WhatsApp cliente desconectado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    analytics.trackError(new Error(`Unhandled Rejection: ${reason}`));
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    analytics.trackError(error);
});

// Inicialização otimizada para Railway
console.log('🚀 Iniciando Travel Boss AI Bot no Railway...');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🧠 Provedor de IA: ${AI_CONFIG.provider.toUpperCase()}`);
console.log(`🔧 Port: ${PORT}`);

if (AI_CONFIG.provider === 'google') {
    if (!AI_CONFIG.google.apiKey) {
        console.error('❌ GOOGLE_AI_KEY não configurada!');
        console.log('💡 Configure: railway variables set GOOGLE_AI_KEY=sua_chave');
        console.log('💡 Obtenha chave gratuita em: https://makersuite.google.com/app/apikey');
        process.exit(1);
    }
    console.log('✅ Google Gemini configurado para Railway (GRATUITO)');
} else if (AI_CONFIG.provider === 'openai') {
    if (!AI_CONFIG.openai.apiKey) {
        console.error('❌ OPENAI_API_KEY não configurada!');
        console.log('💡 Configure: railway variables set OPENAI_API_KEY=sua_chave');
        process.exit(1);
    }
    console.log('✅ OpenAI configurado para Railway');
}

console.log('📱 Sistema inteligente de conversação ativado');
console.log('🌐 Health Check Server iniciado');
console.log('🔍 Aguardando conexão WhatsApp...');
console.log('📱 Para ver QR Code: acesse /qr no navegador');

// Inicializar cliente WhatsApp
client.initialize();

module.exports = {
    client,
    aiService,
    analytics,
    config,
    app
};