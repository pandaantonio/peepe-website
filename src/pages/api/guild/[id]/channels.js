// pages/api/guild/[id]/channels.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]"; 

export default async function handler(req, res) {
    try {
        const session = await getServerSession(req, res, authOptions);

        if (!session?.accessToken) {
            return res.status(401).json({ success: false, error: "Não autenticado" });
        }

        // O Next.js injeta o [id] da pasta na propriedade req.query.id
        const guildId = req.query.id;
        
        if (!guildId) {
            return res.status(400).json({ success: false, error: "guildId é obrigatório" });
        }

        const response = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/channels`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({ 
                success: false, 
                error: err.message || "Erro ao buscar canais no Discord." 
            });
        }

        const channels = await response.json();
        
        // Filtra estritamente por canais de texto
        const filtered = channels
            .filter((c) => c.type === 0)
            .map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
            }));

        // Força a resposta a ir como JSON limpo
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ success: true, channels: filtered });

    } catch (err) {
        console.error("Erro na API de Canais:", err);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ success: false, error: err.message });
    }
}