// pages/server/[id]/antilink.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, 
  FaDiscord,
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

/* ── helpers ── */
function StateScreen({ children }) {
  return (
    <div className="min-h-screen text-zinc-100" style={{ background: "#05060F" }}>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-6">{children}</div>
    </div>
  );
}

function CenteredCard({ children }) {
  return (
    <div className="max-w-sm w-full rounded-3xl p-10 text-center"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

/* ── domain tag ── */
function DomainTag({ domain, onRemove }) {
  return (
    <div className="inline-flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <span className="text-sm text-zinc-200 font-medium font-mono truncate">{domain}</span>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg transition-all ml-2 flex-shrink-0"
        style={{ color: "rgba(255,255,255,0.25)", background: "transparent" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
      >
        <FaTrash size={10} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function AntiLinkPage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  const [guild, setGuild] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [allowMedia, setAllowMedia] = useState(false);
  const [allowSocials, setAllowSocials] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Sugestões de domínios comuns
  const domainSuggestions = [
    "cdn.discordapp.com",
    "media.discordapp.net",
    "media.tenor.com",
    "tenor.com",
    "giphy.com",
    "youtube.com",
    "youtu.be",
    "instagram.com",
    "tiktok.com",
    "twitter.com",
    "x.com",
    "facebook.com",
  ];

  useEffect(() => {
    if (!guildId || status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/servers");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const guildsResponse = await fetch(`/api/user-guilds`);
        const guildsData = await guildsResponse.json();
        
        if (!guildsResponse.ok || !guildsData.success) {
          throw new Error(guildsData.error || 'Erro ao buscar servidor');
        }
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado');
        setGuild(foundGuild);

        const response = await fetch(`/api/guild/${guildId}/antilink`);
        if (!response.ok) throw new Error('Erro ao carregar dados do Anti-Link.');
        
        const data = await response.json();
        setEnabled(data.enabled);
        setAllowMedia(data.allowMedia);
        setAllowSocials(data.allowSocials);
        setAllowedDomains(data.allowedDomains || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.accessToken) {
      fetchData();
    }
  }, [guildId, session, status, router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/guild/${guildId}/antilink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          allowMedia,
          allowSocials,
          allowedDomains
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar as configurações.');
      
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = (e) => {
    e?.preventDefault();
    let domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');

    if (allowedDomains.includes(domain)) {
      setNewDomain('');
      return;
    }

    setAllowedDomains([...allowedDomains, domain]);
    setNewDomain('');
  };

  const handleAddSuggestion = (domain) => {
    if (!allowedDomains.includes(domain)) {
      setAllowedDomains([...allowedDomains, domain]);
    }
  };

  const handleRemoveDomain = (domainToRemove) => {
    setAllowedDomains(allowedDomains.filter(domain => domain !== domainToRemove));
  };

  const iconUrl = guild?.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
    : null;

  if (status === "loading" || loading) {
    return (
      <StateScreen>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-5 animate-spin"
            style={{ border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#10b981" }} />
          <p className="text-sm text-zinc-500">Buscando definições…</p>
        </div>
      </StateScreen>
    );
  }

  if (error && !guild) {
    return (
      <StateScreen>
        <CenteredCard>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <FaExclamationTriangle className="w-6 h-6" style={{ color: "#f87171" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">{error}</p>
          <button onClick={() => router.push(`/server/${guildId}`)}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-zinc-200 transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Voltar ao Dashboard
          </button>
        </CenteredCard>
      </StateScreen>
    );
  }

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-hidden" style={{ background: "#05060F" }}>
      <Navbar />

      {/* top glow */}
      <div className="absolute pointer-events-none"
        style={{
          top: "-160px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 65%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 pt-36 pb-24">

        {/* back button */}
        <button onClick={() => router.push(`/server/${guildId}`)}
          className="group inline-flex items-center gap-2 mb-10 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.32)" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.32)"}
        >
          <FaArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao Dashboard
        </button>

        {/* server mini banner */}
        <div className="relative flex items-center gap-4 rounded-3xl p-5 mb-10 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
            style={{ background: "linear-gradient(to bottom,#a855f7,#7c3aed)" }} />

          {iconUrl ? (
            <img src={iconUrl} alt={guild.name}
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.09)" }} />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
              <FaDiscord size={20} />
            </div>
          )}

          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Anti-Link</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Proteção contra links em <span className="text-zinc-300">{guild?.name}</span>
            </p>
          </div>
        </div>

        {/* feedback */}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <FaCheckCircle size={14} style={{ color: "#10b981" }} />
            <span className="text-sm" style={{ color: "#10b981" }}>{success}</span>
          </div>
        )}
        {error && guild && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <FaExclamationTriangle size={14} style={{ color: "#f87171" }} />
            <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap" style={{ color: "#a855f7" }}>
            CONFIGURAÇÃO
          </p>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
        </div>

        {/* Main Panel */}
        <div className="flex flex-col rounded-3xl overflow-hidden mb-8"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

          <div className="flex items-center gap-3.5 p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7" }}>
              <FaTrash size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Filtro Anti-Link</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Bloqueia links maliciosos e spam no servidor
              </p>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Toggle Principal */}
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-base font-semibold text-white">Ativar Proteção</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Remove automaticamente mensagens contendo links externos
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enabled} 
                  onChange={(e) => setEnabled(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 border border-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a855f7] peer-checked:border-[#a855f7]" />
              </label>
            </div>

            <div className={`space-y-6 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* Exceptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-white">Ignorar Mídias</div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-tight">Permite links de imagens, GIFs e vídeos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={allowMedia} 
                        disabled={!enabled}
                        onChange={(e) => setAllowMedia(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 border border-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a855f7]" />
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-white">Ignorar Redes Sociais</div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-tight">Permite links do Twitter, Instagram, TikTok, etc</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={allowSocials} 
                        disabled={!enabled}
                        onChange={(e) => setAllowSocials(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 border border-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a855f7]" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Whitelist Section */}
              <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="p-5">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-zinc-400">DOMÍNIOS PERMITIDOS</p>
                  
                  <form onSubmit={handleAddDomain} className="flex gap-2 mb-5">
                    <input 
                      type="text" 
                      value={newDomain}
                      disabled={!enabled}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="ex: github.com"
                      className="flex-1 px-4 py-3 bg-zinc-900/70 border border-zinc-700 rounded-2xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#a855f7]/50"
                    />
                    <button
                      type="submit"
                      disabled={!enabled || !newDomain.trim()}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
                      style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}
                    >
                      <FaPlus size={14} />
                    </button>
                  </form>

                  {/* Sugestões */}
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Sugestões recomendadas</p>
                    <div className="flex flex-wrap gap-2">
                      {domainSuggestions.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => handleAddSuggestion(domain)}
                          disabled={allowedDomains.includes(domain) || !enabled}
                          className="px-3 py-1.5 text-xs font-mono rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: allowedDomains.includes(domain) ? "rgba(16,185,129,0.1)" : "rgba(168,85,247,0.08)",
                            borderColor: allowedDomains.includes(domain) ? "#10b981" : "rgba(168,85,247,0.3)",
                            color: allowedDomains.includes(domain) ? "#10b981" : "#c4b5fd"
                          }}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista atual */}
                  <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2">
                    {allowedDomains.length === 0 ? (
                      <div className="py-8 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                        <p className="text-xs text-zinc-500">Nenhum domínio adicionado ainda</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allowedDomains.map((domain) => (
                          <DomainTag 
                            key={domain} 
                            domain={domain} 
                            onRemove={() => handleRemoveDomain(domain)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* action bar */}
        <div className="flex items-center justify-end gap-3 pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => router.push(`/server/${guildId}`)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg,#a855f7,#7c3aed)",
              color: "#1e1b4b",
              boxShadow: "0 0 20px rgba(168,85,247,0.3)",
            }}
          >
            {saving ? <FaSpinner size={13} className="animate-spin" /> : <FaSave size={13} />}
            {saving ? "Salvando…" : "Salvar Alterações"}
          </button>
        </div>

        <p className="text-center text-xs mt-10" style={{ color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em" }}>
          O bot precisa de permissão "Gerenciar Mensagens" para funcionar corretamente.
        </p>
      </div>
    </div>
  );
}