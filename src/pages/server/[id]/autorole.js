// pages/server/[id]/autorole.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, 
  FaDiscord, 
  FaUserPlus, 
  FaRobot, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaPlus
} from 'react-icons/fa';

export default function AutorolePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();
  
  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [autorole, setAutorole] = useState({ users: [], apps: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const [selectedAppRole, setSelectedAppRole] = useState('');

  useEffect(() => {
    if (!guildId || status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/servers");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        
        // Buscar informações do servidor
        const guildsResponse = await fetch(`/api/user-guilds`);
        const guildsData = await guildsResponse.json();
        
        if (!guildsResponse.ok || !guildsData.success) {
          throw new Error(guildsData.error || 'Erro ao buscar servidor');
        }
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado');
        setGuild(foundGuild);

        // Buscar cargos do servidor usando guild-roles
        const rolesResponse = await fetch(`/api/guild-roles?guildId=${guildId}`);
        if (!rolesResponse.ok) {
          const errorData = await rolesResponse.json();
          throw new Error(errorData.error || 'Erro ao buscar cargos');
        }
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);

        // Buscar configuração atual de autorole
        const autoroleResponse = await fetch(`/api/guild/${guildId}/autorole`);
        if (autoroleResponse.ok) {
          const autoroleData = await autoroleResponse.json();
          setAutorole({
            users: autoroleData.users || [],
            apps: autoroleData.apps || []
          });
        }

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

  // Obter cargos disponíveis (todos os cargos)
  const getAvailableRolesForUsers = () => {
    return roles.filter(role => !autorole.users.some(r => r.id === role.id));
  };

  const getAvailableRolesForApps = () => {
    return roles.filter(role => !autorole.apps.some(r => r.id === role.id));
  };

  const handleAddUserRole = () => {
    if (!selectedUserRole) return;
    const role = roles.find(r => r.id === selectedUserRole);
    if (!role) return;
    
    if (!autorole.users.some(r => r.id === role.id)) {
      setAutorole(prev => ({
        ...prev,
        users: [...prev.users, { id: role.id, name: role.name, color: role.color }]
      }));
    }
    setSelectedUserRole('');
  };

  const handleAddAppRole = () => {
    if (!selectedAppRole) return;
    const role = roles.find(r => r.id === selectedAppRole);
    if (!role) return;
    
    if (!autorole.apps.some(r => r.id === role.id)) {
      setAutorole(prev => ({
        ...prev,
        apps: [...prev.apps, { id: role.id, name: role.name, color: role.color }]
      }));
    }
    setSelectedAppRole('');
  };

  const handleRemoveUserRole = (roleId) => {
    setAutorole(prev => ({
      ...prev,
      users: prev.users.filter(r => r.id !== roleId)
    }));
  };

  const handleRemoveAppRole = (roleId) => {
    setAutorole(prev => ({
      ...prev,
      apps: prev.apps.filter(r => r.id !== roleId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/guild/${guildId}/autorole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: autorole.users,
          apps: autorole.apps
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar configuração');

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
  const availableRolesForUsers = getAvailableRolesForUsers();
  const availableRolesForApps = getAvailableRolesForApps();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      <Navbar />

      {/* Glow de fundo */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-24 z-10">
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
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-600" />
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={guild.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <FaDiscord size={22} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-white mb-0.5">Auto Role</h1>
            <p className="text-slate-400 text-xs font-medium">
              Automação de entrega de cargos para <span className="text-slate-200">{guild.name}</span>
            </p>
          </div>
        </div>

        {/* Mensagens de feedback flutuantes/animadas */}
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

        {/* Grid de Configuração */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Painel: Usuários comuns */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-800/60 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FaUserPlus size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-200">Novos Membros</h2>
                  <p className="text-slate-400 text-[11px] font-medium leading-tight">
                    Cargos aplicados instantaneamente à conta de usuários reais
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Cargos definidos ({autorole.users.length})
                  </span>
                  {autorole.users.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
                      <p className="text-slate-500 text-xs font-medium">Nenhum cargo ativo nesta categoria</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {autorole.users.map(role => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: role.color || '#10b981' }}
                            />
                            <span className="text-slate-300 text-xs font-semibold truncate">{role.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveUserRole(role.id)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 transition-all duration-250"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input integrado na parte inferior */}
            <div className="p-5 bg-slate-950/20 border-t border-slate-800/50">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vincular cargo</span>
              <div className="flex gap-2">
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-medium focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Selecione um cargo da guilda...</option>
                  {availableRolesForUsers.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddUserRole}
                  disabled={!selectedUserRole}
                  className="px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPlus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Painel: Aplicações/Bots */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-800/60 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                  <FaRobot size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-200">Aplicações & Bots</h2>
                  <p className="text-slate-400 text-[11px] font-medium leading-tight">
                    Cargos aplicados estritamente para sistemas e integrações recém-adicionadas
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-6">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Cargos definidos ({autorole.apps.length})
                  </span>
                  {autorole.apps.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
                      <p className="text-slate-500 text-xs font-medium">Nenhum cargo ativo nesta categoria</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {autorole.apps.map(role => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: role.color || '#10b981' }}
                            />
                            <span className="text-slate-300 text-xs font-semibold truncate">{role.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAppRole(role.id)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 transition-all duration-250"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input integrado na parte inferior */}
            <div className="p-5 bg-slate-950/20 border-t border-slate-800/50">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vincular cargo</span>
              <div className="flex gap-2">
                <select
                  value={selectedAppRole}
                  onChange={(e) => setSelectedAppRole(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-medium focus:outline-none focus:border-fuchsia-500/40 transition-colors"
                >
                  <option value="">Selecione um cargo da guilda...</option>
                  {availableRolesForApps.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddAppRole}
                  disabled={!selectedAppRole}
                  className="px-4 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 text-fuchsia-400 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPlus size={11} />
                </button>
              </div>
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs tracking-wide transition-all duration-200 flex items-center gap-2 shadow-md shadow-emerald-950/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
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

        {/* Footer Informativo */}
        <div className="mt-16 pt-6 border-t border-slate-900 text-center space-y-1">
          <p className="text-slate-600 text-[10px] font-semibold tracking-wide uppercase">
            Atenção: Garanta que o cargo do Peepe Bot esteja acima dos cargos selecionados na hierarquia interna do Discord.
          </p>
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