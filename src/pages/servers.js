// pages/servers.js
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { FaServer, FaCrown, FaShieldAlt, FaArrowRight, FaDiscord } from "react-icons/fa";

export default function Servers() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      fetchUserGuilds();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchUserGuilds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user-guilds");
      const data = await response.json();

      if (response.ok && data.success) {
        setGuilds(data.guilds);
      } else {
        setError(data.error || "Erro ao carregar servidores");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGuildIcon = (guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`;
    }
    return null;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm tracking-wide">Buscando suas guildas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center flex-1 px-6">
          <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-2xl p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-green-500" />
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <FaDiscord className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Acesso Restrito</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Conecte sua conta do Discord para visualizar e gerenciar as configurações do Peepe Bot em seus servidores.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5"
            >
              Entrar com Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      <Head>
        <title>Meus Servidores - Peepe Bot</title>
        <meta name="description" content="Gerencie os servidores onde o Peepe Bot está presente" />
      </Head>

      {/* Glow ambiental de fundo */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <Navbar />

      <div className="container mx-auto px-6 pt-36 pb-24 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="text-left mb-12 border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Meus Servidores
            </h1>
            <p className="text-slate-400 text-base">
              Selecione uma comunidade ativa abaixo para configurar o bot.
            </p>
          </div>
          {guilds.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 bg-slate-800 border border-slate-700/60 rounded-lg text-slate-400 self-start md:self-auto">
              {guilds.length} Servidores Disponíveis
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-center max-w-2xl mx-auto">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Servers Grid */}
        {guilds.length === 0 && !error ? (
          <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-xl">
            <div className="w-16 h-16 bg-slate-800/80 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <FaServer className="w-6 h-6 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum servidor elegível</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Você precisa possuir cargo de permissão administrativa para configurar o Peepe Bot em servidores externos.
            </p>
            <button className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300">
              Convidar Bot para um Servidor
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:bg-slate-900/80 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl relative overflow-hidden"
              >
                {/* Linha discreta de hover no topo do card */}
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-4 mb-6">
                  {/* Guild Icon */}
                  {getGuildIcon(guild) ? (
                    <img
                      src={getGuildIcon(guild)}
                      alt={guild.name}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-800/60 group-hover:ring-emerald-500/40 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700 text-slate-400 font-bold text-lg group-hover:border-emerald-500/30">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  
                  {/* Guild Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-100 mb-1.5 truncate group-hover:text-white transition-colors">
                      {guild.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {guild.owner ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          <FaCrown className="w-2.5 h-2.5" /> Dono
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <FaShieldAlt className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => window.location.href = `/server/${guild.id}`}
                  className="w-full bg-slate-800 hover:bg-emerald-600 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 border border-slate-700/60 hover:border-transparent"
                >
                  <span>Gerenciar Painel</span>
                  <FaArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}