// pages/api/guild/[id]/welcome/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: "guildId é obrigatório" });
        if (!adminDb) return res.status(500).json({ error: "Banco de dados não disponível" });

        if (req.method === "GET") {
            const snapshot = await adminDb.ref(`welcome/${guildId}`).once("value");
            const data = snapshot.val() || { enabled: false, channelId: "", isV2: false, message: {} };
            return res.status(200).json({
                enabled: data.enabled || false,
                channelId: data.channelId || "",
                isV2: data.isV2 || false,
                message: data.message || {},
            });
        }

        if (req.method === "POST") {
            const { enabled, channelId, isV2, message } = req.body;

            if (enabled) {
                if (!channelId || channelId.trim() === "") {
                    return res.status(400).json({ error: "O Canal de Texto de destino é obrigatório quando o módulo está ativo." });
                }
                
                if (isV2) {
                    if (message?.content || message?.embeds) {
                        return res.status(400).json({ error: "O modo Componentes v2 não permite o uso de content ou embeds tradicionais." });
                    }

                    if (message?.flags !== 32768 || !Array.isArray(message?.components)) {
                        return res.status(400).json({ error: "Estrutura nativa do Modo V2 inválida." });
                    }

                    const comps = message.components;
                    for (let i = 0; i < comps.length; i++) {
                        const comp = comps[i];
                        
                        if (comp.type === 10 && (!comp.content || comp.content.trim() === "")) {
                            return res.status(400).json({ error: `Componente #${i + 1} (Text Display): O campo 'content' é obrigatório.` });
                        }
                        else if (comp.type === 13 && (!comp.file?.url || comp.file.url.trim() === "")) {
                            return res.status(400).json({ error: `Componente #${i + 1} (File): A URL do arquivo é obrigatória.` });
                        }
                        else if (comp.type === 14 && comp.spacing !== undefined && ![1, 2].includes(comp.spacing)) {
                            return res.status(400).json({ error: `Componente #${i + 1} (Separator): O espaçamento deve ser 1 ou 2.` });
                        }
                        else if (comp.type === 12) {
                            if (!Array.isArray(comp.items) || comp.items.length === 0) {
                                return res.status(400).json({ error: `Componente #${i + 1} (Galeria): É necessário adicionar pelo menos 1 item.` });
                            }
                            for (let j = 0; j < comp.items.length; j++) {
                                if (!comp.items[j].media?.url || comp.items[j].media.url.trim() === "") {
                                    return res.status(400).json({ error: `Componente #${i + 1} (Galeria), Item #${j + 1}: A URL da mídia é obrigatória.` });
                                }
                            }
                        }
                    }
                }
            }

            await adminDb.ref(`welcome/${guildId}`).set({
                enabled: !!enabled,
                channelId: channelId || "",
                isV2: !!isV2,
                message: message || {},
                updatedAt: new Date().toISOString()
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Método não permitido" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}