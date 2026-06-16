// pages/api/guild/[id]/welcome/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: "guildId é obrigatório" });
        if (!adminDb) return res.status(500).json({ error: "Banco de dados não disponível" });

        if (req.method === "GET") {
            const snapshot = await adminDb.ref(`welcome/${guildId}`).once("value");
            const data = snapshot.val() || { enabled: false, webhookURL: "", isV2: false, message: {} };
            return res.status(200).json({
                enabled: data.enabled || false,
                webhookURL: data.webhookURL || "",
                isV2: data.isV2 || false,
                message: data.message || {},
            });
        }

        if (req.method === "POST") {
            const { enabled, webhookURL, isV2, message } = req.body;

            if (enabled) {
                if (!webhookURL || webhookURL.trim() === "") {
                    return res.status(400).json({ error: "A URL do Webhook é obrigatória quando o módulo está ativo." });
                }
                
                if (isV2) {
                    // Proteção para garantir que content e embeds antigos foram limpos
                    if (message?.content || message?.embeds) {
                        return res.status(400).json({ error: "O modo Componentes v2 não permite o uso de content ou embeds tradicionais." });
                    }

                    if (message?.flags !== 32768 || !Array.isArray(message?.components)) {
                        return res.status(400).json({ error: "Estrutura nativa do Modo V2 inválida." });
                    }

                    // Validação minuciosa de cada componente inserido pelo usuário
                    const comps = message.components;
                    for (let i = 0; i < comps.length; i++) {
                        const comp = comps[i];
                        
                        // 1. Text Display (Type 10)
                        if (comp.type === 10) {
                            if (!comp.content || comp.content.trim() === "") {
                                return res.status(400).json({ error: `Componente #${i + 1} (Text Display): O campo 'content' é obrigatório.` });
                            }
                        }
                        // 2. File (Type 13)
                        else if (comp.type === 13) {
                            if (!comp.file?.url || comp.file.url.trim() === "") {
                                return res.status(400).json({ error: `Componente #${i + 1} (File): A URL do arquivo é obrigatória.` });
                            }
                        }
                        // 3. Separator (Type 14)
                        else if (comp.type === 14) {
                            // Divider e Spacing são opcionais, se não existirem no payload não salvamos, mas se existirem validamos valores
                            if (comp.spacing !== undefined && ![1, 2].includes(comp.spacing)) {
                                return res.status(400).json({ error: `Componente #${i + 1} (Separator): O espaçamento deve ser 1 ou 2.` });
                            }
                        }
                        // 4. Media Gallery (Type 12)
                        else if (comp.type === 12) {
                            if (!Array.isArray(comp.items) || comp.items.length === 0) {
                                return res.status(400).json({ error: `Componente #${i + 1} (Galeria): É necessário adicionar pelo menos 1 item na galeria.` });
                            }
                            for (let j = 0; j < comp.items.length; j++) {
                                const item = comp.items[j];
                                if (!item.media?.url || item.media.url.trim() === "") {
                                    return res.status(400).json({ error: `Componente #${i + 1} (Galeria), Item #${j + 1}: A URL da mídia é obrigatória.` });
                                }
                            }
                        } else {
                            return res.status(400).json({ error: `Componente #${i + 1}: Tipo de componente desconhecido.` });
                        }
                    }
                }
            }

            await adminDb.ref(`welcome/${guildId}`).set({
                enabled: !!enabled,
                webhookURL: webhookURL || "",
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