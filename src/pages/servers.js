// pages/servers.js
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { FaServer, FaUsers, FaCrown, FaShieldAlt, FaArrowRight, FaDiscord } from "react-icons/fa";

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
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-300">Carregando servidores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
            <FaDiscord className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-300 mb-4">Faça login para continuar</h2>
            <p className="text-green-400 mb-6">
              Você precisa estar logado com Discord para ver seus servidores.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-full font-semibold text-white hover:shadow-lg transition-all duration-300"
            >
              Entrar com Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
      <Head>
        <title>Meus Servidores - Peepe Bot</title>
        <meta name="description" content="Gerencie os servidores onde o Peepe Bot está presente" />
      </Head>

      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Meus Servidores
          </h1>
          <p className="text-green-300 text-lg max-w-2xl mx-auto">
            Selecione um servidor para gerenciar as configurações do Peepe Bot
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Servers Grid */}
        {guilds.length === 0 && !error ? (
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <FaServer className="w-20 h-20 text-green-500/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-300 mb-2">Nenhum servidor encontrado</h2>
            <p className="text-green-400 mb-6">
              O Peepe Bot não está em nenhum servidor onde você seja administrador.
            </p>
            <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full font-semibold transition-all duration-300">
              Convidar Bot para um Servidor
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className="group bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 hover:transform hover:-translate-y-2 border border-green-500/20 hover:border-green-500/50"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* Guild Icon */}
                  {getGuildIcon(guild) ? (
                    <img
                      src={getGuildIcon(guild)}
                      alt={guild.name}
                      className="w-16 h-16 rounded-full border-2 border-green-400"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-2 border-green-400">
                      <FaServer className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  {/* Guild Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-300 mb-1">{guild.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      {guild.owner && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <FaCrown className="w-3 h-3" />
                          <span>Dono</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-green-400">
                        <FaShieldAlt className="w-3 h-3" />
                        <span>Admin</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = `/server/${guild.id}`}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>Gerenciar</span>
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite Info */}
        {guilds.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-green-400 text-sm">
              Mostrando {guilds.length} servidor(es) onde você é administrador e o Peepe Bot está presente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}