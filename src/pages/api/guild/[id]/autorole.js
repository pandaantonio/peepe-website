// pages/api/guild/[id]/autorole/index.js
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    try {
        const { id: guildId } = req.query;

        if (!guildId) {
            return res.status(400).json({ error: "guildId é obrigatório" });
        }

        // Verifica se o Firebase Admin está disponível
        if (!adminDb) {
            console.error("Firebase Admin não está inicializado");
            return res.status(500).json({ 
                error: "Erro interno do servidor",
                message: "Banco de dados não disponível"
            });
        }

        if (req.method === "GET") {
            try {
                const snapshot = await adminDb.ref(`autorole/${guildId}`).once("value");
                const data = snapshot.val() || { users: [], apps: [] };
                return res.status(200).json({
                    users: data.users || [],
                    apps: data.apps || [],
                });
            } catch (dbError) {
                console.error("Erro ao ler do Firebase:", dbError);
                return res.status(500).json({ 
                    error: "Erro ao ler configurações",
                    message: dbError.message 
                });
            }
        }

        if (req.method === "POST") {
            const { users, apps } = req.body;

            // Valida os dados
            if (!users || !apps) {
                return res.status(400).json({ error: "Dados inválidos" });
            }

            try {
                await adminDb.ref(`autorole/${guildId}`).set({
                    users: users || [],
                    apps: apps || [],
                    updatedAt: new Date().toISOString()
                });
                return res.status(200).json({ success: true });
            } catch (dbError) {
                console.error("Erro ao salvar no Firebase:", dbError);
                return res.status(500).json({ 
                    error: "Erro ao salvar configurações",
                    message: dbError.message 
                });
            }
        }

        return res.status(405).json({ error: "Método não permitido" });
    } catch (err) {
        console.error("Erro na API autorole:", err);
        return res.status(500).json({ error: err.message });
    }
}