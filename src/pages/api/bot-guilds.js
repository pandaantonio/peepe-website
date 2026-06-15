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

        if (res.status !== 429) {
            return res;
        }

        const retryAfter = res.headers.get("retry-after") || 1;
        const waitMs = parseFloat(retryAfter) * 1000 + 100;
        console.log(`Rate limited, waiting ${waitMs}ms before retry ${i + 1}/${maxRetries}`);
        await new Promise(r => setTimeout(r, waitMs));
    }

    return fetch(url, options);
}

export default async function handler(req, res) {
    // Permitir apenas GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Método não permitido" });
    }

    // Cache baseado no bot
    const cacheKey = 'bot_guilds_list';
    const cached = getCached(cacheKey);

    if (cached) {
        console.log("Returning cached bot guilds");
        return res.status(200).json({
            success: true,
            cached: true,
            totalGuilds: cached.length,
            guilds: cached
        });
    }

    try {
        // Buscar todos os servidores onde o bot está
        const response = await fetchWithRetry(
            "https://discord.com/api/users/@me/guilds",
            { 
                headers: { 
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
                } 
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            return res.status(500).json({
                error: `Discord API retornou ${response.status}`,
                discordStatus: response.status,
                discordResponse: errorBody
            });
        }

        const guilds = await response.json();

        if (!Array.isArray(guilds)) {
            return res.status(500).json({
                error: "Resposta não é um array",
                response: guilds
            });
        }

        // Formatar os dados dos servidores
        const botGuilds = guilds.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            owner: guild.owner || false,
            permissions: guild.permissions,
            approximateMemberCount: guild.approximate_member_count,
            approximatePresenceCount: guild.approximate_presence_count
        }));

        // Ordenar por nome
        const sortedGuilds = botGuilds.sort((a, b) => a.name.localeCompare(b.name));

        // Salvar no cache
        setCached(cacheKey, sortedGuilds);

        return res.status(200).json({
            success: true,
            cached: false,
            totalGuilds: sortedGuilds.length,
            guilds: sortedGuilds
        });

    } catch (err) {
        console.error("Error in bot-guilds API:", err);
        return res.status(500).json({
            error: "Erro interno",
            message: err.message
        });
    }
}