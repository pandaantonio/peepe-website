// pages/index.js
import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans relative overflow-hidden">
      <Head>
        <title>Peepe Bot - Jogos, Utilidades e Moderação no Discord</title>
        <meta name="description" content="Bot completo para Discord com jogos, utilidades e moderação. Tudo que seu servidor precisa!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Efeitos de Luz de Fundo (Glow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar com autenticação */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge Moderna */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in shadow-inner">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            🐸 Peepe Bot está online e pronto
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white via-slate-100 to-emerald-500 bg-clip-text text-transparent">
            Peepe Bot
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Aumente o engajamento do seu servidor com <span className="text-emerald-400 font-medium">jogos interativos</span>, ferramentas inteligentes de <span className="text-emerald-400 font-medium">utilidades</span> e uma <span className="text-emerald-400 font-medium">moderação</span> impecável. 🎮⚙️🛡️
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1400971977795047516&permissions=1099780073494&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-8 py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] text-white text-center hover:-translate-y-0.5"
            >
              Adicionar ao Discord
            </a>
            <a 
              href="https://discord.gg/c2PbjMcGUn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/50 hover:border-slate-600 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 text-slate-200 text-center backdrop-blur-md"
            >
              Servidor de Suporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}