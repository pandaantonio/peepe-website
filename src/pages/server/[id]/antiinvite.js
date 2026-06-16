// pages/server/[id]/antiinvite.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, 
  FaDiscord,
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
      <div className="min-h-screen bg-[#0B0F17] text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm tracking-wide">Buscando definições...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !guild) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <FaExclamationTriangle size={24} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erro Operacional</h2>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push(`/server/${guildId}`)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 rounded-xl font-semibold text-sm transition-all duration-200"
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
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      <Navbar />

      {/* Glow de fundo (Assinatura azul/indigo para o módulo de segurança/convites) */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-6 pt-36 pb-24 z-10">
        
        {/* Botão Voltar */}
        <button
          onClick={() => router.push(`/server/${guildId}`)}
          className="group inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all duration-200 text-xs font-bold tracking-wide"
        >
          <FaArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao Dashboard</span>
        </button>

        {/* Mini Banner do Servidor */}
        <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 mb-10 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={guild?.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <FaDiscord size={22} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-white mb-0.5">Proteção Anti-Invite</h1>
            <p className="text-slate-400 text-xs font-medium">
              Evite a divulgação externa bloqueando convites em <span className="text-slate-200">{guild?.name}</span>
            </p>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-fade-in shadow-lg">
            <FaCheckCircle className="text-emerald-400" size={16} />
            <span className="text-emerald-400 text-sm font-medium">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-fade-in shadow-lg">
            <FaExclamationTriangle className="text-rose-400" size={16} />
            <span className="text-rose-400 text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Grid de Configurações Principais */}
        <div className="space-y-5">
          
          {/* Toggle Geral */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-200">Ativar Anti-Invite</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-md mt-0.5">
                Bloqueia o envio de links de convites externos do Discord no chat para evitar evasão de membros.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-600 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 peer-checked:border-blue-400/20" />
            </label>
          </div>

          {/* Subopções Condicionais */}
          <div className={`space-y-5 transition-all duration-300 ${enabled ? 'opacity-100 pointer-events-auto' : 'opacity-35 pointer-events-none'}`}>
            
            {/* Permitir convites do próprio servidor */}
            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-slate-200 text-sm">Permitir convites deste Servidor</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-md mt-0.5">
                  O bot vai validar se o convite enviado pertence originalmente a este servidor para poder liberá-lo no chat.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input 
                  type="checkbox" 
                  checked={allowOwnInvites} 
                  disabled={!enabled}
                  onChange={(e) => setAllowOwnInvites(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-950 border border-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-700 peer-checked:after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500 peer-checked:border-blue-400/20" />
              </label>
            </div>

            {/* Whitelist de Convites */}
            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5">
              <h3 className="text-base font-bold text-slate-200">Convites Permitidos (Exceções)</h3>
              <p className="text-slate-400 text-xs font-medium mb-4 mt-0.5">
                Adicione códigos ou links de servidores parceiros que possuem passe livre para divulgação dentro do chat.
              </p>
              
              <form onSubmit={handleAddInvite} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newInvite}
                  disabled={!enabled}
                  onChange={(e) => setNewInvite(e.target.value)}
                  placeholder="Ex: discord.gg/exemplo ou apenas o código"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 text-xs font-medium transition-all"
                />
                <button
                  type="submit"
                  disabled={!enabled}
                  className="px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPlus size={11} />
                </button>
              </form>

              {/* Lista de tags inseridas */}
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                {allowedInvites.length === 0 ? (
                  <p className="text-slate-600 text-xs font-medium italic py-1">Nenhum convite externo liberado.</p>
                ) : (
                  allowedInvites.map((code) => (
                    <div 
                      key={code}
                      className="inline-flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 text-slate-300 text-xs px-3 py-1.5 rounded-xl"
                    >
                      <span className="font-mono text-[11px] font-medium">discord.gg/{code}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveInvite(code)}
                        className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <FaTrash size={9} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Menu Inferior de Ações Gerais */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
            <button
              onClick={() => router.push(`/server/${guildId}`)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            >
              Cancelar descarte
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-md shadow-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" size={13} />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <FaSave size={13} />
                  <span>Salvar Alterações</span>
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
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}