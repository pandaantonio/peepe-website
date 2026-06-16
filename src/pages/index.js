// pages/index.js
import Head from "next/head";
import Navbar from "../components/Navbar";
import { FaDiscord } from "react-icons/fa";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: "🎮",
    title: "Jogos Interativos",
    desc: "Trivia, RPG, apostas e muito mais para entreter sua comunidade.",
    gradient: "from-violet-500/10 to-purple-600/5",
    border: "border-violet-500/20",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: "🛡️",
    title: "Moderação",
    desc: "Controle total do seu servidor com logs, auto-mod e punições.",
    gradient: "from-emerald-500/10 to-teal-600/5",
    border: "border-emerald-500/20",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    icon: "⚙️",
    title: "Utilidades",
    desc: "Lembretes, enquetes, tradução e ferramentas inteligentes.",
    gradient: "from-sky-500/10 to-blue-600/5",
    border: "border-sky-500/20",
    glow: "rgba(14,165,233,0.15)",
  },
];

const stats = [
  { value: "50+", label: "Comandos" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 50ms", label: "Latência" },
];

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${d.opacity})`;
        ctx.fill();
      });

      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="min-h-screen text-zinc-100 font-sans relative overflow-hidden"
      style={{ background: "#05060F" }}
    >
      <Head>
        <title>Peepe Bot — Discord Bot</title>
        <meta name="description" content="Bot completo para Discord com jogos, utilidades e moderação." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Animated particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.7 }}
      />

      {/* Radial glow top */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "900px",
          background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)",
        }}
      />

      <Navbar />

      {/* ── HERO ─────────────────────────────── */}
      <section className="relative pt-44 pb-28 px-6 max-w-5xl mx-auto text-center">

        {/* Pill badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            color: "#10b981",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Discord Bot
        </div>

        {/* Headline */}
        <h1
          className="text-7xl md:text-[96px] font-extrabold tracking-tighter leading-none mb-6"
          style={{
            background: "linear-gradient(160deg, #ffffff 30%, rgba(255,255,255,0.45) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Peepe Bot
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed mb-3">
          Jogos envolventes, utilidades inteligentes e moderação eficiente.
        </p>
        <p className="text-base text-zinc-600 mb-12">
          Tudo que seu servidor precisa, em um único bot.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <a
            href="https://discord.com/oauth2/authorize?client_id=1400971977795047516&permissions=1099780073494&integration_type=0&scope=bot"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold text-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
              boxShadow: "0 0 40px rgba(16,185,129,0.35), 0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <FaDiscord className="w-5 h-5" />
            Adicionar ao Discord
          </a>

          <a
            href="https://discord.gg/c2PbjMcGUn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Servidor de Suporte
          </a>
        </div>

        {/* Stats row */}
        <div
          className="inline-flex gap-0 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="px-8 py-4 text-center"
              style={{
                borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div
                className="text-2xl font-bold mb-0.5"
                style={{
                  background: "linear-gradient(90deg, #34d399, #10b981)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.value}
              </div>
              <div className="text-xs text-zinc-500 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section className="relative pb-32 px-6 max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "#10b981" }}
          >
            Recursos
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Tudo no mesmo lugar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`relative group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${f.gradient} ${f.border} border`}
              style={{
                background: `radial-gradient(circle at top left, ${f.glow} 0%, rgba(255,255,255,0.02) 60%)`,
              }}
            >
              {/* Subtle inner border */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              />
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────── */}
      <section className="relative pb-24 px-6 max-w-2xl mx-auto text-center">
        <div
          className="rounded-3xl p-10"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 0 30px rgba(16,185,129,0.35)",
            }}
          >
            <FaDiscord className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Pronto para começar?
          </h2>
          <p className="text-zinc-400 text-sm mb-7">
            Adicione o Peepe Bot ao seu servidor em segundos e transforme sua comunidade.
          </p>
          <a
            href="https://discord.com/oauth2/authorize?client_id=1400971977795047516&permissions=1099780073494&integration_type=0&scope=bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
              boxShadow: "0 0 30px rgba(16,185,129,0.3)",
            }}
          >
            <FaDiscord className="w-4 h-4" />
            Adicionar Gratuitamente
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative pb-10 text-center">
        <p className="text-xs text-zinc-700">
          © 2025 Peepe Bot · Feito com ♥ para a comunidade Discord
        </p>
      </footer>
    </div>
  );
}