// pages/api/guild-roles.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    try {
        const session = await getServerSession(req, res, authOptions);

        if (!session?.accessToken) {
            return res.status(401).json({ error: "Não autenticado" });
        }

        const { guildId } = req.query;
        if (!guildId) {
            return res.status(400).json({ error: "guildId é obrigatório" });
        }

        const response = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/roles`,
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({ error: err.message || "Erro ao buscar cargos" });
        }

        const roles = await response.json();
        const filtered = roles
            .filter((r) => !r.managed && r.name !== "@everyone")
            .map((r) => ({
                id: r.id,
                name: r.name,
                color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : null,
            }));

        return res.status(200).json({ roles: filtered });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}