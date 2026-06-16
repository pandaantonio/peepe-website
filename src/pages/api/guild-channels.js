// pages/api/guild/[id]/channels.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session?.accessToken) return res.status(401).json({ error: "Não autenticado" });

        const { id: guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: "guildId é obrigatório" });

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
            return res.status(response.status).json({ error: err.message || "Erro ao buscar canais" });
        }

        const channels = await response.json();
        
        // Filtra apenas por canais de texto (Type 0)
        const textChannels = channels
            .filter((c) => c.type === 0)
            .map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
            }));

        return res.status(200).json({ success: true, channels: textChannels });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}