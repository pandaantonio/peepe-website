// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { FaRobot } from 'react-icons/fa';

export default function Home() {
  const [serverCount, setServerCount] = useState(0);

  useEffect(() => {
    setServerCount(1247);
  }, []);

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
            <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
              Adicionar ao Discord
            </button>
            <button className="bg-green-800 hover:bg-green-700 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300">
              Servidor Suporte
            </button>
          </div>
          
          <div className="mt-8 inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-green-300">
              Bot Online • {serverCount}+ servidores
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}