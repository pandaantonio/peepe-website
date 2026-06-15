// pages/server/[id]/antiinvite.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, 
  FaDiscord,
  FaUserShield, 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function AntiInvitePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  // Estados de Configuração
  const [guild, setGuild] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [allowOwnInvites, setAllowOwnInvites] = useState(false);
  const [allowedInvites, setAllowedInvites] = useState([]);
  const [newInvite, setNewInvite] = useState('');

  // Estados de Controle de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!guildId || status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/servers");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Buscar informações do servidor para o Header do topo
        const guildsResponse = await fetch(`/api/user-guilds`);
        const guildsData = await guildsResponse.json();
        
        if (!guildsResponse.ok || !guildsData.success) {
          throw new Error(guildsData.error || 'Erro ao buscar servidor');
        }
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado');
        setGuild(foundGuild);

        // 2. Buscar configuração atual do Anti-Invite
        const response = await fetch(`/api/guild/${guildId}/antiinvite`);
        if (!response.ok) throw new Error('Erro ao carregar dados do Anti-Invite.');
        
        const data = await response.json();
        setEnabled(data.enabled);
        setAllowOwnInvites(data.allowOwnInvites);
        setAllowedInvites(data.allowedInvites || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.accessToken) {
      fetchData();
    }
  }, [guildId, session, status, router]);

  // Salvar configurações
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/guild/${guildId}/antiinvite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          allowOwnInvites,
          allowedInvites
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar as configurações.');
      
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Adiciona código de convite na Whitelist
  const handleAddInvite = (e) => {
    e.preventDefault();
    let inviteInput = newInvite.trim();
    if (!inviteInput) return;
    
    // Filtra o link completo deixando apenas o código
    const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord\.com\/invite\/)?([A-Za-z0-9-]+)/;
    const match = inviteInput.match(inviteRegex);
    const inviteCode = match ? match[1] : inviteInput;

    if (allowedInvites.includes(inviteCode)) {
      setNewInvite('');
      return;
    }

    setAllowedInvites([...allowedInvites, inviteCode]);
    setNewInvite('');
  };

  // Remove convite da Whitelist
  const handleRemoveInvite = (inviteToRemove) => {
    setAllowedInvites(allowedInvites.filter(code => code !== inviteToRemove));
  };

  const getIconUrl = () => {
    if (!guild?.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-300">Carregando módulo Anti-Invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !guild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
              <FaExclamationTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-green-300 mb-2">Erro</h2>
            <p className="text-green-400 mb-6">{error}</p>
            <button
              onClick={() => router.push(`/server/${guildId}`)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iconUrl = getIconUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
      <Navbar />
      
      <div className="relative max-w-4xl mx-auto px-6 py-8 pt-28">
        
        {/* Botão Voltar */}
        <button
          onClick={() => router.push(`/server/${guildId}`)}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-black/50 border border-green-500/30 hover:bg-green-500/10 transition-all duration-300 text-green-400 hover:text-green-300"
        >
          <FaArrowLeft size={14} />
          <span className="text-sm font-medium">Voltar ao Dashboard</span>
        </button>

        {/* Header do Servidor */}
        <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={guild?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-green-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                <FaDiscord size={32} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-green-300 mb-1">Proteção Anti-Invite</h1>
              <p className="text-green-400 text-sm">
                Evite a divulgação externa bloqueando convites em {guild?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 animate-fade-in">
            <FaCheckCircle className="text-green-400" size={20} />
            <span className="text-green-400">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-fade-in">
            <FaExclamationTriangle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Caixa de Configurações Principais */}
        <div className="space-y-6">
          
          {/* Toggle Geral */}
          <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-300">Ativar Anti-Invite</h3>
              <p className="text-green-400 text-sm max-w-md">Bloqueia o envio de links de convites externos do Discord no chat.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-black/40 border border-green-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-green-700 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
          </div>

          {/* Subopções (Ajustado opacidade dinamicamente com base no 'enabled') */}
          <div className={`space-y-6 transition-all duration-300 ${enabled ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
            
            {/* Permitir convites do próprio servidor */}
            <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-300 text-md">Permitir convites deste Servidor</h4>
                <p className="text-green-400/80 text-sm max-w-md">O bot vai validar se o convite enviado pertence a este servidor para poder liberá-lo.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={allowOwnInvites} 
                  disabled={!enabled}
                  onChange={(e) => setAllowOwnInvites(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-black/40 border border-green-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-green-700 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
              </label>
            </div>

            {/* Whitelist de Convites */}
            <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-300 mb-1">Convites Permitidos (Exceções)</h3>
              <p className="text-green-400 text-sm mb-4">Adicione códigos ou links de servidores parceiros que são permitidos dentro do chat.</p>
              
              <form onSubmit={handleAddInvite} className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  value={newInvite}
                  disabled={!enabled}
                  onChange={(e) => setNewInvite(e.target.value)}
                  placeholder="Ex: discord.gg/exemplo ou apenas o código"
                  className="flex-1 px-4 py-2.5 bg-black/50 border border-green-500/30 rounded-lg text-green-300 placeholder-green-700 focus:outline-none focus:border-green-500/50 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!enabled}
                  className="px-4 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPlus size={14} />
                </button>
              </form>

              {/* Lista de tags inseridas */}
              <div className="flex flex-wrap gap-2">
                {allowedInvites.length === 0 ? (
                  <p className="text-green-600/50 text-xs italic">Nenhum convite externo liberado.</p>
                ) : (
                  allowedInvites.map((code) => (
                    <div 
                      key={code}
                      className="inline-flex items-center gap-2 bg-black/40 border border-green-500/30 text-green-300 text-xs px-3 py-1.5 rounded-lg"
                    >
                      <span className="font-mono">discord.gg/{code}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveInvite(code)}
                        className="p-1 text-green-500 hover:text-red-400 transition-colors"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Botões Inferiores de Ação */}
          <div className="mt-8 flex justify-end gap-3 border-t border-green-500/20 pt-6">
            <button
              onClick={() => router.push(`/server/${guildId}`)}
              className="px-6 py-2.5 rounded-lg bg-black/50 border border-green-500/30 hover:bg-green-500/10 text-green-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <FaSave size={16} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}