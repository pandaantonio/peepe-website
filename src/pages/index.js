// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FaRobot, FaGamepad, FaTools, FaShieldAlt, FaDiscord, FaCode, FaHeart } from 'react-icons/fa';

export default function Home() {
  const [botStatus, setBotStatus] = useState('online');
  const [serverCount, setServerCount] = useState(0);

  useEffect(() => {
    // Simulando dados do bot (substitua pela sua API real)
    setServerCount(1247);
    
    // Exemplo de como buscar dados reais da sua API
    // fetch('/api/bot-status')
    //   .then(res => res.json())
    //   .then(data => {
    //     setServerCount(data.servers);
    //     setBotStatus(data.status);
    //   });
  }, []);

  const features = [
    {
      icon: <FaGamepad className="w-8 h-8" />,
      title: "Jogos",
      description: "Minijogos divertidos para você e seus amigos competirem!",
      color: "from-green-500 to-emerald-600",
      examples: ["🎮 Roleta", "🎲 Dados", "⚔️ Batalha", "🏆 Ranking"]
    },
    {
      icon: <FaTools className="w-8 h-8" />,
      title: "Utilidades",
      description: "Ferramentas úteis para facilitar sua experiência no Discord.",
      color: "from-blue-500 to-cyan-600",
      examples: ["📊 Pesquisa", "💬 Tradução", "⏰ Reminders", "📝 Enquetes"]
    },
    {
      icon: <FaShieldAlt className="w-8 h-8" />,
      title: "Moderação",
      description: "Mantenha seu servidor seguro e organizado.",
      color: "from-red-500 to-rose-600",
      examples: ["🔨 Ban/Kick", "⚠️ Avisos", "📋 Logs", "🎯 Auto-mod"]
    }
  ];

  const commands = [
    { name: "/play", description: "Inicie um jogo interativo" },
    { name: "/rank", description: "Veja o ranking do servidor" },
    { name: "/traduzir", description: "Traduza mensagens automaticamente" },
    { name: "/aviso", description: "Dê avisos aos membros" },
    { name: "/limpar", description: "Limpe mensagens do chat" },
    { name: "/ajuda", description: "Lista todos os comandos" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-indigo-900">
      <Head>
        <title>Peepe Bot - Jogos, Utilidades e Moderação no Discord</title>
        <meta name="description" content="Bot completo para Discord com jogos, utilidades e moderação. Tudo que seu servidor precisa!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header/Navbar */}
      <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaRobot className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Peepe Bot
              </span>
              <span className="text-sm text-gray-400">🐸✨</span>
            </div>
            <div className="hidden md:flex gap-6">
              <a href="#features" className="text-gray-300 hover:text-white transition">Recursos</a>
              <a href="#commands" className="text-gray-300 hover:text-white transition">Comandos</a>
              <a href="#stats" className="text-gray-300 hover:text-white transition">Estatísticas</a>
            </div>
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              Convidar Bot
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block animate-bounce mb-6 text-6xl">
            🐸✨
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Peepe Bot
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Jogos, utilidades e moderação, tudo dentro do Discord. 
            O bot completo que seu servidor precisa! 🎮⚙️🛡️
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
              Adicionar ao Discord
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300">
              Servidor Suporte
            </button>
          </div>
          
          {/* Status Badge */}
          <div className="mt-8 inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <div className={`w-2 h-2 rounded-full ${botStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">
              {botStatus === 'online' ? 'Bot Online' : 'Manutenção'} • {serverCount}+ servidores
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Recursos Incríveis</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar e divertir seu servidor Discord
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-800/70 transition-all duration-300 transform hover:-translate-y-2">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className={`text-4xl mb-4 text-transparent bg-gradient-to-r ${feature.color} bg-clip-text`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {feature.examples.map((example, idx) => (
                    <span key={idx} className="text-xs bg-gray-700/50 px-3 py-1 rounded-full text-gray-300">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commands Section */}
      <section id="commands" className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Comandos Populares</h2>
          <p className="text-gray-400 text-center mb-12">Simplificando sua experiência no Discord</p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {commands.map((cmd, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between hover:bg-gray-800/50 transition">
                <code className="text-green-400 font-mono font-bold">{cmd.name}</code>
                <span className="text-gray-400">{cmd.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-400">1247+</div>
              <div className="text-gray-400">Servidores</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">50+</div>
              <div className="text-gray-400">Comandos</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-400">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-emerald-400">24/7</div>
              <div className="text-gray-400">Suporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para melhorar seu servidor?
            </h2>
            <p className="text-lg mb-8 text-indigo-100">
              Adicione o Peepe Bot agora e comece a usar todas as funcionalidades!
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Convidar Peepe Bot 🐸
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaCode className="inline" />
            <span>Desenvolvido com</span>
            <FaHeart className="text-red-500" />
            <span>para a comunidade Discord</span>
          </div>
          <p>© 2024 Peepe Bot. Todos os direitos reservados. 🐸✨</p>
        </div>
      </footer>
    </div>
  );
}