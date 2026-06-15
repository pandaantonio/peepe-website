// pages/index.js
import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
      <Head>
        <title>Peepe Bot - Jogos, Utilidades e Moderação no Discord</title>
        <meta name="description" content="Bot completo para Discord com jogos, utilidades e moderação. Tudo que seu servidor precisa!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navbar com autenticação */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block animate-bounce mb-6 text-6xl">
            🐸✨
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
            Peepe Bot
          </h1>
          <p className="text-xl md:text-2xl text-green-200 mb-8 max-w-3xl mx-auto">
            Jogos, utilidades e moderação, tudo dentro do Discord. 
            O bot completo que seu servidor precisa! 🎮⚙️🛡️
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1400971977795047516&permissions=1099780073494&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 inline-block text-white"
            >
              Adicionar ao Discord
            </a>
            <a 
              href="https://discord.gg/c2PbjMcGUn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-800 hover:bg-green-700 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 inline-block text-white"
            >
              Servidor Suporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}