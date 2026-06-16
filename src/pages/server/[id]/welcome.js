// pages/server/[id]/welcome.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import {
  FaArrowLeft,
  FaDiscord,
  FaUsers,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaLink,
  FaPlus,
  FaTrash,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaGripLines,
  FaLayerGroup,
  FaBolt,
  FaSave,
  FaCog,
  FaExclamationTriangle,
} from 'react-icons/fa';
import {
  WELCOME_VARIABLES,
  MAX_CONTENT_LENGTH,
  MAX_EMBEDS,
  MAX_FIELDS_PER_EMBED,
  EMBED_LIMITS,
  MESSAGE_FLAGS,
  createDefaultWelcomeConfig,
  createEmptyEmbed,
  createEmptyEmbedField,
  withWelcomeDefaults,
  buildVariableContext,
  replaceVariables,
  isValidWebhookUrl,
  isValidHexColor,
  hexToInt,
  embedHasContent,
} from '@/lib/welcome';

const AUTOSAVE_DELAY = 1200;

// ---------------------------------------------------------------------------
// V2 component type definitions
// ---------------------------------------------------------------------------
const V2_TYPES = {
  TEXT_DISPLAY: 10,
  THUMBNAIL_SECTION: 9,
  MEDIA_GALLERY: 12,
  SEPARATOR: 14,
  FILE: 13,
  CONTAINER: 17,
};

