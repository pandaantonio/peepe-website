// pages/servers.js
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { FaServer, FaArrowRight, FaDiscord, FaRedo } from "react-icons/fa";

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
      setError(null);
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
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
    }
    return null;
  };

  /* ── LOADING ─────────────────────────────── */
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen text-zinc-100" style={{ background: "#05060F" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-5 animate-spin"
              style={{
                border: "2px solid rgba(255,255,255,0.06)",
                borderTopColor: "#10b981",
              }}
            />
            <p className="text-sm text-zinc-500">Carregando seus servidores…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── UNAUTHENTICATED ─────────────────────── */
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col text-zinc-100" style={{ background: "#05060F" }}>
        <Navbar />

        {/* radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "30%", left: "50%", transform: "translate(-50%,-50%)",
            width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(88,101,242,0.08) 0%, transparent 65%)",
          }}
        />

        <div className="flex-1 flex items-center justify-center px-6">
          <div
            className="relative max-w-sm w-full rounded-3xl p-10 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(135deg,#5865F2,#4752C4)",
                boxShadow: "0 0 30px rgba(88,101,242,0.35)",
              }}
            >
              <FaDiscord className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Acesso restrito</h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Conecte sua conta do Discord para ver e gerenciar seus servidores.
            </p>

            <button
              onClick={() => signIn("discord")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#5865F2,#4752C4)",
                boxShadow: "0 0 20px rgba(88,101,242,0.3)",
              }}
            >
              <FaDiscord />
              Entrar com Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN ────────────────────────────────── */
  return (
    <div className="min-h-screen text-zinc-100 relative overflow-hidden" style={{ background: "#05060F" }}>
      <Head>
        <title>Meus Servidores — Peepe Bot</title>
      </Head>

      {/* top glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-160px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)",
        }}
      />

      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-36 pb-24">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p
              className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
              style={{ color: "#10b981" }}
            >
              Dashboard
            </p>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tighter"
              style={{
                background: "linear-gradient(160deg,#fff 30%,rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Meus Servidores
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Gerencie onde o Peepe Bot está ativo
            </p>
          </div>

          {guilds.length > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <FaServer className="text-zinc-600 w-3 h-3" />
              {guilds.length} servidor{guilds.length !== 1 ? "es" : ""}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "40px" }} />

        {/* ── Error ── */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl mb-8"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span className="text-red-400 mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={fetchUserGuilds}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <FaRedo className="w-3 h-3" /> Tentar novamente
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {guilds.length === 0 && !error ? (
          <div className="text-center py-28">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <FaServer className="w-7 h-7 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum servidor encontrado</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Você precisa ter permissão de administrador para gerenciar o bot em um servidor.
            </p>
          </div>
        ) : (
          /* ── Guild Grid ── */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guilds.map((guild) => {
              const icon = getGuildIcon(guild);
              const initials = guild.name.slice(0, 2).toUpperCase();

              return (
                <div
                  key={guild.id}
                  className="group relative rounded-3xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.06)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Server icon + name */}
                  <div className="flex items-center gap-4 mb-5">
                    {icon ? (
                      <img
                        src={icon}
                        alt={guild.name}
                        className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-white leading-snug line-clamp-2 text-base">
                        {guild.name}
                      </h3>
                      <div className="mt-1.5">
                        {guild.owner ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(251,191,36,0.1)",
                              border: "1px solid rgba(251,191,36,0.2)",
                              color: "#fbbf24",
                            }}
                          >
                            👑 Dono
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.2)",
                              color: "#10b981",
                            }}
                          >
                            🛡️ Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Manage button */}
                  <button
                    onClick={() => window.location.href = `/server/${guild.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 mt-4 group/btn"
                    style={{
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.18)",
                      color: "#10b981",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "linear-gradient(135deg,#34d399,#059669)";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.color = "#052e16";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.3)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(16,185,129,0.08)";
                      e.currentTarget.style.borderColor = "rgba(16,185,129,0.18)";
                      e.currentTarget.style.color = "#10b981";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    Gerenciar
                    <FaArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}