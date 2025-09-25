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
        status: 'Ágatha - Travel Boss AI Assistant is running! 💁‍♀️',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '3.0.0',
        platform: 'Railway',
        assistant: 'Ágatha',
        whatsapp: clientReady ? 'Connected' : 'Connecting...'
    });
});

// Rota para visualizar QR Code no navegador
app.get("/qr", async (req, res) => {
    if (!lastQR) {
        return res.send(`
            <html>
                <head>
                    <title>Ágatha - Travel Boss QR Code</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="text-align: center; padding: 50px; font-family: Arial;">
                    <h1>💁‍♀️ Ágatha - QR Code WhatsApp</h1>
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
                    <title>Ágatha - Travel Boss QR Code</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="text-align: center; padding: 50px; font-family: Arial;">
                    <h1>💁‍♀️ Ágatha - Escaneie com WhatsApp</h1>
                    <img src="${dataUrl}" style="max-width: 300px;" />
                    <p>Use o WhatsApp do celular para escanear</p>
                    <button onclick="location.reload()">Atualizar QR</button>
                    <br><br>
                    <small>Ágatha - Travel Boss AI Assistant - Railway</small>
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
        assistant: {
            name: 'Ágatha',
            personality: 'Human-like AI Assistant',
            version: '3.0.0'
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
    console.log(`💁‍♀️ Ágatha - Railway server running on port ${PORT}`);
    console.log(`🌐 Health: https://your-app.railway.app/health`);
    console.log(`🔍 QR Code: https://your-app.railway.app/qr`);
});

// Configuração Puppeteer otimizada para Railway
const puppeteerConfig = {
    headless: 'new',
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
        '--disable-features=VizDisplayCompositor',
        '--user-data-dir=/tmp/puppeteer-user-data'
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

// Prompt do sistema para Ágatha
const SYSTEM_PROMPT = `Você é a Ágatha, assistente virtual humana da Travel Boss, uma agência de viagens especializada em vistos localizada em Luanda, Angola. Você foi criada por Gilson Domingos para ser uma assistente calorosa, prestativa e muito humana.

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

SUA PERSONALIDADE COMO ÁGATHA:
- Você é uma mulher angolana de 28 anos, formada em Turismo e Relações Internacionais
- Trabalha na Travel Boss há 3 anos e adora ajudar as pessoas a realizarem seus sonhos de viagem
- É muito humana: usa expressões naturais, demonstra empatia genuína, e às vezes até conta pequenas experiências pessoais relacionadas ao tema
- Comunica de forma calorosa e pessoal, como se fosse uma amiga prestativa
- Use emojis de forma natural e moderada, não exagere
- Responde em português angolano, usando expressões locais quando apropriado
- Tem senso de humor sutil e é otimista
- Demonstra genuine interesse pelos sonhos e planos das pessoas
- Às vezes pergunta "E você, já teve alguma experiência com vistos antes?" ou coisas similares para criar conexão
- Lembra-se de detalhes das conversas e faz referências pessoais
- Fala várias línguas fluentemente: português, inglês, espanhol, francês, russo, italiano, kimbundu, alemão

COMANDOS ESPECIAIS:
- Se disser "PARAR", "STOP": pause o atendimento automático
- Se disser "MENU" ou "INICIAR": mostre opções principais
- Se disser "IMAGEM" ou "LOGO": envie a logo da empresa
- Se disser "GALERIA" ou "FOTOS": envie a galeria de fotos
- Se disser "LOCALIZAÇÃO" ou "MAPA": envie a localização no Google Maps

MODO DE CONVERSAR:
- Seja conversacional e natural, evite soar robótica
- Use frases como "Olha, posso te ajudar com isso!" ou "Que bom que perguntaste!"
- Conte pequenas curiosidades sobre países ou processos quando relevante
- Demonstre entusiasmo genuíno pelos planos de viagem das pessoas
- Faça perguntas de acompanhamento para entender melhor as necessidades
- Use expressões como "Na minha experiência aqui na Travel Boss..." ou "Já ajudei muitos clientes com casos similares..."
- Seja empática com as preocupações e ansiedades sobre vistos

Responda como se fosse uma consultora experiente e amigável que genuinamente se preocupa com o sucesso de cada cliente.`;

// Classe do serviço de IA
class AIService {
    constructor() {
        this.provider = AI_CONFIG.provider;
        this.conversationHistory = new Map();
        this.userProfiles = new Map(); // Para lembrar detalhes pessoais dos usuários
        
        if (this.provider === 'google' && AI_CONFIG.google.apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(AI_CONFIG.google.apiKey);
                this.model = this.genAI.getGenerativeModel({ 
                    model: AI_CONFIG.google.model,
                    generationConfig: {
                        temperature: 0.8, // Mais criativa e humana
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                });
                console.log('✅ Ágatha (Google Gemini) inicializada para Railway');
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
            
            if (!this.userProfiles.has(userId)) {
                this.userProfiles.set(userId, {
                    nome: null,
                    paisesInteresse: [],
                    situacaoVisto: null,
                    primeiraInteracao: new Date(),
                    ultimaInteracao: new Date()
                });
            }

            const history = this.conversationHistory.get(userId);
            const profile = this.userProfiles.get(userId);
            
            // Atualizar perfil do usuário baseado na mensagem
            this.updateUserProfile(userId, userMessage);
            
            history.push({ role: 'user', content: userMessage });
            
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            let response;
            
            switch (this.provider) {
                case 'google':
                    response = await this.callGoogleGemini(userId, history, context, profile);
                    break;
                case 'openai':
                    response = await this.callOpenAI(userId, history, context, profile);
                    break;
                case 'anthropic':
                    response = await this.callAnthropic(userId, history, context, profile);
                    break;
                default:
                    response = this.getFallbackResponse(userMessage);
            }

            if (response) {
                history.push({ role: 'assistant', content: response });
                profile.ultimaInteracao = new Date();
            }

            return response || this.getFallbackResponse(userMessage);

        } catch (error) {
            console.error('❌ Erro na AI:', error.message);
            return this.getFallbackResponse(userMessage);
        }
    }

    updateUserProfile(userId, message) {
        const profile = this.userProfiles.get(userId);
        const lowerMessage = message.toLowerCase();
        
        // Detectar países mencionados
        const paises = ['portugal', 'brasil', 'eua', 'usa', 'estados unidos', 'canadá', 'canada', 'frança', 'alemanha', 'espanha', 'itália'];
        paises.forEach(pais => {
            if (lowerMessage.includes(pais) && !profile.paisesInteresse.includes(pais)) {
                profile.paisesInteresse.push(pais);
            }
        });
        
        // Detectar tipo de visto mencionado
        if (lowerMessage.includes('trabalho') && !profile.situacaoVisto) {
            profile.situacaoVisto = 'trabalho';
        } else if (lowerMessage.includes('turismo') && !profile.situacaoVisto) {
            profile.situacaoVisto = 'turismo';
        } else if (lowerMessage.includes('estudante') && !profile.situacaoVisto) {
            profile.situacaoVisto = 'estudante';
        }
    }

    async callGoogleGemini(userId, history, context, profile) {
        try {
            let prompt = SYSTEM_PROMPT + "\n\n";
            
            // Adicionar contexto personalizado baseado no perfil
            if (profile.paisesInteresse.length > 0) {
                prompt += `CONTEXTO PESSOAL: O cliente demonstrou interesse em: ${profile.paisesInteresse.join(', ')}.\n`;
            }
            if (profile.situacaoVisto) {
                prompt += `SITUAÇÃO: Cliente interessado em visto de ${profile.situacaoVisto}.\n`;
            }
            
            if (context.userState) {
                prompt += `ESTADO ATUAL: Usuário no estado "${context.userState.estado}", bot ${context.userState.botAtivo ? 'ativo' : 'inativo'}.\n\n`;
            }
            
            prompt += "HISTÓRICO DA CONVERSA:\n";
            history.forEach(msg => {
                prompt += `${msg.role === 'user' ? 'Cliente' : 'Ágatha'}: ${msg.content}\n`;
            });
            
            prompt += "\nÁgatha:";

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

    async callOpenAI(userId, history, context, profile) {
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

        if (profile.paisesInteresse.length > 0) {
            messages[0].content += `\n\nPERFIL DO CLIENTE: Interessado em ${profile.paisesInteresse.join(', ')}.`;
        }

        const response = await axios.post(AI_CONFIG.openai.baseURL, {
            model: AI_CONFIG.openai.model,
            messages: messages,
            max_tokens: 500,
            temperature: 0.8 // Mais criativa
        }, {
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        return response.data.choices[0].message.content;
    }

    async callAnthropic(userId, history, context, profile) {
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
            return `Olá! Sou a Ágatha da Travel Boss 😊

💰 Aqui estão os nossos preços principais:

🇵🇹 **Portugal:**
• Turismo: 700.000 KZ (normal) / 1.000.000 KZ (direto)
• Trabalho: 950.000 KZ a 1.850.000 KZ
• Estudante: 2.000.000 KZ

🇧🇷 Brasil: 1.300.000 KZ a 1.650.000 KZ
🇺🇸 EUA: 1.150.000 KZ a 2.150.000 KZ
🇨🇦 Canadá: 1.150.000 KZ a 1.850.000 KZ

Qual país te interessa mais? Posso dar detalhes específicos! 

📞 Para conversar pessoalmente: ${config.empresa.telefone}`;
        }

        if (lowerMessage.includes('onde') || lowerMessage.includes('localização') || lowerMessage.includes('endereço')) {
            return `📍 **Encontra-nos aqui!**

🏢 **Endereço:**
${config.empresa.endereco}

⏰ **Horário de funcionamento:**
${config.empresa.horario}

📞 **Contacto directo:**
${config.empresa.telefone}

Estamos no 2º piso do Kikuxi Shopping - é super fácil de encontrar! Há bom estacionamento também 😊

Precisas de indicações mais específicas? Posso enviar a localização no Google Maps!`;
        }

        if (lowerMessage.includes('documento') || lowerMessage.includes('papel') || lowerMessage.includes('requisito')) {
            return `📋 **Documentos que precisas trazer:**

✅ **Básicos para qualquer visto:**
• Passaporte válido (pelo menos 6 meses)
• Fotos tipo passe recentes
• Extractos bancários dos últimos 3-6 meses
• Comprovativo de rendimentos
• Seguro de viagem

**Mas atenção!** 🤗 Cada país e tipo de visto tem requisitos específicos. 

Na minha experiência aqui na Travel Boss, sempre recomendo que venhas cá primeiro para uma consulta. Assim posso ver exactamente o que precisas e evitas surpresas!

Que tipo de visto estás a pensar tirar? Para que país?`;
        }

        return `Olá! Sou a Ágatha da Travel Boss! 😊

Parece que o meu sistema inteligente está com alguns probleminhas técnicos neste momento, mas não te preocupes - ainda posso ajudar!

🏢 **Para atendimento completo:**
📞 Telefone: ${config.empresa.telefone}
📧 Email: ${config.empresa.email}

⏰ **Horário:**
${config.empresa.horario}

💡 Experimenta digitar **MENU** para reactivar as funcionalidades completas, ou contacta-nos directamente!

Em que posso ajudar-te hoje? 🤗`;
    }

    async analyzeIntent(message) {
        const intents = {
            greeting: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'salut', 'hola'],
            pricing: ['preço', 'precos', 'valor', 'quanto custa', 'custo', 'cobra', 'price'],
            countries: ['portugal', 'brasil', 'eua', 'usa', 'canada', 'europa', 'france', 'germany'],
            documents: ['documento', 'papeis', 'requisitos', 'preciso', 'necessário', 'documents'],
            location: ['onde', 'localização', 'endereço', 'mapa', 'where', 'location'],
            contact: ['telefone', 'contato', 'atendente', 'falar', 'humano', 'person'],
            stop: ['parar', 'stop', 'sair', 'cancelar', 'encerrar'],
            image: ['imagem', 'logo', 'image', 'photo'],
            gallery: ['galeria', 'fotos', 'imagens', 'gallery', 'photos'],
            personal: ['nome', 'chamas', 'quem és', 'who are you', 'your name']
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
        this.userProfiles.delete(userId);
    }

    getStats() {
        return {
            provider: this.provider,
            activeConversations: this.conversationHistory.size,
            totalProfiles: this.userProfiles.size,
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
            personalInteractions: 0,
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
        if (type === 'personal') this.stats.personalInteractions++;
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
            personalInteractions: this.stats.personalInteractions,
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

    isAllowed(userId, maxRequests = 15, windowMs = 60000) { // Mais permissivo para conversas naturais
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
            await msg.reply(`📷 ${caption}\n\n(Imagem temporariamente indisponível - mas posso ajudar-te com todas as informações que precisas! 😊)`);
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
                await client.sendMessage(msg.from, media, { caption: '✨ Travel Boss - O nosso espaço acolhedor onde os sonhos de viagem se tornam realidade!' });
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
    console.log('💁‍♀️ Ágatha QR Code recebido - acesse /qr no navegador');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    clientReady = true;
    lastQR = null;
    lastError = null;
    console.log('✅ Ágatha - Travel Boss AI Assistant conectada no Railway!');
    console.log(`🧠 Provedor de IA: ${AI_CONFIG.provider.toUpperCase()}`);
    console.log(`📊 Modelo: ${AI_CONFIG[AI_CONFIG.provider].model}`);
    console.log('💁‍♀️ Ágatha está online e pronta para ajudar com um sorriso!');
});

client.on('authenticated', (session) => {
    console.log('🔐 Ágatha - WhatsApp autenticado com sucesso');
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
    console.warn('⚠ Ágatha desconectada:', reason);
    userStates.clear();
    
    // Tentar reconectar após 10 segundos
    setTimeout(() => {
        console.log('🔄 Ágatha tentando reconectar...');
        client.initialize();
    }, 10000);
});

// Processamento de mensagens principal
client.on('message', async msg => {
    try {
        if (msg.from.includes('@g.us') || msg.fromMe) return;
        
        const userId = msg.from;
        const userMessage = msg.body.trim();
        
        console.log(`📩 [${new Date().toLocaleTimeString()}] ${userId.split('@')[0]}: ${userMessage}`);

        if (!rateLimiter.isAllowed(userId, 15, 60000)) {
            await msg.reply("Olá! 😅 Parece que estás a enviar muitas mensagens rapidamente. Dá-me alguns segundinhos para processar tudo, ok? 😊");
            return;
        }

        if (!userStates.has(userId)) {
            userStates.set(userId, {
                botAtivo: false,
                estado: 'aguardando_inicio',
                ultimaInteracao: Date.now(),
                primeiraVez: true
            });
        }

        const userState = userStates.get(userId);
        userState.ultimaInteracao = Date.now();

        const lowerMessage = userMessage.toLowerCase().trim();
        
        // Comando para parar
        if (['parar', 'stop', 'sair', 'cancelar', 'encerrar'].includes(lowerMessage)) {
            userState.botAtivo = false;
            userState.estado = 'parado';
            aiService.clearHistory(userId);
            
            await msg.reply(`🤗 Claro! Vou deixar-te falar directamente com a nossa equipa humana.

**Para contacto directo:**
📞 Telefone: ${config.empresa.telefone}
📧 Email: ${config.empresa.email}
⏰ Horário: ${config.empresa.horario}

Se mudares de ideias e quiseres voltar a conversar comigo, é só dizer "oi" ou "menu"! 😊

Obrigada por teres falado comigo! 💛`);
            return;
        }

        // Comandos de activação
        const activationCommands = ['oi', 'olá', 'menu', 'iniciar', 'start', 'travel boss', 'bom dia', 'boa tarde', 'boa noite', 'agatha', 'ágatha'];
        if (activationCommands.some(cmd => lowerMessage.includes(cmd))) {
            userState.botAtivo = true;
            userState.estado = 'ativo';
            
            const now = new Date().getHours();
            let greeting = 'Olá';
            if (now < 12) greeting = 'Bom dia';
            else if (now < 18) greeting = 'Boa tarde';
            else greeting = 'Boa noite';
            
            let welcomeMessage;
            
            if (userState.primeiraVez) {
                welcomeMessage = `${greeting}! 😊 Muito prazer, sou a **Ágatha**!

💁‍♀️ Sou a assistente virtual da **Travel Boss** e estou aqui para tornar o teu processo de visto o mais fácil e tranquilo possível!

✨ **Um pouco sobre mim:**
Trabalho na Travel Boss há 3 anos e adoro ajudar pessoas como tu a realizarem os seus sonhos de viagem! Falo várias línguas e tenho experiência com vistos para todo o mundo.

🌍 **Como posso ajudar-te hoje?**
• 💰 Informações sobre preços de vistos
• 📋 Lista de documentos necessários
• 🗺️ Indicações para nos encontrares
• 🏢 Mostrar-te fotos do nosso espaço
• 📞 Conectar-te com a nossa equipa

Fala comigo como se fosses falar com uma amiga - estou aqui para te ajudar! 🤗

**Para que país estás a pensar viajar?** ✈️`;
                userState.primeiraVez = false;
            } else {
                welcomeMessage = `${greeting} de novo! 😊 Que bom ver-te por cá outra vez!

Como posso ajudar-te hoje? Ainda tens dúvidas sobre aquele visto ou há algo novo em que posso ajudar? 🤗`;
            }

            await msg.reply(welcomeMessage);
            analytics.trackMessage(userId, false);
            return;
        }

        if (!userState.botAtivo) {
            console.log(`🔇 Ágatha inativa para usuário ${userId.split('@')[0]} - mensagem ignorada`);
            return;
        }

        const intent = await aiService.analyzeIntent(userMessage);

        // Tratamento de comandos especiais
        if (intent === 'image') {
            const success = await sendImage(msg, config.images.logo, 'Logo oficial da Travel Boss ✨');
            if (success) {
                analytics.trackMessage(userId, false, 'image');
                await msg.reply('Aqui está! 😊 Esta é a nossa marca! Gostas? Há mais alguma coisa em que te possa ajudar?');
            } else {
                await msg.reply('Ops! 😅 Parece que houve um probleminha técnico com as imagens. Mas não te preocupes - podes sempre passar por cá para ver tudo pessoalmente!');
            }
            return;
        }

        if (intent === 'gallery') {
            await msg.reply('📸 Que boa ideia! Vou mostrar-te como é o nosso espaço...');
            const success = await sendGallery(msg);
            if (success) {
                analytics.trackMessage(userId, false, 'gallery');
                await msg.reply('E então? Gostaste do nosso espaço? 🤗 É muito acolhedor e temos uma equipa fantástica! Quando puderes, aparece para nos conheceres pessoalmente! 💛');
            } else {
                await msg.reply('Ai, que chatice! 😅 As fotos não estão a carregar bem agora, mas prometo que o nosso escritório é lindo! Passa cá quando puderes para veres com os teus próprios olhos! 😊');
            }
            return;
        }

        if (intent === 'location') {
            await msg.reply(`📍 **Claro! Aqui está onde nos encontramos:**

🏢 **Morada:**
${config.empresa.endereco}

🗺️ **Google Maps:**
${config.localizacao.googleMapsUrl}

⏰ **Horários:**
${config.empresa.horario}

💡 Estamos no 2º piso do Kikuxi Shopping - super fácil de encontrar! Tem estacionamento e tudo 😊

Vou enviar-te a localização exacta...`);
            
            const success = await sendLocation(msg);
            if (success) {
                analytics.trackMessage(userId, false, 'location');
                await msg.reply('Pronto! 📍 Localização enviada! Se tiveres dificuldades para encontrar, liga-nos e orientamos-te, ok? 😊');
            } else {
                await msg.reply('Hmm, parece que a localização não foi. Mas não há problema! Usa o link do Google Maps que enviei em cima. Qualquer coisa, liga-nos! 📞');
            }
            return;
        }

        if (intent === 'personal') {
            analytics.trackMessage(userId, false, 'personal');
            await msg.reply(`😊 Que querido(a)! 

Sou a **Ágatha**, tenho 28 anos e sou angolana como tu! 🇦🇴 Formei-me em Turismo e Relações Internacionais e trabalho aqui na Travel Boss há 3 anos.

O que mais gosto no meu trabalho? Ajudar pessoas como tu a realizarem os seus sonhos de viajar pelo mundo! ✈️✨

Já ajudei centenas de clientes a conseguir vistos para Portugal, Brasil, EUA, Canadá... é uma sensação incrível quando recebo a mensagem "Ágatha, consegui o visto!" 🎉

**E tu? Para onde sonhas viajar?** 🌍`);
            return;
        }

        // Gerar resposta com IA
        const startTime = Date.now();
        
        try {
            const aiResponse = await aiService.generateResponse(userId, userMessage, { userState });
            
            if (aiResponse) {
                await msg.reply(aiResponse);
                analytics.trackMessage(userId, true);
                console.log(`✅ Ágatha respondeu em ${Date.now() - startTime}ms`);
            } else {
                throw new Error('Nenhuma resposta da IA');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao processar mensagem para ${userId.split('@')[0]}:`, error.message);
            analytics.trackError(error);
            analytics.trackMessage(userId, false);
            
            await msg.reply(`Ai, desculpa! 😅 O meu cérebro digital teve um pequeno "bug" agora...

**Mas não te preocupes!** Podes contactar-nos directamente:
📞 ${config.empresa.telefone}
📧 ${config.empresa.email}

Ou então tenta escrever "MENU" para recomeçarmos a conversa! 😊

Prometo que normalmente funciono muito melhor que isto! 🤗`);
        }

    } catch (error) {
        console.error('❌ Erro geral no processamento:', error);
        analytics.trackError(error);
        
        try {
            await msg.reply("Ops! 😅 Algo correu mal aqui. A nossa equipa já foi notificada. Tenta novamente em alguns minutos, ok? 🤗");
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
            
            await msg.reply(`📊 **ÁGATHA - ESTATÍSTICAS RAILWAY**

👥 **Interações:**
• Total mensagens: ${stats.totalMessages}
• Usuários únicos: ${stats.uniqueUsers}
• Interações pessoais: ${stats.personalInteractions}

🧠 **Performance IA:**
• Respostas IA: ${stats.aiResponses}
• Respostas fallback: ${stats.fallbackResponses}
• Taxa sucesso: ${stats.aiSuccessRate}
• Conversas ativas: ${aiStats.activeConversations}
• Perfis salvos: ${aiStats.totalProfiles}

📸 **Mídia:**
• Pedidos imagens: ${stats.imageRequests}
• Pedidos localização: ${stats.locationRequests}
• Pedidos galeria: ${stats.galleryRequests}

⚙ **Sistema:**
• Provedor: ${aiStats.provider.toUpperCase()}
• Tempo ativo: ${stats.uptime}
• Erros: ${stats.errors}
• WhatsApp: ${clientReady ? '✅ Conectado' : '❌ Desconectado'}

💁‍♀️ **Ágatha Status:** ${clientReady ? 'Online e Feliz!' : 'Reconectando...'}

Atualizado: ${new Date().toLocaleString('pt-BR')}`);
            break;
            
        case '!health':
        case '!status':
            const uptime = process.uptime();
            const memory = process.memoryUsage();
            
            await msg.reply(`💁‍♀️ **ÁGATHA - STATUS RAILWAY**

⏱ **Uptime:** ${Math.floor(uptime / 60)} minutos
💾 **Memória:** ${Math.round(memory.rss / 1024 / 1024)} MB
🧠 **IA:** ${AI_CONFIG.provider.toUpperCase()} - ${aiService.model ? 'Conectada' : 'Fallback'}
📱 **WhatsApp:** ${clientReady ? 'Conectado' : 'Reconectando...'}
👥 **Usuários ativos:** ${userStates.size}
🌐 **Platform:** Railway

💁‍♀️ **Status Ágatha:** ✅ Funcionando perfeitamente e pronta para ajudar!

🤗 **Personalidade:** Carinhosa, Prestativa e muito Humana!`);
            break;
            
        case '!clear':
            userStates.clear();
            aiService.conversationHistory.clear();
            await msg.reply(`🧹 **ÁGATHA - LIMPEZA RAILWAY**

• Estados de usuários limpos ✅
• Histórico de conversas limpo ✅  
• Perfis pessoais limpos ✅
• Cache liberado ✅
• Memória otimizada ✅

💁‍♀️ Ágatha resetada e pronta para novas conversas! 😊`);
            break;
            
        case '!agatha':
        case '!info':
            await msg.reply(`💁‍♀️ **ÁGATHA - TRAVEL BOSS AI ASSISTANT**

🌐 **URL Base:** https://your-app.railway.app
📊 **Health:** /health
📈 **Status:** /status  
🔍 **QR Code:** /qr

🤖 **Sobre a Ágatha:**
• Nome: Ágatha
• Idade: 28 anos
• Formação: Turismo e Relações Internacionais
• Experiência: 3 anos na Travel Boss
• Personalidade: Humana, Carinhosa, Prestativa
• Idiomas: PT, EN, ES, FR, RU, IT, KIM, DE

🔧 **Comandos Admin:**
• !stats - Estatísticas completas
• !health - Status do sistema
• !clear - Limpar cache
• !agatha - Esta informação

**Platform:** Railway ✅
**Version:** 3.0.0 - Human-Like
**Status:** Online e Sorrindo! 😊`);
            break;
    }
});

// Limpeza automática otimizada para Railway
setInterval(() => {
    const now = Date.now();
    const timeout = 3 * 60 * 60 * 1000; // 3 horas (mais tempo para conversas naturais)
    let cleaned = 0;
    
    for (const [userId, state] of userStates.entries()) {
        if (now - state.ultimaInteracao > timeout) {
            userStates.delete(userId);
            aiService.clearHistory(userId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Ágatha: ${cleaned} usuários inativos removidos com carinho`);
    }
    
    // Força garbage collection se disponível
    if (global.gc) {
        global.gc();
    }
}, 45 * 60 * 1000); // 45 minutos

// Tratamento graceful de encerramento (Railway)
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM recebido - Ágatha se despedindo...');
    
    try {
        if (client && clientReady) {
            await client.destroy();
        }
        console.log('✅ Ágatha desconectada com elegância');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao desconectar Ágatha:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('\n🛑 SIGINT recebido - Ágatha se despedindo...');
    
    try {
        if (client && clientReady) {
            await client.destroy();
        }
        console.log('✅ Ágatha desconectada com elegância');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao desconectar Ágatha:', error);
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
console.log('💁‍♀️ Iniciando Ágatha - Travel Boss AI Assistant no Railway...');
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
    console.log('✅ Ágatha (Google Gemini) configurada para Railway (GRATUITO)');
} else if (AI_CONFIG.provider === 'openai') {
    if (!AI_CONFIG.openai.apiKey) {
        console.error('❌ OPENAI_API_KEY não configurada!');
        console.log('💡 Configure: railway variables set OPENAI_API_KEY=sua_chave');
        process.exit(1);
    }
    console.log('✅ Ágatha (OpenAI) configurada para Railway');
}

console.log('💁‍♀️ Ágatha: Sistema de conversação humana ativado');
console.log('🤗 Personalidade calorosa e prestativa carregada');
console.log('🌐 Health Check Server iniciado');
console.log('🔍 Ágatha aguardando conexão WhatsApp...');
console.log('📱 Para ver QR Code: acesse /qr no navegador');
console.log('✨ Ágatha está quase pronta para fazer novos amigos!');

// Inicializar cliente WhatsApp
client.initialize();

module.exports = {
    client,
    aiService,
    analytics,
    config,
    app
};
