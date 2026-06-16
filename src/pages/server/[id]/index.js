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
  FaLink,
  FaUserShield,
  FaRobot,
  FaChevronRight,
} from 'react-icons/fa';

const MODULE_COLORS = {
  emerald: {
    icon: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" },
    tag:  { background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981" },
    btn:  { background: "linear-gradient(135deg,#34d399,#059669)", color: "#052e16", shadow: "0 0 14px rgba(16,185,129,0.3)" },
    glow: "rgba(16,185,129,0.06)",
  },
  purple: {
    icon: { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" },
    tag:  { background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", color: "#a78bfa" },
    btn:  { background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", shadow: "0 0 14px rgba(139,92,246,0.3)" },
    glow: "rgba(139,92,246,0.06)",
  },
  red: {
    icon: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" },
    tag:  { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" },
    btn:  { background: "linear-gradient(135deg,#f87171,#dc2626)", color: "#fff", shadow: "0 0 14px rgba(239,68,68,0.3)" },
    glow: "rgba(239,68,68,0.06)",
  },
  blue: {
    icon: { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" },
    tag:  { background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)", color: "#60a5fa" },
    btn:  { background: "linear-gradient(135deg,#60a5fa,#2563eb)", color: "#fff", shadow: "0 0 14px rgba(59,130,246,0.3)" },
    glow: "rgba(59,130,246,0.06)",
  },
};

function StateScreen({ children }) {
  return (
    <div className="min-h-screen text-zinc-100" style={{ background: "#05060F" }}>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-6">
        {children}
      </div>
    </div>
  );
}

function CenteredCard({ children }) {
  return (
    <div
      className="max-w-sm w-full rounded-3xl p-10 text-center"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {children}
    </div>
  );
}

export default function GuildDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || status === "loading") return;
    if (status === "unauthenticated") { router.push("/servers"); return; }

    async function fetchGuildInfo() {
      try {
        const response = await fetch(`/api/user-guilds`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || `Erro ${response.status}`);
        const found = data.guilds?.find(g => g.id === id);
        if (!found) { setError('Servidor não encontrado ou sem permissão.'); setLoading(false); return; }
        setGuild(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.accessToken) fetchGuildInfo();
  }, [id, session, status, router]);

  const getIconUrl = () =>
    guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null;

  /* ── LOADING ── */
  if (status === "loading" || loading) {
    return (
      <StateScreen>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-5 animate-spin"
            style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#10b981" }} />
          <p className="text-sm text-zinc-500">Carregando painel do servidor…</p>
        </div>
      </StateScreen>
    );
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <StateScreen>
        <CenteredCard>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <svg className="w-7 h-7" style={{ color: "#f87171" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">{error}</p>
          <button onClick={() => router.push('/servers')}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-zinc-200 transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Voltar aos Servidores
          </button>
        </CenteredCard>
      </StateScreen>
    );
  }

  /* ── NO GUILD ── */
  if (!guild) {
    return (
      <StateScreen>
        <CenteredCard>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <FaDiscord className="w-7 h-7" style={{ color: "#fbbf24" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Servidor não localizado</h2>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
            O bot pode ter sido removido ou você perdeu os privilégios de administrador.
          </p>
          <button onClick={() => router.push('/servers')}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-zinc-200 transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Voltar aos Servidores
          </button>
        </CenteredCard>
      </StateScreen>
    );
  }

  /* ── MAIN ── */
  const iconUrl = getIconUrl();
  const initials = guild.name.slice(0, 2).toUpperCase();

  const configCards = [
    {
      id: 'autorole', title: 'Auto Role', color: 'emerald',
      icon: <FaUserPlus size={18} />,
      desc: 'Configure cargos automáticos para novos membros assim que entrarem no servidor.',
      path: `/server/${guild.id}/autorole`,
    },
    {
      id: 'antilink', title: 'Anti-Link', color: 'purple',
      icon: <FaLink size={16} />,
      desc: 'Bloqueie links maliciosos ou não autorizados enviados nos canais de texto públicos.',
      path: `/server/${guild.id}/antilink`,
    },
    {
      id: 'antiinvite', title: 'Anti-Invite', color: 'red',
      icon: <FaUserShield size={18} />,
      desc: 'Evite a evasão de membros bloqueando convites de outros servidores do Discord.',
      path: `/server/${guild.id}/antiinvite`,
    },
    {
      id: 'welcome', title: 'Boas-Vindas', color: 'blue',
      icon: <FaRobot size={18} />,
      desc: 'Configure mensagens automáticas de boas-vindas para novos membros via webhooks.',
      path: `/server/${guild.id}/welcome`,
    },
  ];

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-hidden" style={{ background: "#05060F" }}>
      <Navbar />

      {/* top glow */}
      <div className="absolute pointer-events-none"
        style={{
          top: "-160px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 pt-36 pb-24">

        {/* ── Back button ── */}
        <button
          onClick={() => router.push('/servers')}
          className="group inline-flex items-center gap-2 mb-10 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
        >
          <FaArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar aos Servidores
        </button>

        {/* ── Server banner ── */}
        <div
          className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-3xl p-7 mb-12 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Left accent line */}
          <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
            style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }} />

          {/* Server icon */}
          {iconUrl ? (
            <img src={iconUrl} alt={guild.name}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1
              className="text-2xl font-extrabold tracking-tight mb-3"
              style={{
                background: "linear-gradient(160deg,#fff 40%,rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >
              {guild.name}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-xs px-2.5 py-1 rounded-lg font-mono"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}>
                {guild.id}
              </span>
              {guild.owner && (
                <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
                  👑 Proprietário
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                ● Online
              </span>
            </div>
          </div>
        </div>

        {/* ── Modules section ── */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "#10b981" }}>
              Módulos
            </p>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {configCards.map((card) => {
              const c = MODULE_COLORS[card.color];
              return (
                <Link key={card.id} href={card.path}>
                  <div
                    className="group relative flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = `rgba(255,255,255,0.12)`;
                      e.currentTarget.style.boxShadow = `0 0 40px ${c.glow}`;
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={c.icon}>
                        {card.icon}
                      </div>

                    </div>

                    {/* Content */}
                    <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed flex-1">{card.desc}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-5 pt-4"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                        Abrir painel
                      </span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={c.btn}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = c.btn.shadow}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                      >
                        <FaChevronRight size={10} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
            SINCRONIZADO COM A API DO DISCORD
          </p>
        </div>
      </div>
    </div>
  );
}