// components/Navbar.js
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaRobot, FaDiscord, FaServer } from "react-icons/fa";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-[#0B0F17]/70 backdrop-blur-md border-b border-slate-800/80 z-50 transition-all duration-300">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-emerald-500/30 transition-colors shadow-inner">
              <FaRobot className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Peepe Bot
              </span>
              <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase hidden sm:block">
                Dashboard Geral
              </span>
            </div>
          </Link>

          {/* Links de Navegação - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {status === "authenticated" && (
              <Link 
                href="/servers" 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                  isActive('/servers') 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <FaServer className="w-3.5 h-3.5" />
                <span>Meus Servidores</span>
              </Link>
            )}
          </div>

          {/* Área de Autenticação - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-28 h-10 bg-slate-800 rounded-xl animate-pulse border border-slate-700/30"></div>
            ) : session ? (
              // Usuário autenticado
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 shadow-sm">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "Avatar"} 
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs font-bold">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-200">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                
                <button
                  onClick={() => signOut()}
                  className="bg-slate-800 hover:bg-red-950/40 border border-slate-700/60 hover:border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition-all duration-200"
                >
                  Sair
                </button>
              </div>
            ) : (
              // Não autenticado
              <button
                onClick={() => signIn("discord")}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-200 shadow-md shadow-emerald-950/20 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <FaDiscord className="w-4 h-4" />
                Entrar com Discord
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 focus:outline-none hover:border-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Expandido - Mobile */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-fade-in">
            {status === "loading" ? (
              <div className="w-full h-12 bg-slate-800 rounded-xl animate-pulse"></div>
            ) : session ? (
              <div className="space-y-3">
                {/* Links */}
                <Link 
                  href="/servers" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/servers') 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  <FaServer className="w-4 h-4" />
                  <span>Meus Servidores</span>
                </Link>

                {/* Info do Usuário */}
                <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "Avatar"} 
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <span className="text-emerald-400 text-sm font-bold">
                        {session.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-200">{session.user?.name || session.user?.email}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Conta Conectada</p>
                  </div>
                </div>
                
                {/* Botão Sair Mobile */}
                <button
                  onClick={() => signOut()}
                  className="w-full bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 p-3 rounded-xl text-sm font-bold transition-all duration-200 text-center"
                >
                  Sair da Conta
                </button>
              </div>
            ) : (
              // Login Mobile
              <button
                onClick={() => signIn("discord")}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
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