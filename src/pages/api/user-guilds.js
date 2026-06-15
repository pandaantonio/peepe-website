// pages/api/user-guilds.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return item.data;
}

function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const res = await fetch(url, options);
        if (res.status !== 429) return res;
        
        const retryAfter = res.headers.get("retry-after") || 1;
        const waitMs = parseFloat(retryAfter) * 1000 + 100;
        console.warn(`[Discord API] Rate limited. Aguardando ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
    }
    return fetch(url, options);
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Método não permitido. Utilize GET." });
    }

    // 1. Tenta obter a sessão do NextAuth
    let session = null;
    try {
        session = await getServerSession(req, res, authOptions);
        console.log("[DEBUG] Session encontrada:", !!session);
        if (session) {
            console.log("[DEBUG] AccessToken presente:", !!session.accessToken);
        }
    } catch (sessionError) {
        console.error("[Session Error]", sessionError);
    }

    // 2. Verifica se tem token na sessão
    if (!session || !session.accessToken) {
        console.log("[DEBUG] Token não encontrado na sessão");
        
        // Tenta pegar do header Authorization (fallback)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            console.log("[DEBUG] Token encontrado no header");
            
            // Processa com o token do header
            try {
                return await processGuilds(token, res);
            } catch (err) {
                return res.status(401).json({ 
                    error: "Não autorizado", 
                    message: "Token inválido ou expirado" 
                });
            }
        }
        
        return res.status(401).json({ 
            error: "Não autorizado", 
            message: "Você precisa estar logado para acessar esta rota" 
        });
    }

    // 3. Processa com o token da sessão
    return await processGuilds(session.accessToken, res);
}

async function processGuilds(accessToken, res) {
    const cacheKey = `user_guilds_${accessToken.substring(0, 20)}`;
    const cachedData = getCached(cacheKey);
    
    if (cachedData) {
        console.log("[DEBUG] Retornando cache");
        return res.status(200).json({ success: true, cached: true, guilds: cachedData });
    }

    try {
        // Validação do Token do Bot
        if (!process.env.DISCORD_BOT_TOKEN) {
            console.error("[ERROR] DISCORD_BOT_TOKEN não configurado");
            return res.status(500).json({
                error: "Configuração ausente",
                message: "A variável de ambiente DISCORD_BOT_TOKEN não está definida"
            });
        }

        console.log("[DEBUG] Buscando servidores do bot...");
        
        // Buscar servidores onde o BOT está presente
        let botGuilds = getCached("bot_guilds_global");
        
        if (!botGuilds) {
            const botResponse = await fetchWithRetry(
                "https://discord.com/api/users/@me/guilds",
                { 
                    headers: { 
                        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                    } 
                }
            );

            if (!botResponse.ok) {
                const errText = await botResponse.text();
                console.error("[ERROR] Bot API:", botResponse.status, errText);
                return res.status(botResponse.status).json({
                    error: "Erro na API do Bot Discord",
                    message: errText
                });
            }
            
            botGuilds = await botResponse.json();
            setCached("bot_guilds_global", botGuilds);
            console.log(`[DEBUG] Bot está em ${botGuilds.length} servidores`);
        }
        
        const botGuildIds = new Set(botGuilds.map(g => g.id));

        console.log("[DEBUG] Buscando servidores do usuário...");
        
        // Buscar servidores do USUÁRIO logado
        const userResponse = await fetchWithRetry(
            "https://discord.com/api/users/@me/guilds",
            { 
                headers: { 
                    Authorization: `Bearer ${accessToken}`
                } 
            }
        );

        if (!userResponse.ok) {
            const errText = await userResponse.text();
            console.error("[ERROR] User API:", userResponse.status, errText);
            return res.status(userResponse.status).json({
                error: "Erro na API de Usuário do Discord",
                message: errText,
                status: userResponse.status
            });
        }

        const userGuilds = await userResponse.json();
        console.log(`[DEBUG] Usuário está em ${userGuilds.length} servidores`);

        if (!Array.isArray(userGuilds)) {
            return res.status(500).json({
                error: "Resposta inválida do Discord",
                message: "O Discord não retornou uma lista válida de servidores."
            });
        }

        // Filtrar servidores onde o bot está presente E o usuário é admin/dono
        const result = userGuilds
            .filter(guild => {
                const isBotPresent = botGuildIds.has(guild.id);
                const isOwner = guild.owner === true;
                const permissions = BigInt(guild.permissions || 0);
                const isAdministrator = (permissions & BigInt(0x8)) === BigInt(0x8);
                
                const isValid = isBotPresent && (isOwner || isAdministrator);
                if (isValid) {
                    console.log(`[DEBUG] Servidor válido: ${guild.name} (Admin: ${isAdministrator}, Owner: ${isOwner})`);
                }
                return isValid;
            })
            .map(g => ({
                id: g.id,
                name: g.name,
                icon: g.icon,
                owner: g.owner || false
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`[DEBUG] ${result.length} servidores válidos encontrados`);
        
        setCached(cacheKey, result);

        return res.status(200).json({
            success: true,
            cached: false,
            totalGuilds: result.length,
            guilds: result
        });

    } catch (err) {
        console.error("[API User Guilds Error]:", err);
        return res.status(500).json({
            error: "Erro na execução da rota de servidores",
            message: err.message
        });
    }
}