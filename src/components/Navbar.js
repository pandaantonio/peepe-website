// components/Navbar.js
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaRobot, FaDiscord, FaServer } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-lg border-b border-green-500/30 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <FaRobot className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Peepe Bot
            </span>
            <span className="text-sm text-green-400 hidden sm:inline-block">🐸✨</span>
          </Link>

          {/* Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {status === "authenticated" && (
              <Link 
                href="/servers" 
                className={`flex items-center gap-2 transition-all duration-300 ${
                  isActive('/servers') 
                    ? 'text-green-400 font-semibold' 
                    : 'text-green-300 hover:text-green-200'
                }`}
              >
                <FaServer className="w-4 h-4" />
                <span>Meus Servidores</span>
              </Link>
            )}
          </div>

          {/* Botões - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-24 h-10 bg-gray-700 rounded-full animate-pulse"></div>
            ) : session ? (
              // Usuário logado
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-full px-4 py-2">
                  {/* Avatar */}
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "Avatar"} 
                      className="w-8 h-8 rounded-full border-2 border-green-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  
                  {/* Nome */}
                  <span className="text-green-200 font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                
                {/* Botão Logout */}
                <button
                  onClick={() => signOut()}
                  className="bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                >
                  Sair
                </button>
              </div>
            ) : (
              // Usuário não logado
              <button
                onClick={() => signIn("discord")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <FaDiscord className="w-5 h-5" />
                Entrar com Discord
              </button>
            )}
          </div>

          {/* Menu Mobile - Botão Hamburguer */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-green-400 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile - Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-green-500/30">
            {status === "loading" ? (
              <div className="w-full h-10 bg-gray-700 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="space-y-3">
                {/* Links Mobile */}
                <Link 
                  href="/servers" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${
                    isActive('/servers') 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-green-300 hover:bg-gray-800/50'
                  }`}
                >
                  <FaServer className="w-5 h-5" />
                  <span>Meus Servidores</span>
                </Link>

                {/* Perfil Mobile */}
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "Avatar"} 
                      className="w-10 h-10 rounded-full border-2 border-green-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-green-200 font-medium">{session.user?.name || session.user?.email}</p>
                    <p className="text-green-500 text-xs">Logado com Discord</p>
                  </div>
                </div>
                
                <button
                  onClick={() => signOut()}
                  className="w-full bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaDiscord className="w-5 h-5" />
                Entrar com Discord
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}