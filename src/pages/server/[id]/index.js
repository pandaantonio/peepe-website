// pages/server/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, 
  FaDiscord, 
  FaUserPlus, 
  FaShieldAlt, 
  FaCog,
  FaChevronRight,
  FaLink,
  FaUserShield
} from 'react-icons/fa';

export default function GuildDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/servers");
      return;
    }

    async function fetchGuildInfo() {
      try {
        console.log(`Buscando informações do servidor ${id}...`);
        
        // Buscar servidores do usuário
        const response = await fetch(`/api/user-guilds`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || `Erro ${response.status} ao buscar servidores`);
        }
        
        const foundGuild = data.guilds?.find(g => g.id === id);
        
        if (!foundGuild) {
          setError('Servidor não encontrado ou você não tem permissão para gerenciá-lo.');
          setLoading(false);
          return;
        }
        
        setGuild(foundGuild);
      } catch (err) {
        console.error('Erro ao buscar informações do servidor:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.accessToken) {
      fetchGuildInfo();
    }
  }, [id, session, status, router]);

  const handleBackToServers = () => router.push('/servers');

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
            <p className="text-slate-400 text-sm tracking-wide">Carregando painel do servidor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erro Operacional</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button
              onClick={handleBackToServers}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 rounded-xl font-semibold text-sm transition-all duration-200"
            >
              Voltar aos Servidores
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <FaDiscord size={24} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Servidor não localizado</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              A guilda especificada pode ter removido o bot ou sua conta perdeu os privilégios administrativos.
            </p>
            <button
              onClick={handleBackToServers}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 rounded-xl font-semibold text-sm transition-all duration-200"
            >
              Voltar aos Servidores
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iconUrl = getIconUrl();

  // Exibindo apenas módulos ativos (Removidos os "Em breve")
  const configCards = [
    {
      id: 'autorole',
      title: 'Auto Role',
      description: 'Configure cargos automáticos para novos membros assim que entrarem no servidor.',
      icon: <FaUserPlus size={22} />,
      color: 'emerald',
      path: `/server/${guild.id}/autorole`
    },
    {
      id: 'antilink',
      title: 'Anti-Link',
      description: 'Bloqueie links maliciosos ou não autorizados enviados nos canais de texto públicos.',
      icon: <FaLink size={20} />,
      color: 'purple',
      path: `/server/${guild.id}/antilink`
    },
    {
      id: 'antiinvite',
      title: 'Anti-Invite',
      description: 'Evite a evasão de membros bloqueando convites de outros servidores do Discord.',
      icon: <FaUserShield size={20} />,
      color: 'red',
      path: `/server/${guild.id}/antiinvite`
    }
  ];

  const colorClasses = {
    emerald: {
      border: "hover:border-emerald-500/30",
      bg: "group-hover:bg-emerald-500/[0.02]",
      text: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      button: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-950/40"
    },
    red: {
      border: "hover:border-rose-500/30",
      bg: "group-hover:bg-rose-500/[0.02]",
      text: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      button: "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40"
    },
    purple: {
      border: "hover:border-fuchsia-500/30",
      bg: "group-hover:bg-fuchsia-500/[0.02]",
      text: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
      button: "bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-fuchsia-950/40"
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      <Navbar />

      {/* Glow de fundo */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[250px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-24 z-10">
        
        {/* Botão Voltar */}
        <button
          onClick={handleBackToServers}
          className="group inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all duration-200 text-xs font-bold tracking-wide"
        >
          <FaArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar aos Servidores</span>
        </button>

        {/* Banner/Header do Servidor */}
        <div className="bg-slate-900/30 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-600" />
          
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={guild.name}
              className="w-16 h-16 rounded-xl object-cover ring-4 ring-slate-900 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <FaDiscord size={28} />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">{guild.name}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-500">
                ID: {guild.id}
              </span>
              {guild.owner && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  Proprietário
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Acesso Master
              </span>
            </div>
          </div>
        </div>

        {/* Seção de Módulos */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-emerald-400">
              <FaCog size={13} />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-white">
              Sistemas Operacionais
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {configCards.map((card) => {
              const colors = colorClasses[card.color];
              
              return (
                <Link
                  key={card.id}
                  href={card.path}
                  className="group flex"
                >
                  <div className={`w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between relative ${colors.border}`}>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colors.bg}`} />
                    
                    <div className="p-5 relative flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colors.text}`}>
                            {card.icon}
                          </div>
                          <span className="text-[9px] font-black tracking-widest text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 uppercase">
                            Ativo
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
                          {card.title}
                        </h3>
                        
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">
                          {card.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-auto">
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400 font-medium transition-colors">
                          Abrir painel de controle
                        </span>
                        <div className={`w-8 h-8 rounded-lg ${colors.button} flex items-center justify-center transition-all duration-200 shadow-md`}>
                          <FaChevronRight size={11} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-slate-900 text-center">
          <p className="text-slate-600 text-[11px] font-medium tracking-wide uppercase">
            Sincronizado com a API do Discord
          </p>
        </div>
      </div>
    </div>
  );
}