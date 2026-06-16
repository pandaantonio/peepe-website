// components/Navbar.js
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaRobot, FaDiscord } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 w-full z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(5, 6, 15, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 0 20px rgba(16,185,129,0.4)",
              }}
            >
              <FaRobot className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ffffff 0%, #a1a1aa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Peepe Bot
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {status === "authenticated" && (
              <Link
                href="/servers"
                className="text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive("/servers")
                    ? "#10b981"
                    : "rgba(255,255,255,0.55)",
                }}
              >
                Meus Servidores
              </Link>
            )}
          </div>

          {/* Auth Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-9 w-36 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-emerald-500/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <span className="text-sm text-zinc-200 font-medium">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(88,101,242,0.35)",
                }}
              >
                <FaDiscord className="w-4 h-4" />
                Entrar com Discord
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
          >
            <span className="text-base">{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="md:hidden mt-4 p-4 rounded-2xl space-y-3"
            style={{
              background: "rgba(10,11,20,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {status === "authenticated" && (
              <Link
                href="/servers"
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm text-zinc-300 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                Meus Servidores
              </Link>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="w-full py-2.5 text-sm text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                Sair
              </button>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
                  color: "#fff",
                }}
              >
                <FaDiscord />
                Entrar com Discord
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}