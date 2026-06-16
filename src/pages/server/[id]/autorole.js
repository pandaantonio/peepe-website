// pages/server/[id]/autorole.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import {
  FaArrowLeft,
  FaDiscord,
  FaUserPlus,
  FaRobot,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaPlus,
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

/* ── role tag ── */
function RoleTag({ role, onRemove }) {
  const hex = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#10b981';
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
        <span className="text-sm text-zinc-200 font-medium truncate">{role.name}</span>
      </div>
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

/* ── custom dropdown ── */
function RoleSelect({ options, value, onChange, accentColor }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  const accent = accentColor === 'emerald' ? '#10b981' : '#a78bfa';

  return (
    <div className="relative flex-1" style={{ userSelect: 'none' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? accent + '55' : 'rgba(255,255,255,0.09)'}`,
          color: selected ? "#e4e4e7" : "rgba(255,255,255,0.3)",
        }}
      >
        <span className="truncate">{selected ? selected.name : 'Selecione um cargo…'}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, marginLeft: 6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', opacity: 0.4 }}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            background: "#0e0f1a",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-3 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Nenhum cargo disponível
            </div>
          ) : options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors"
              style={{ color: "#d4d4d8" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: opt.color ? `#${opt.color.toString(16).padStart(6,'0')}` : accent }} />
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── panel ── */
function RolePanel({ icon, title, subtitle, accentColor, roles, selected, onSelect, onAdd, onRemove, availableRoles }) {
  const colors = {
    emerald: {
      icon: { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" },
      add:  { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" },
      addHover: { background: "rgba(16,185,129,0.18)" },
      focus: "rgba(16,185,129,0.3)",
    },
    purple: {
      icon: { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" },
      add:  { background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" },
      addHover: { background: "rgba(139,92,246,0.18)" },
      focus: "rgba(139,92,246,0.3)",
    },
  };
  const c = colors[accentColor];

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* header */}
      <div className="flex items-center gap-3.5 p-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={c.icon}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{subtitle}</p>
        </div>
      </div>

      {/* role list */}
      <div className="flex-1 p-5">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          Cargos definidos ({roles.length})
        </p>

        {roles.length === 0 ? (
          <div className="flex items-center justify-center py-8 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              Nenhum cargo adicionado ainda
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
            {roles.map(role => (
              <RoleTag key={role.id} role={role} onRemove={() => onRemove(role.id)} />
            ))}
          </div>
        )}
      </div>

      {/* add row */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2.5"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          Vincular cargo
        </p>
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={e => onSelect(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: selected ? "#e4e4e7" : "rgba(255,255,255,0.3)",
            }}
          >
            <option value="">Selecione um cargo…</option>
            {roles.filter ? null : null}
          </select>
          <button
            onClick={onAdd}
            disabled={!selected}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={c.add}
            onMouseEnter={e => { if (selected) e.currentTarget.style.background = c.addHover.background; }}
            onMouseLeave={e => { e.currentTarget.style.background = c.add.background; }}
          >
            <FaPlus size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function AutorolePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [autorole, setAutorole] = useState({ users: [], apps: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const [selectedAppRole, setSelectedAppRole] = useState('');

  useEffect(() => {
    if (!guildId || status === "loading") return;
    if (status === "unauthenticated") { router.push("/servers"); return; }

    async function fetchData() {
      try {
        setLoading(true);
        const guildsRes = await fetch(`/api/user-guilds`);
        const guildsData = await guildsRes.json();
        if (!guildsRes.ok || !guildsData.success) throw new Error(guildsData.error || 'Erro ao buscar servidor');
        const found = guildsData.guilds?.find(g => g.id === guildId);
        if (!found) throw new Error('Servidor não encontrado');
        setGuild(found);

        const rolesRes = await fetch(`/api/guild-roles?guildId=${guildId}`);
        if (!rolesRes.ok) { const e = await rolesRes.json(); throw new Error(e.error || 'Erro ao buscar cargos'); }
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);

        const arRes = await fetch(`/api/guild/${guildId}/autorole`);
        if (arRes.ok) {
          const arData = await arRes.json();
          setAutorole({ users: arData.users || [], apps: arData.apps || [] });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (session?.accessToken) fetchData();
  }, [guildId, session, status, router]);

  const availableForUsers = roles.filter(r => !autorole.users.some(u => u.id === r.id));
  const availableForApps  = roles.filter(r => !autorole.apps.some(a => a.id === r.id));

  const addUserRole = () => {
    const role = roles.find(r => r.id === selectedUserRole);
    if (!role || autorole.users.some(r => r.id === role.id)) return;
    setAutorole(p => ({ ...p, users: [...p.users, { id: role.id, name: role.name, color: role.color }] }));
    setSelectedUserRole('');
  };

  const addAppRole = () => {
    const role = roles.find(r => r.id === selectedAppRole);
    if (!role || autorole.apps.some(r => r.id === role.id)) return;
    setAutorole(p => ({ ...p, apps: [...p.apps, { id: role.id, name: role.name, color: role.color }] }));
    setSelectedAppRole('');
  };

  const removeUserRole = id => setAutorole(p => ({ ...p, users: p.users.filter(r => r.id !== id) }));
  const removeAppRole  = id => setAutorole(p => ({ ...p, apps:  p.apps.filter(r => r.id !== id) }));

  const handleSave = async () => {
    try {
      setSaving(true); setError(null); setSuccess(null);
      const res = await fetch(`/api/guild/${guildId}/autorole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: autorole.users, apps: autorole.apps }),
      });
      if (!res.ok) throw new Error('Erro ao salvar configuração');
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const iconUrl = guild?.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
    : null;

  /* ── LOADING ── */
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

  /* ── ERROR (fatal) ── */
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

  /* ── MAIN ── */
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

      <div className="relative max-w-4xl mx-auto px-6 pt-36 pb-24">

        {/* back */}
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
            style={{ background: "linear-gradient(to bottom,#34d399,#059669)" }} />

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
            <h1 className="text-lg font-extrabold text-white tracking-tight">Auto Role</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Automação de cargos para <span className="text-zinc-300">{guild?.name}</span>
            </p>
          </div>
        </div>

        {/* feedback toasts */}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <FaCheckCircle size={14} style={{ color: "#10b981", flexShrink: 0 }} />
            <span className="text-sm" style={{ color: "#10b981" }}>{success}</span>
          </div>
        )}
        {error && guild && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <FaExclamationTriangle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
            <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
          </div>
        )}

        {/* section label */}
        <div className="flex items-center gap-3 mb-6">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap" style={{ color: "#10b981" }}>
            Configuração
          </p>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
        </div>

        {/* panels grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

          {/* Users panel */}
          <div className="flex flex-col rounded-3xl"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3.5 p-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                <FaUserPlus size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Novos Membros</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Cargos entregues a usuários reais ao entrar
                </p>
              </div>
            </div>

            <div className="flex-1 p-5">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3"
                style={{ color: "rgba(255,255,255,0.28)" }}>
                Cargos definidos ({autorole.users.length})
              </p>
              {autorole.users.length === 0 ? (
                <div className="flex items-center justify-center py-8 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum cargo adicionado ainda</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {autorole.users.map(role => (
                    <RoleTag key={role.id} role={role} onRemove={() => removeUserRole(role.id)} />
                  ))}
                </div>
              )}
            </div>

            <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2.5"
                style={{ color: "rgba(255,255,255,0.22)" }}>Vincular cargo</p>
              <div className="flex gap-2">
                <RoleSelect
                  options={availableForUsers}
                  value={selectedUserRole}
                  onChange={setSelectedUserRole}
                  accentColor="emerald"
                />
                <button onClick={addUserRole} disabled={!selectedUserRole}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
                  onMouseEnter={e => { if (selectedUserRole) e.currentTarget.style.background = "rgba(16,185,129,0.18)"; }}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}
                >
                  <FaPlus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Apps panel */}
          <div className="flex flex-col rounded-3xl"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3.5 p-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                <FaRobot size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Aplicações & Bots</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Cargos entregues a sistemas e integrações
                </p>
              </div>
            </div>

            <div className="flex-1 p-5">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3"
                style={{ color: "rgba(255,255,255,0.28)" }}>
                Cargos definidos ({autorole.apps.length})
              </p>
              {autorole.apps.length === 0 ? (
                <div className="flex items-center justify-center py-8 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum cargo adicionado ainda</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {autorole.apps.map(role => (
                    <RoleTag key={role.id} role={role} onRemove={() => removeAppRole(role.id)} />
                  ))}
                </div>
              )}
            </div>

            <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2.5"
                style={{ color: "rgba(255,255,255,0.22)" }}>Vincular cargo</p>
              <div className="flex gap-2">
                <RoleSelect
                  options={availableForApps}
                  value={selectedAppRole}
                  onChange={setSelectedAppRole}
                  accentColor="purple"
                />
                <button onClick={addAppRole} disabled={!selectedAppRole}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}
                  onMouseEnter={e => { if (selectedAppRole) e.currentTarget.style.background = "rgba(139,92,246,0.18)"; }}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(139,92,246,0.08)"}
                >
                  <FaPlus size={11} />
                </button>
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
              background: "linear-gradient(135deg,#34d399,#059669)",
              color: "#052e16",
              boxShadow: "0 0 20px rgba(16,185,129,0.3)",
            }}
          >
            {saving ? <FaSpinner size={13} className="animate-spin" /> : <FaSave size={13} />}
            {saving ? "Salvando…" : "Salvar Alterações"}
          </button>
        </div>

        {/* footer note */}
        <p className="text-center text-xs mt-10" style={{ color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em" }}>
          O cargo do Peepe Bot deve estar acima dos cargos selecionados na hierarquia do Discord.
        </p>
      </div>
    </div>
  );
}