const V2_TYPE_META = {
  [V2_TYPES.TEXT_DISPLAY]:      { label: 'Text Display',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  [V2_TYPES.THUMBNAIL_SECTION]: { label: 'Section',         color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  [V2_TYPES.MEDIA_GALLERY]:     { label: 'Media Gallery',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  [V2_TYPES.SEPARATOR]:         { label: 'Separator',       color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  [V2_TYPES.FILE]:              { label: 'File',            color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  [V2_TYPES.CONTAINER]:         { label: 'Container',       color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

function createComponent(type) {
  switch (type) {
    case V2_TYPES.TEXT_DISPLAY:
      return { type, content: '' };
    case V2_TYPES.THUMBNAIL_SECTION:
      return {
        type,
        components: [{ type: V2_TYPES.TEXT_DISPLAY, content: '' }],
        accessory: { type: 11, media: { url: '' } },
      };
    case V2_TYPES.MEDIA_GALLERY:
      return { type, items: [{ media: { url: '' }, description: '' }] };
    case V2_TYPES.SEPARATOR:
      return { type, divider: true, spacing: 1 };
    case V2_TYPES.FILE:
      return { type, file: { url: '' } };
    case V2_TYPES.CONTAINER:
      return {
        type,
        accent_color: 0x5865F2,
        accent_color_hex: '#5865F2',
        components: [],
      };
    default:
      return { type };
  }
}

// ============================================================================
// Page
// ============================================================================
export default function WelcomeSettingsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [guild, setGuild] = useState(null);
  const [guildLoading, setGuildLoading] = useState(true);
  const [guildError, setGuildError] = useState(null);

  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [saveState, setSaveState] = useState('idle');
  const [testState, setTestState] = useState('idle');
  const [testMessage, setTestMessage] = useState('');
  const [toast, setToast] = useState(null);

  const textareaRef = useRef(null);
  const autosaveTimer = useRef(null);
  const isFirstConfigLoad = useRef(true);

  // ------------------------------------------------------------------
  // Load guild
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!id || status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/servers");
      return;
    }

    async function fetchGuildInfo() {
      try {
        const res = await fetch(`/api/user-guilds`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `Erro ${res.status}`);
        const found = data.guilds?.find((g) => g.id === id);
        if (!found) { setGuildError('Servidor não encontrado ou você não tem permissão.'); return; }
        setGuild(found);
      } catch (err) { setGuildError(err.message); }
      finally { setGuildLoading(false); }
    }
    fetchGuildInfo();
  }, [id, session, status, router]);

  // ------------------------------------------------------------------
  // Load config
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!id) return;
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/guild/${id}/welcome`);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        setConfig(withWelcomeDefaults(await res.json()));
      } catch (err) {
        setConfigError(err.message);
        setConfig(createDefaultWelcomeConfig());
      } finally { setConfigLoading(false); }
    }
    fetchConfig();
  }, [id]);

  // ------------------------------------------------------------------
  // Autosave
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!config || configLoading) return;
    if (isFirstConfigLoad.current) { isFirstConfigLoad.current = false; return; }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveConfig(config), AUTOSAVE_DELAY);
    return () => clearTimeout(autosaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const saveConfig = useCallback(async (cfg) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/guild/${id}/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok) { setSaveState('error'); showToast(data.error || 'Erro ao salvar', 'error'); return; }
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch { setSaveState('error'); showToast('Não foi possível salvar.', 'error'); }
  }, [id]);

  const showToast = (msg, type = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBack = () => router.push(`/server/${id}`);

  const updateConfig = (updater) =>
    setConfig((prev) => (typeof updater === 'function' ? updater(prev) : updater));

  // ------------------------------------------------------------------
  // Mode toggle (flags)
  // ------------------------------------------------------------------
  const setMode = (flags) => {
    updateConfig((prev) => ({
      ...prev,
      flags,
      message: {
        ...prev.message,
        ...(flags === MESSAGE_FLAGS.COMPONENTS_V2
          ? { components: prev.message.components?.length ? prev.message.components : [] }
          : { components: [] }),
      },
    }));
  };

  // ------------------------------------------------------------------
  // Mode 0: content + embeds
  // ------------------------------------------------------------------
  const updateContent = (value) =>
    updateConfig((prev) => ({ ...prev, message: { ...prev.message, content: value.slice(0, MAX_CONTENT_LENGTH) } }));

  const insertVariable = (key) => {
    const ta = textareaRef.current;
    const cur = config?.message?.content || '';
    if (!ta) { updateContent(cur + key); return; }
    const s = ta.selectionStart ?? cur.length, e = ta.selectionEnd ?? cur.length;
    updateContent(cur.slice(0, s) + key + cur.slice(e));
    requestAnimationFrame(() => { ta.focus(); const c = s + key.length; ta.setSelectionRange(c, c); });
  };

  const addEmbed = () => updateConfig((prev) => {
    const embeds = prev.message?.embeds || [];
    if (embeds.length >= MAX_EMBEDS) return prev;
    return { ...prev, message: { ...prev.message, embeds: [...embeds, createEmptyEmbed()] } };
  });
  const removeEmbed = (i) => updateConfig((prev) => ({ ...prev, message: { ...prev.message, embeds: prev.message.embeds.filter((_, j) => j !== i) } }));
  const duplicateEmbed = (i) => updateConfig((prev) => {
    const embeds = prev.message?.embeds || [];
    if (embeds.length >= MAX_EMBEDS) return prev;
    const next = [...embeds]; next.splice(i + 1, 0, JSON.parse(JSON.stringify(embeds[i])));
    return { ...prev, message: { ...prev.message, embeds: next } };
  });
  const updateEmbed = (i, updater) => updateConfig((prev) => ({
    ...prev,
    message: {
      ...prev.message,
      embeds: prev.message.embeds.map((e, j) => j !== i ? e : (typeof updater === 'function' ? updater(e) : { ...e, ...updater })),
    },
  }));
  const addField = (ei) => updateEmbed(ei, (e) => {
    const fields = e.fields || [];
    if (fields.length >= MAX_FIELDS_PER_EMBED) return e;
    return { ...e, fields: [...fields, createEmptyEmbedField()] };
  });
  const removeField = (ei, fi) => updateEmbed(ei, (e) => ({ ...e, fields: e.fields.filter((_, j) => j !== fi) }));
  const updateField = (ei, fi, updater) => updateEmbed(ei, (e) => ({
    ...e, fields: e.fields.map((f, j) => j !== fi ? f : (typeof updater === 'function' ? updater(f) : { ...f, ...updater })),
  }));
  const moveField = (ei, fi, dir) => updateEmbed(ei, (e) => {
    const fields = [...e.fields]; const t = fi + dir;
    if (t < 0 || t >= fields.length) return e;
    [fields[fi], fields[t]] = [fields[t], fields[fi]];
    return { ...e, fields };
  });

  // ------------------------------------------------------------------
  // Mode V2: components
  // ------------------------------------------------------------------
  const v2Components = config?.message?.components || [];

  const addV2Component = (type) => {
    updateConfig((prev) => ({
      ...prev,
      message: { ...prev.message, components: [...(prev.message.components || []), createComponent(type)] },
    }));
  };

  const removeV2Component = (idx) => updateConfig((prev) => ({
    ...prev,
    message: { ...prev.message, components: prev.message.components.filter((_, i) => i !== idx) },
  }));

  const updateV2Component = (idx, updater) => updateConfig((prev) => ({
    ...prev,
    message: {
      ...prev.message,
      components: prev.message.components.map((c, i) =>
        i !== idx ? c : (typeof updater === 'function' ? updater(c) : { ...c, ...updater })
      ),
    },
  }));

  const moveV2Component = (idx, dir) => updateConfig((prev) => {
    const comps = [...(prev.message.components || [])];
    const t = idx + dir;
    if (t < 0 || t >= comps.length) return prev;
    [comps[idx], comps[t]] = [comps[t], comps[idx]];
    return { ...prev, message: { ...prev.message, components: comps } };
  });

  // ------------------------------------------------------------------
  // Test
  // ------------------------------------------------------------------
  const handleTest = async () => {
    setTestState('testing'); setTestMessage('');
    try {
      const res = await fetch(`/api/guild/${id}/welcome/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: config.webhookUrl, message: config.message, flags: config.flags }),
      });
      const data = await res.json();
      if (!res.ok) { setTestState('error'); setTestMessage(data.error || 'Falha ao enviar'); return; }
      setTestState('success'); setTestMessage('Mensagem de teste enviada!');
    } catch { setTestState('error'); setTestMessage('Erro de conexão'); }
    finally { setTimeout(() => setTestState('idle'), 4000); }
  };

  // ------------------------------------------------------------------
  // Guards
  // ------------------------------------------------------------------
  if (status === "loading" || guildLoading || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-300">Carregando configurações de boas-vindas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (guildError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
              <FaDiscord size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-green-300 mb-2">Erro</h2>
            <p className="text-green-400 mb-6">{guildError}</p>
            <button onClick={handleBack} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Derived render values
  // ------------------------------------------------------------------
  const webhookUrl = config?.webhookUrl || '';
  const webhookValid = webhookUrl ? isValidWebhookUrl(webhookUrl) : null;
  const content = config?.message?.content || '';
  const charCount = content.length;
  const charPercent = Math.min(100, (charCount / MAX_CONTENT_LENGTH) * 100);
  const isV2 = config?.flags === MESSAGE_FLAGS.COMPONENTS_V2;

  const previewContext = buildVariableContext({
    user: { id: '123456789012345678', username: 'membro-teste', joinedAt: Date.now(), createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 },
    guild: { name: guild?.name, memberCount: guild?.approximate_member_count },
  });
  const previewContent = replaceVariables(content, previewContext);
  const embeds = config?.message?.embeds || [];
  const previewEmbeds = embeds.map((e) => substitutePreviewEmbed(e, previewContext));

  const iconUrl = guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900">
      <Navbar />

      <div className="relative max-w-7xl mx-auto px-6 py-8 pt-28">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-black/50 border border-green-500/30 hover:bg-green-500/10 transition-all duration-300 text-green-400 hover:text-green-300"
        >
          <FaArrowLeft size={14} />
          <span className="text-sm font-medium">Voltar ao Dashboard</span>
        </button>

        {/* Server Header */}
        <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={guild.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-green-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                <FaDiscord size={32} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-green-300 mb-1">Mensagens de Boas-Vindas</h1>
              <p className="text-green-400 text-sm">
                Configure a mensagem automática de boas-vindas para {guild?.name}
              </p>
            </div>
            <SaveIndicator state={saveState} />
          </div>
        </div>

        {configError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <FaExclamationTriangle size={14} />
            Não foi possível carregar a configuração salva ({configError}). Exibindo valores padrão.
          </div>
        )}

        {/* Mode switcher */}
        <ModeSwitcher isV2={isV2} onSetMode={setMode} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
          {/* Left: editor */}
          <div className="space-y-6">
            <GeneralSettingsCard
              enabled={config.enabled}
              onToggle={() => updateConfig((p) => ({ ...p, enabled: !p.enabled }))}
              webhookUrl={webhookUrl}
              webhookValid={webhookValid}
              onWebhookChange={(v) => updateConfig((p) => ({ ...p, webhookUrl: v }))}
              onTest={handleTest}
              testState={testState}
              testMessage={testMessage}
            />

            {!isV2 && (
              <>
                <ContentEditorCard
                  content={content}
                  charCount={charCount}
                  charPercent={charPercent}
                  onChange={updateContent}
                  onInsertVariable={insertVariable}
                  textareaRef={textareaRef}
                />
                <EmbedsCard
                  embeds={embeds}
                  onAddEmbed={addEmbed}
                  onRemoveEmbed={removeEmbed}
                  onDuplicateEmbed={duplicateEmbed}
                  onUpdateEmbed={updateEmbed}
                  onAddField={addField}
                  onRemoveField={removeField}
                  onUpdateField={updateField}
                  onMoveField={moveField}
                />
              </>
            )}

            {isV2 && (
              <V2ComponentsCard
                components={v2Components}
                onAdd={addV2Component}
                onRemove={removeV2Component}
                onUpdate={updateV2Component}
                onMove={moveV2Component}
              />
            )}
          </div>

          {/* Right: preview */}
          <div className="lg:sticky lg:top-8">
            <DiscordPreviewCard
              botName={guild?.name ? `${guild.name} Bot` : 'Bot de Boas-Vindas'}
              isV2={isV2}
              content={previewContent}
              hasContent={!!content.trim()}
              embeds={previewEmbeds}
              v2Components={v2Components}
              previewContext={previewContext}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-green-500/20 text-center">
          <p className="text-green-500/60 text-xs">
            As mensagens de boas-vindas são enviadas automaticamente quando novos membros entram no servidor
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// ============================================================================
// Mode Switcher
// ============================================================================
function ModeSwitcher({ isV2, onSetMode }) {
  return (
    <div className="flex gap-3 p-1 bg-black/50 border border-green-500/30 rounded-xl w-fit">
      <button
        type="button"
        onClick={() => onSetMode(MESSAGE_FLAGS.DEFAULT)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          !isV2
            ? 'bg-green-500/20 text-green-300 shadow border border-green-500/30'
            : 'text-green-400 hover:text-green-300'
        }`}
      >
        <FaLayerGroup size={14} />
        Mensagem Tradicional
        <span className="text-[10px] font-mono text-green-500/60">flags=0</span>
      </button>
      <button
        type="button"
        onClick={() => onSetMode(MESSAGE_FLAGS.COMPONENTS_V2)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isV2
            ? 'bg-purple-500/20 text-purple-300 shadow border border-purple-500/30'
            : 'text-green-400 hover:text-green-300'
        }`}
      >
        <FaBolt size={14} />
        Componentes V2
        <span className="text-[10px] font-mono text-green-500/60">flags=32768</span>
      </button>
    </div>
  );
}

