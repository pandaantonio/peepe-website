// pages/api/guild/[id]/welcome/index.js
import { adminDb } from "@/lib/firebaseAdmin";

// Função refinada para validar componentes de forma genérica (reutilizável)
function validarComponenteV2(comp, i, sufixoErro = "") {
    if (comp.type === 10 && (!comp.content || comp.content.trim() === "")) {
        return `Componente #${i + 1}${sufixoErro} (Text Display): O campo 'content' é obrigatório.`;
    }
    if (comp.type === 13 && (!comp.file?.url || comp.file.url.trim() === "")) {
        return `Componente #${i + 1}${sufixoErro} (File): A URL do arquivo é obrigatória.`;
    }
    if (comp.type === 14 && comp.spacing !== undefined && ![1, 2].includes(comp.spacing)) {
        return `Componente #${i + 1}${sufixoErro} (Separator): O espaçamento deve ser 1 ou 2.`;
    }
    if (comp.type === 12) {
        if (!Array.isArray(comp.items) || comp.items.length === 0) {
            return `Componente #${i + 1}${sufixoErro} (Galeria): É necessário adicionar pelo menos 1 item.`;
        }
        for (let j = 0; j < comp.items.length; j++) {
            if (!comp.items[j].media?.url || comp.items[j].media.url.trim() === "") {
                return `Componente #${i + 1}${sufixoErro} (Galeria), Item #${j + 1}: A URL da mídia é obrigatória.`;
            }
        }
    }
    // Permite validar a estrutura da Section caso ela esteja aninhada
    if (comp.type === 9) {
        if (!Array.isArray(comp.components) || comp.components.length === 0) {
            return `Componente #${i + 1}${sufixoErro} (Section): Deve conter pelo menos 1 subcomponente interno.`;
        }
        for (let s = 0; s < comp.components.length; s++) {
            const subErro = validarComponenteV2(comp.components[s], s, ` da Section #${i + 1}${sufixoErro}`);
            if (subErro) return subErro;
        }
        if (comp.accessory) {
            const acc = comp.accessory;
            if (acc.type === 11 && (!acc.media?.url || acc.media.url.trim() === "")) {
                return `Componente #${i + 1}${sufixoErro} (Section): O acessório Thumbnail exige uma URL válida.`;
            }
            if (acc.type === 2) {
                if (acc.style !== 5) return `Componente #${i + 1}${sufixoErro} (Section): O botão acessório deve ser do estilo Link (5).`;
                if (!acc.url || acc.url.trim() === "") return `Componente #${i + 1}${sufixoErro} (Section): URL do botão acessório é obrigatória.`;
                if (!acc.label || acc.label.trim() === "") return `Componente #${i + 1}${sufixoErro} (Section): O texto do botão acessório é obrigatório.`;
            }
        }
    }
    return null;
}

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

            if (enabled && isV2) {
                if (!channelId || channelId.trim() === "") {
                    return res.status(400).json({ error: "O Canal de Texto é obrigatório." });
                }
                if (message?.flags !== 32768 || !Array.isArray(message?.components)) {
                    return res.status(400).json({ error: "Estrutura nativa do Modo V2 inválida." });
                }

                const comps = message.components;
                for (let i = 0; i < comps.length; i++) {
                    const comp = comps[i];

                    // Se for CONTAINER (TYPE 17) na raiz
                    if (comp.type === 17) {
                        if (!Array.isArray(comp.components) || comp.components.length === 0) {
                            return res.status(400).json({ error: `Componente #${i + 1} (Container): Deve conter subcomponentes.` });
                        }
                        if (comp.accent_color !== undefined && typeof comp.accent_color !== 'number') {
                            return res.status(400).json({ error: `Componente #${i + 1} (Container): Cor inválida.` });
                        }
                        
                        // Varre os subcomponentes do container (que agora podem incluir Section tipo 9)
                        for (let c = 0; c < comp.components.length; c++) {
                            const erroSub = validarComponenteV2(comp.components[c], c, ` do Container #${i + 1}`);
                            if (erroSub) return res.status(400).json({ error: erroSub });
                        }
                    } else {
                        // Validação para componentes soltos na raiz (incluindo Section tipo 9 solta)
                        const erroGeral = validarComponenteV2(comp, i);
                        if (erroGeral) return res.status(400).json({ error: erroGeral });
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