// ============================================================================
// V2 Components Builder
// ============================================================================
function V2ComponentsCard({ components, onAdd, onRemove, onUpdate, onMove }) {
  return (
    <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FaBolt className="text-purple-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">Componentes V2</h2>
            <p className="text-green-400 text-sm">
              Adicione e organize os componentes da sua mensagem
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-green-500/60 font-mono">{components.length} componente{components.length !== 1 ? 's' : ''}</span>
        </div>

        {components.length === 0 && (
          <div className="rounded-xl border border-dashed border-green-500/30 py-8 text-center mb-4">
            <FaBolt size={20} className="text-purple-400/40 mx-auto mb-2" />
            <p className="text-green-500/60 text-sm">Nenhum componente adicionado ainda.</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {components.map((comp, idx) => (
            <V2ComponentEditor
              key={idx}
              component={comp}
              index={idx}
              total={components.length}
              onRemove={() => onRemove(idx)}
              onUpdate={(u) => onUpdate(idx, u)}
              onMove={(dir) => onMove(idx, dir)}
            />
          ))}
        </div>

        {/* Add buttons */}
        <div className="border border-green-500/20 rounded-xl p-3">
          <p className="text-xs font-medium text-green-400 mb-3">Adicionar componente</p>
          <div className="flex flex-wrap gap-2">
            {[
              { type: V2_TYPES.TEXT_DISPLAY, label: 'Text Display' },
              { type: V2_TYPES.THUMBNAIL_SECTION, label: 'Section + Thumbnail' },
              { type: V2_TYPES.MEDIA_GALLERY, label: 'Media Gallery' },
              { type: V2_TYPES.SEPARATOR, label: 'Separator' },
              { type: V2_TYPES.FILE, label: 'File' },
              { type: V2_TYPES.CONTAINER, label: 'Container' },
            ].map(({ type, label }) => {
              const meta = V2_TYPE_META[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onAdd(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${meta.bg} ${meta.border} ${meta.color} hover:brightness-125 transition-all`}
                >
                  <FaPlus size={10} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function V2ComponentEditor({ component, index, total, onRemove, onUpdate, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const meta = V2_TYPE_META[component.type] || { label: `Tipo ${component.type}`, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };

  return (
    <div className={`rounded-xl border ${meta.border} bg-black/30 overflow-hidden`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <FaGripLines className="text-gray-600 flex-shrink-0" size={12} />
        <span className={`text-xs font-bold flex-shrink-0 ${meta.color}`}>{meta.label}</span>
        <span className="flex-1 text-xs text-green-500/60 truncate min-w-0">
          {getComponentSummary(component)}
        </span>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 rounded text-green-400 hover:text-white hover:bg-white/5 disabled:opacity-30"><FaChevronUp size={11} /></button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 rounded text-green-400 hover:text-white hover:bg-white/5 disabled:opacity-30"><FaChevronDown size={11} /></button>
        <button type="button" onClick={onRemove} className="p-1.5 rounded text-green-400 hover:text-red-400 hover:bg-red-500/5"><FaTrash size={11} /></button>
        <button type="button" onClick={() => setExpanded((e) => !e)} className="p-1.5 rounded text-green-400 hover:text-white hover:bg-white/5">
          {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-green-500/20 p-3">
          <V2ComponentFields component={component} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

function V2ComponentFields({ component, onUpdate }) {
  const set = (key, value) => onUpdate((c) => ({ ...c, [key]: value }));

  switch (component.type) {
    case V2_TYPES.TEXT_DISPLAY:
      return (
        <LabeledTextarea
          label="Conteúdo (suporta markdown do Discord)"
          value={component.content}
          onChange={(v) => set('content', v)}
          rows={4}
          placeholder={'# Título\n**negrito**, *itálico*, `código`\n- lista\n[link](https://...)'}
        />
      );

    case V2_TYPES.SEPARATOR:
      return (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-green-400 cursor-pointer">
            <input
              type="checkbox"
              checked={!!component.divider}
              onChange={(e) => set('divider', e.target.checked)}
              className="rounded border-green-500/30 bg-black/50 text-purple-500"
            />
            Mostrar linha divisória
          </label>
          <div>
            <span className="text-xs text-green-400 mr-2">Espaçamento:</span>
            {[1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('spacing', s)}
                className={`mr-1 px-2 py-1 rounded text-xs font-mono ${component.spacing === s ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-black/50 text-green-400 border border-green-500/30'}`}
              >
                {s === 1 ? 'Normal' : 'Grande'}
              </button>
            ))}
          </div>
        </div>
      );

    case V2_TYPES.FILE:
      return (
        <LabeledInput
          label="URL do arquivo (ex: attachment://arquivo.zip)"
          value={component.file?.url || ''}
          onChange={(v) => onUpdate((c) => ({ ...c, file: { url: v } }))}
          placeholder="attachment://arquivo.zip"
        />
      );

    case V2_TYPES.MEDIA_GALLERY:
      return <MediaGalleryFields component={component} onUpdate={onUpdate} />;

    case V2_TYPES.THUMBNAIL_SECTION:
      return <SectionFields component={component} onUpdate={onUpdate} />;

    case V2_TYPES.CONTAINER:
      return <ContainerFields component={component} onUpdate={onUpdate} />;

    default:
      return <p className="text-xs text-green-500/60">Tipo de componente não suportado pelo editor.</p>;
  }
}

function MediaGalleryFields({ component, onUpdate }) {
  const items = component.items || [];

  const addItem = () => onUpdate((c) => ({ ...c, items: [...(c.items || []), { media: { url: '' }, description: '' }] }));
  const removeItem = (i) => onUpdate((c) => ({ ...c, items: c.items.filter((_, j) => j !== i) }));
  const updateItem = (i, key, value) => onUpdate((c) => ({
    ...c,
    items: c.items.map((item, j) =>
      j !== i ? item : key === 'url' ? { ...item, media: { url: value } } : { ...item, [key]: value }
    ),
  }));

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-black/50 border border-green-500/20">
          <FaImage size={12} className="text-emerald-400 flex-shrink-0 mt-2" />
          <div className="flex-1 space-y-2 min-w-0">
            <LabeledInput label="URL da mídia" value={item.media?.url || ''} onChange={(v) => updateItem(i, 'url', v)} placeholder="https://..." compact />
            <LabeledInput label="Descrição (alt text)" value={item.description || ''} onChange={(v) => updateItem(i, 'description', v)} placeholder="Descrição da imagem..." compact />
          </div>
          <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-green-400 hover:text-red-400 flex-shrink-0 mt-0.5"><FaTrash size={11} /></button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-green-500/30 text-xs text-green-400 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors">
        <FaPlus size={10} /> Adicionar mídia
      </button>
    </div>
  );
}

function SectionFields({ component, onUpdate }) {
  const texts = (component.components || []).filter((c) => c.type === V2_TYPES.TEXT_DISPLAY);
  const thumbUrl = component.accessory?.media?.url || '';

  const updateText = (i, value) => onUpdate((c) => ({
    ...c,
    components: c.components.map((t, j) => j !== i ? t : { ...t, content: value }),
  }));
  const addText = () => onUpdate((c) => ({
    ...c,
    components: [...(c.components || []), { type: V2_TYPES.TEXT_DISPLAY, content: '' }],
  }));
  const removeText = (i) => onUpdate((c) => ({ ...c, components: c.components.filter((_, j) => j !== i) }));
  const updateThumb = (url) => onUpdate((c) => ({ ...c, accessory: { type: 11, media: { url } } }));

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-green-400 mb-2">Thumbnail (acessório)</p>
        <LabeledInput label="URL da thumbnail" value={thumbUrl} onChange={updateThumb} placeholder="https://..." />
      </div>
      <div>
        <p className="text-xs font-semibold text-green-400 mb-2">Blocos de texto</p>
        <div className="space-y-2">
          {texts.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <LabeledTextarea
                  label={`Texto #${i + 1}`}
                  value={t.content}
                  onChange={(v) => updateText(i, v)}
                  rows={2}
                  placeholder="# Título\nTexto..."
                />
              </div>
              <button type="button" onClick={() => removeText(i)} className="p-1.5 text-green-400 hover:text-red-400 mt-5 flex-shrink-0"><FaTrash size={11} /></button>
            </div>
          ))}
          <button type="button" onClick={addText} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-green-500/30 text-xs text-green-400 hover:border-purple-500/50 hover:text-purple-400 hover:bg-purple-500/5 transition-colors">
            <FaPlus size={10} /> Adicionar texto
          </button>
        </div>
      </div>
    </div>
  );
}

function ContainerFields({ component, onUpdate }) {
  const accentHex = component.accent_color_hex || '#5865F2';
  const children = component.components || [];

  const setAccent = (hex) => onUpdate((c) => ({
    ...c,
    accent_color_hex: hex,
    accent_color: isValidHexColor(hex) ? hexToInt(hex) : c.accent_color,
  }));

  const addChild = (type) => onUpdate((c) => ({
    ...c,
    components: [...(c.components || []), createComponent(type)],
  }));
  const removeChild = (i) => onUpdate((c) => ({ ...c, components: c.components.filter((_, j) => j !== i) }));
  const updateChild = (i, updater) => onUpdate((c) => ({
    ...c,
    components: c.components.map((ch, j) => j !== i ? ch : (typeof updater === 'function' ? updater(ch) : { ...ch, ...updater })),
  }));
  const moveChild = (i, dir) => onUpdate((c) => {
    const comps = [...c.components]; const t = i + dir;
    if (t < 0 || t >= comps.length) return c;
    [comps[i], comps[t]] = [comps[t], comps[i]];
    return { ...c, components: comps };
  });

  return (
    <div className="space-y-3">
      {/* Accent color */}
      <div>
        <label className="block text-xs font-medium text-green-400 mb-1">Cor de destaque</label>
        <div className="flex items-center gap-2">
          <input type="color" value={accentHex} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-lg bg-transparent border border-green-500/30 cursor-pointer" />
          <input type="text" value={accentHex} onChange={(e) => setAccent(e.target.value)} placeholder="#5865F2" className="w-24 px-2 py-2 rounded-lg bg-black/50 border border-green-500/30 text-white text-xs font-mono focus:outline-none focus:border-green-500/50" />
        </div>
      </div>

      {/* Children */}
      <div>
        <p className="text-xs font-semibold text-green-400 mb-2">Componentes internos ({children.length})</p>
        <div className="space-y-2 ml-3 border-l-2 border-orange-500/20 pl-3">
          {children.map((child, i) => (
            <V2ComponentEditor
              key={i}
              component={child}
              index={i}
              total={children.length}
              onRemove={() => removeChild(i)}
              onUpdate={(u) => updateChild(i, u)}
              onMove={(dir) => moveChild(i, dir)}
            />
          ))}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { type: V2_TYPES.TEXT_DISPLAY, label: 'Texto' },
              { type: V2_TYPES.MEDIA_GALLERY, label: 'Galeria' },
              { type: V2_TYPES.SEPARATOR, label: 'Separator' },
              { type: V2_TYPES.THUMBNAIL_SECTION, label: 'Section' },
            ].map(({ type, label }) => {
              const meta = V2_TYPE_META[type];
              return (
                <button key={type} type="button" onClick={() => addChild(type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border ${meta.bg} ${meta.border} ${meta.color} hover:brightness-125`}>
                  <FaPlus size={9} />{label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// General Settings
// ============================================================================
function GeneralSettingsCard({ enabled, onToggle, webhookUrl, webhookValid, onWebhookChange, onTest, testState, testMessage }) {
  return (
    <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <FaCog size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">Configurações Gerais</h2>
            <p className="text-green-400 text-sm">Configure o webhook e o sistema de boas-vindas</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-green-500/20 mb-6">
          <div>
            <p className="text-white font-medium">Sistema de boas-vindas</p>
            <p className="text-green-400 text-sm">{enabled ? 'Ativo — novos membros receberão a mensagem.' : 'Desativado — nenhuma mensagem será enviada.'}</p>
          </div>
          <Switch checked={enabled} onChange={onToggle} />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-green-300 mb-2">URL do Webhook</label>
          <div className="relative">
            <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={14} />
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => onWebhookChange(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full pl-9 pr-10 py-3 rounded-xl bg-black/50 border border-green-500/30 text-white placeholder-green-500/50 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {webhookValid === true && <FaCheckCircle className="text-emerald-400" size={14} />}
              {webhookValid === false && <FaTimesCircle className="text-red-400" size={14} />}
            </div>
          </div>
          <p className="mt-2 text-xs text-green-500/60">{webhookValid === false ? 'URL de webhook inválida.' : 'Crie em Configurações do Canal → Integrações → Webhooks.'}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onTest}
            disabled={!webhookValid || testState === 'testing'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testState === 'testing' ? <FaSpinner className="animate-spin" size={14} /> : <FaPaperPlane size={14} />}
            Testar Boas-Vindas
          </button>
          {testState === 'success' && <span className="flex items-center gap-2 text-emerald-400 text-sm"><FaCheckCircle size={14} />{testMessage}</span>}
          {testState === 'error' && <span className="flex items-center gap-2 text-red-400 text-sm"><FaTimesCircle size={14} />{testMessage}</span>}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Content editor (mode 0)
// ============================================================================
function ContentEditorCard({ content, charCount, charPercent, onChange, onInsertVariable, textareaRef }) {
  const isOverLimit = charCount > MAX_CONTENT_LENGTH;
  return (
    <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FaLayerGroup size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">Mensagem</h2>
            <p className="text-green-400 text-sm">Escreva a mensagem de boas-vindas usando variáveis</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <p className="text-xs font-medium text-green-400 mb-2">Variáveis disponíveis (clique para inserir)</p>
          <div className="flex flex-wrap gap-2">
            {WELCOME_VARIABLES.map((v) => (
              <button key={v.key} type="button" title={v.description} onClick={() => onInsertVariable(v.key)}
                className="px-2.5 py-1 rounded-lg bg-black/50 border border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 text-xs font-mono text-green-400 transition-colors"
              >{v.key}</button>
            ))}
          </div>
        </div>
        <textarea ref={textareaRef} value={content} onChange={(e) => onChange(e.target.value)} rows={6}
          placeholder="Digite a mensagem de boas-vindas... use as variáveis acima para personalizar."
          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/30 text-white placeholder-green-500/50 text-sm font-mono focus:outline-none focus:border-green-500/50 transition-colors resize-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-1.5 flex-1 mr-3 rounded-full bg-black/50 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${isOverLimit ? 'bg-red-500' : charPercent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${charPercent}%` }} />
          </div>
          <span className={`text-xs font-mono ${isOverLimit ? 'text-red-400' : 'text-green-500/60'}`}>{charCount}/{MAX_CONTENT_LENGTH}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Embed editor (mode 0)
// ============================================================================
function EmbedsCard({ embeds, onAddEmbed, onRemoveEmbed, onDuplicateEmbed, onUpdateEmbed, onAddField, onRemoveField, onUpdateField, onMoveField }) {
  const atLimit = embeds.length >= MAX_EMBEDS;
  return (
    <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FaImage size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">Embeds</h2>
            <p className="text-green-400 text-sm">Adicione embeds ricos à sua mensagem</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-green-500/60">{embeds.length}/{MAX_EMBEDS}</span>
          <p className="text-xs text-green-400">A mensagem precisa ter conteúdo ou pelo menos um embed com título ou descrição.</p>
        </div>

        {embeds.length === 0 && (
          <div className="rounded-xl border border-dashed border-green-500/30 px-4 py-8 text-center mb-4">
            <p className="text-green-500/60 text-sm">Nenhum embed adicionado ainda.</p>
          </div>
        )}

        <div className="space-y-3">
          {embeds.map((embed, i) => (
            <EmbedEditor key={i} embed={embed} index={i} total={embeds.length}
              onRemove={() => onRemoveEmbed(i)} onDuplicate={() => onDuplicateEmbed(i)}
              duplicateDisabled={atLimit} onUpdate={(u) => onUpdateEmbed(i, u)}
              onAddField={() => onAddField(i)} onRemoveField={(fi) => onRemoveField(i, fi)}
              onUpdateField={(fi, u) => onUpdateField(i, fi, u)} onMoveField={(fi, d) => onMoveField(i, fi, d)}
            />
          ))}
        </div>

        <button type="button" onClick={onAddEmbed} disabled={atLimit}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-green-500/30 text-sm font-medium text-green-400 hover:border-green-500/50 hover:text-green-300 hover:bg-green-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FaPlus size={12} />{atLimit ? `Limite de ${MAX_EMBEDS} embeds atingido` : 'Adicionar Embed'}
        </button>
      </div>
    </div>
  );
}

function EmbedEditor({ embed, index, total, onRemove, onDuplicate, duplicateDisabled, onUpdate, onAddField, onRemoveField, onUpdateField, onMoveField }) {
  const [expanded, setExpanded] = useState(index === 0);
  const color = isValidHexColor(embed.color) ? embed.color : '#5865F2';
  const fields = embed.fields || [];
  const fieldsAtLimit = fields.length >= MAX_FIELDS_PER_EMBED;
  const meaningful = embedHasContent(embed);
  const setField = (path, value) => onUpdate((prev) => setNestedValue(prev, path, value));

  return (
    <div className="rounded-xl border border-green-500/30 bg-black/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <FaGripLines className="text-gray-600 flex-shrink-0" size={12} />
        <span className="w-3 h-3 rounded-full flex-shrink-0 border border-green-500/30" style={{ backgroundColor: color }} />
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex-1 flex items-center gap-2 text-left text-sm font-medium text-green-300 truncate min-w-0">
          <span className="truncate">{embed.title?.trim() || `Embed #${index + 1}`}</span>
          {!meaningful && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex-shrink-0">vazio</span>}
        </button>
        <button type="button" title="Duplicar" onClick={onDuplicate} disabled={duplicateDisabled} className="p-2 rounded-lg text-green-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><FaCopy size={13} /></button>
        <button type="button" title="Remover" onClick={onRemove} className="p-2 rounded-lg text-green-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"><FaTrash size={13} /></button>
        <button type="button" onClick={() => setExpanded((e) => !e)} className="p-2 rounded-lg text-green-400 hover:text-white hover:bg-white/5 transition-colors">{expanded ? <FaChevronUp size={13} /> : <FaChevronDown size={13} />}</button>
      </div>

      {expanded && (
        <div className="px-3 pb-4 space-y-3 border-t border-green-500/20 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <LabeledInput label="Título" value={embed.title} onChange={(v) => setField('title', v.slice(0, EMBED_LIMITS.title))} maxLength={EMBED_LIMITS.title} placeholder="Bem-vindo(a)!" />
            <LabeledInput label="URL do título" value={embed.url} onChange={(v) => setField('url', v)} placeholder="https://..." />
            <div>
              <label className="block text-xs font-medium text-green-400 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setField('color', e.target.value)} className="w-9 h-9 rounded-lg bg-transparent border border-green-500/30 cursor-pointer" />
                <input type="text" value={embed.color || ''} onChange={(e) => setField('color', e.target.value)} placeholder="#5865F2" className="w-24 px-2 py-2 rounded-lg bg-black/50 border border-green-500/30 text-white text-xs font-mono focus:outline-none focus:border-green-500/50" />
              </div>
            </div>
          </div>
          <LabeledTextarea label="Descrição" value={embed.description} onChange={(v) => setField('description', v.slice(0, EMBED_LIMITS.description))} maxLength={EMBED_LIMITS.description} rows={3} placeholder="Texto principal do embed..." />
          <div>
            <p className="text-xs font-semibold text-green-400 mb-2">Autor</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <LabeledInput label="Nome" value={embed.author?.name} onChange={(v) => setField('author.name', v.slice(0, EMBED_LIMITS.authorName))} maxLength={EMBED_LIMITS.authorName} />
              <LabeledInput label="URL" value={embed.author?.url} onChange={(v) => setField('author.url', v)} placeholder="https://..." />
              <LabeledInput label="Ícone (URL)" value={embed.author?.iconURL} onChange={(v) => setField('author.iconURL', v)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LabeledInput label="Imagem (URL)" icon={<FaImage size={12} />} value={embed.image?.url} onChange={(v) => setField('image.url', v)} placeholder="https://.../imagem.png" />
            <LabeledInput label="Thumbnail (URL)" icon={<FaImage size={12} />} value={embed.thumbnail?.url} onChange={(v) => setField('thumbnail.url', v)} placeholder="https://.../thumb.png" />
          </div>
          <div>
            <p className="text-xs font-semibold text-green-400 mb-2">Rodapé</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LabeledInput label="Texto" value={embed.footer?.text} onChange={(v) => setField('footer.text', v.slice(0, EMBED_LIMITS.footerText))} maxLength={EMBED_LIMITS.footerText} />
              <LabeledInput label="Ícone (URL)" value={embed.footer?.iconURL} onChange={(v) => setField('footer.iconURL', v)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-400">Campos ({fields.length}/{MAX_FIELDS_PER_EMBED})</p>
            </div>
            <div className="space-y-2">
              {fields.map((field, fi) => (
                <FieldEditor key={fi} field={field} index={fi} total={fields.length}
                  onChange={(u) => onUpdateField(fi, u)} onRemove={() => onRemoveField(fi)} onMove={(d) => onMoveField(fi, d)}
                />
              ))}
            </div>
            <button type="button" onClick={onAddField} disabled={fieldsAtLimit}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-green-500/30 text-xs font-medium text-green-400 hover:border-green-500/50 hover:text-green-300 hover:bg-green-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaPlus size={10} />{fieldsAtLimit ? `Limite de ${MAX_FIELDS_PER_EMBED} campos` : 'Adicionar campo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldEditor({ field, index, total, onChange, onRemove, onMove }) {
  return (
    <div className="rounded-lg border border-green-500/20 p-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <LabeledInput label="Nome" value={field.name} onChange={(v) => onChange((f) => ({ ...f, name: v.slice(0, EMBED_LIMITS.fieldName) }))} maxLength={EMBED_LIMITS.fieldName} compact />
        <LabeledInput label="Valor" value={field.value} onChange={(v) => onChange((f) => ({ ...f, value: v.slice(0, EMBED_LIMITS.fieldValue) }))} maxLength={EMBED_LIMITS.fieldValue} compact />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-green-400 cursor-pointer">
          <input type="checkbox" checked={!!field.inline} onChange={(e) => onChange((f) => ({ ...f, inline: e.target.checked }))} className="rounded border-green-500/30 bg-black/50 text-emerald-500" />
          Inline
        </label>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 rounded text-green-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronUp size={11} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 rounded text-green-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronDown size={11} /></button>
          <button type="button" onClick={onRemove} className="p-1.5 rounded text-green-400 hover:text-red-400 hover:bg-red-500/5"><FaTrash size={11} /></button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Discord Preview
// ============================================================================
function DiscordPreviewCard({ botName, isV2, content, hasContent, embeds, v2Components, previewContext }) {
  const now = new Date();
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(now);
  const previewEmbeds = (embeds || []).filter(embedHasMeaningfulContent);

  return (
    <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <FaDiscord size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-300">Pré-visualização</h2>
            <p className="text-green-400 text-sm">Como a mensagem aparecerá no Discord</p>
          </div>
          {isV2 && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">Componentes V2</span>}
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-xl bg-[#313338] p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
              <FaDiscord size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-white text-sm">{botName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold leading-none">BOT</span>
                <span className="text-xs text-gray-400">hoje às {time}</span>
              </div>

              {!isV2 && (
                <>
                  {hasContent && (
                    <div className="text-gray-100 text-sm whitespace-pre-wrap break-words mb-2">
                      {renderDiscordMarkdown(content)}
                    </div>
                  )}
                  {previewEmbeds.length > 0 && (
                    <div className="space-y-2">
                      {previewEmbeds.map((embed, i) => <DiscordEmbedPreview key={i} embed={embed} />)}
                    </div>
                  )}
                  {!hasContent && previewEmbeds.length === 0 && (
                    <p className="text-gray-500 text-sm italic">A pré-visualização aparecerá aqui...</p>
                  )}
                </>
              )}

              {isV2 && (
                <div className="space-y-2">
                  {(v2Components || []).length === 0 && (
                    <p className="text-gray-500 text-sm italic">Adicione componentes V2 para visualizá-los aqui...</p>
                  )}
                  {(v2Components || []).map((comp, i) => (
                    <V2ComponentPreview key={i} component={comp} context={previewContext} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-green-500/60">As variáveis são substituídas por dados de exemplo.</p>
      </div>
    </div>
  );
}

function embedHasMeaningfulContent(embed) {
  if (!embed) return false;
  return !!(embed.title?.trim() || embed.description?.trim() || embed.image?.url?.trim() || embed.thumbnail?.url?.trim() || embed.footer?.text?.trim() || embed.author?.name?.trim() || (embed.fields || []).some((f) => f?.name?.trim() || f?.value?.trim()));
}

function DiscordEmbedPreview({ embed }) {
  const color = isValidHexColor(embed.color) ? embed.color : '#5865F2';
  const fields = embed.fields || [];
  return (
    <div className="flex rounded overflow-hidden bg-[#2b2d31] max-w-[480px]">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="p-3 flex-1 min-w-0">
        {embed.author?.name && (
          <div className="flex items-center gap-2 mb-1">
            {embed.author.iconURL && <img src={embed.author.iconURL} alt="" className="w-5 h-5 rounded-full object-cover" />}
            <span className="text-xs font-semibold text-gray-200">{renderDiscordMarkdown(embed.author.name)}</span>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {embed.title && (
              <div className="text-sm font-semibold text-white mb-1 break-words">
                {embed.url ? <a href={embed.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{renderDiscordMarkdown(embed.title)}</a> : renderDiscordMarkdown(embed.title)}
              </div>
            )}
            {embed.description && <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">{renderDiscordMarkdown(embed.description)}</div>}
            {fields.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {fields.map((field, i) => (
                  <div key={i} className={`text-xs ${field.inline ? '' : 'col-span-2'} min-w-0`}>
                    {field.name && <p className="font-semibold text-gray-200 break-words mb-0.5">{renderDiscordMarkdown(field.name)}</p>}
                    {field.value && <p className="text-gray-300 whitespace-pre-wrap break-words">{renderDiscordMarkdown(field.value)}</p>}
                  </div>
                ))}
              </div>
            )}
            {embed.image?.url && <img src={embed.image.url} alt="" className="mt-2 rounded max-h-64 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          </div>
          {embed.thumbnail?.url && <img src={embed.thumbnail.url} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />}
        </div>
        {embed.footer?.text && (
          <div className="flex items-center gap-2 mt-2">
            {embed.footer.iconURL && <img src={embed.footer.iconURL} alt="" className="w-4 h-4 rounded-full object-cover" />}
            <span className="text-xs text-gray-400">{embed.footer.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function V2ComponentPreview({ component, context }) {
  const sub = (text) => replaceVariables(text || '', context);

  switch (component.type) {
    case V2_TYPES.TEXT_DISPLAY:
      return (
        <div className="text-gray-200 text-sm whitespace-pre-wrap break-words">
          {renderDiscordMarkdown(sub(component.content))}
        </div>
      );

    case V2_TYPES.SEPARATOR:
      return (
        <div className={`${component.spacing === 2 ? 'my-3' : 'my-1.5'}`}>
          {component.divider && <hr className="border-white/10" />}
        </div>
      );

    case V2_TYPES.FILE:
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2b2d31] border border-white/10 text-sm text-blue-400">
          📎 {component.file?.url || 'arquivo'}
        </div>
      );

    case V2_TYPES.MEDIA_GALLERY: {
      const items = component.items || [];
      return (
        <div className={`grid gap-1 ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {items.map((item, i) => (
            <div key={i} className="relative rounded overflow-hidden bg-[#2b2d31] aspect-video flex items-center justify-center">
              {item.media?.url
                ? <img src={item.media.url} alt={item.description || ''} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <FaImage className="text-gray-600" size={24} />}
            </div>
          ))}
        </div>
      );
    }

    case V2_TYPES.THUMBNAIL_SECTION: {
      const texts = (component.components || []).filter((c) => c.type === V2_TYPES.TEXT_DISPLAY);
      const thumbUrl = component.accessory?.media?.url;
      return (
        <div className="flex gap-3">
          <div className="flex-1 space-y-1 min-w-0">
            {texts.map((t, i) => (
              <div key={i} className="text-gray-200 text-sm whitespace-pre-wrap break-words">
                {renderDiscordMarkdown(sub(t.content))}
              </div>
            ))}
          </div>
          {thumbUrl && (
            <img src={thumbUrl} alt="" className="w-20 h-20 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
          )}
        </div>
      );
    }

    case V2_TYPES.CONTAINER: {
      const hex = component.accent_color_hex || '#' + (component.accent_color ?? 0x5865F2).toString(16).padStart(6, '0');
      return (
        <div className="rounded-lg overflow-hidden" style={{ borderLeft: `4px solid ${isValidHexColor(hex) ? hex : '#5865F2'}` }}>
          <div className="bg-[#2b2d31] p-3 space-y-2">
            {(component.components || []).map((child, i) => (
              <V2ComponentPreview key={i} component={child} context={context} />
            ))}
            {(component.components || []).length === 0 && (
              <p className="text-gray-500 text-xs italic">Container vazio...</p>
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ============================================================================
// Save indicator
// ============================================================================
function SaveIndicator({ state }) {
  const map = {
    idle: { label: 'Alterações salvas', icon: <FaCheckCircle className="text-green-500/60" />, text: 'text-green-500/60' },
    saving: { label: 'Salvando...', icon: <FaSpinner className="animate-spin text-emerald-400" />, text: 'text-emerald-400' },
    saved: { label: 'Salvo!', icon: <FaCheckCircle className="text-emerald-400" />, text: 'text-emerald-400' },
    error: { label: 'Erro ao salvar', icon: <FaTimesCircle className="text-red-400" />, text: 'text-red-400' },
  };
  const c = map[state] || map.idle;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 border border-green-500/30 text-sm ${c.text}`}>
      {c.icon}<span>{c.label}</span>
    </div>
  );
}

// ============================================================================
// Primitives
// ============================================================================
function Switch({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-green-600' : 'bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Toast({ message, type }) {
  const styles = { success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', error: 'bg-red-500/10 border-red-500/30 text-red-400', info: 'bg-black/50 border-green-500/30 text-green-300' };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`px-4 py-3 rounded-xl border ${styles[type] || styles.info} text-sm shadow-2xl backdrop-blur`}>{message}</div>
    </div>
  );
}

function LabeledInput({ label, icon, value, onChange, maxLength, placeholder, compact }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="flex items-center gap-1.5 text-xs font-medium text-green-400">{icon}{label}</label>
        {maxLength && <span className="text-[10px] font-mono text-green-500/60">{(value || '').length}/{maxLength}</span>}
      </div>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-lg bg-black/50 border border-green-500/30 text-white text-xs placeholder-green-500/50 focus:outline-none focus:border-green-500/50 transition-colors`}
      />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, maxLength, rows = 3, placeholder }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-green-400">{label}</label>
        {maxLength && <span className="text-[10px] font-mono text-green-500/60">{(value || '').length}/{maxLength}</span>}
      </div>
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-green-500/30 text-white text-xs placeholder-green-500/50 focus:outline-none focus:border-green-500/50 transition-colors resize-none"
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function setNestedValue(obj, path, value) {
  const [first, ...rest] = path.split('.');
  if (rest.length === 0) return { ...obj, [first]: value };
  return { ...obj, [first]: setNestedValue(obj?.[first] || {}, rest.join('.'), value) };
}

function substitutePreviewEmbed(embed, context) {
  return {
    ...embed,
    title: replaceVariables(embed.title || '', context),
    description: replaceVariables(embed.description || '', context),
    footer: { ...embed.footer, text: replaceVariables(embed.footer?.text || '', context) },
    author: { ...embed.author, name: replaceVariables(embed.author?.name || '', context) },
    fields: (embed.fields || []).map((f) => ({
      ...f,
      name: replaceVariables(f.name || '', context),
      value: replaceVariables(f.value || '', context),
    })),
  };
}

function getComponentSummary(comp) {
  switch (comp.type) {
    case V2_TYPES.TEXT_DISPLAY:   return comp.content?.slice(0, 60) || '(vazio)';
    case V2_TYPES.SEPARATOR:      return comp.divider ? 'Com linha divisória' : 'Sem linha divisória';
    case V2_TYPES.FILE:           return comp.file?.url || '(sem arquivo)';
    case V2_TYPES.MEDIA_GALLERY:  return `${(comp.items || []).length} item(s)`;
    case V2_TYPES.THUMBNAIL_SECTION: return `${(comp.components || []).length} texto(s) + thumbnail`;
    case V2_TYPES.CONTAINER:      return `${(comp.components || []).length} componente(s) interno(s)`;
    default:                      return '';
  }
}

function renderDiscordMarkdown(text) {
  if (!text) return null;
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|`[^`]+`|<@!?\d+>|#{1,3} .+)/g;
  let lastIndex = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('### ')) tokens.push(<span key={key++} className="font-bold text-white">{token.slice(4)}</span>);
    else if (token.startsWith('## ')) tokens.push(<span key={key++} className="text-base font-bold text-white">{token.slice(3)}</span>);
    else if (token.startsWith('# ')) tokens.push(<span key={key++} className="text-lg font-bold text-white">{token.slice(2)}</span>);
    else if (token.startsWith('**')) tokens.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('__')) tokens.push(<span key={key++} className="underline">{token.slice(2, -2)}</span>);
    else if (token.startsWith('~~')) tokens.push(<span key={key++} className="line-through">{token.slice(2, -2)}</span>);
    else if (token.startsWith('*')) tokens.push(<em key={key++}>{token.slice(1, -1)}</em>);
    else if (token.startsWith('`')) tokens.push(<code key={key++} className="px-1 py-0.5 rounded bg-black/30 text-xs font-mono">{token.slice(1, -1)}</code>);
    else if (token.startsWith('<@')) tokens.push(<span key={key++} className="px-1 rounded bg-indigo-500/30 text-indigo-300 font-medium">@membro-teste</span>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens;
}