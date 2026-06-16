// pages/server/[id]/welcome.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, FaDiscord, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaPlus, FaTrash, FaCube, FaListAlt, FaFileAlt, FaFolderOpen, FaSlidersH, FaImages, FaAlignLeft, FaUser, FaInfoCircle
} from 'react-icons/fa';

export default function WelcomePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  // Estados de Controle Principal
  const [guild, setGuild] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [webhookURL, setWebhookURL] = useState('');
  const [isV2, setIsV2] = useState(false);

  // Estados do Modo Clássico (Content e Embeds antigos)
  const [content, setContent] = useState('');
  const [embeds, setEmbeds] = useState([]);

  // ESTADO EXCLUSIVO DO MODO V2 (Lista de Componentes do Webhook)
  const [components, setComponents] = useState([]);

  // UI Control
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!guildId || status === "loading") return;
    if (status === "unauthenticated") { router.push("/servers"); return; }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const guildsResponse = await fetch(`/api/user-guilds`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
        const guildsData = await guildsResponse.json();
        if (!guildsResponse.ok || !guildsData.success) throw new Error('Erro ao buscar dados do servidor');
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado.');
        setGuild(foundGuild);

        const response = await fetch(`/api/guild/${guildId}/welcome`);
        if (!response.ok) throw new Error('Erro ao carregar dados de Boas-vindas.');
        
        const data = await response.json();
        setEnabled(!!data?.enabled); 
        setWebhookURL(data?.webhookURL || '');
        
        const loadedIsV2 = !!data?.isV2;
        setIsV2(loadedIsV2);

        if (data?.message) {
          if (loadedIsV2) {
            // Carrega os componentes dinâmicos salvos no modo V2
            setComponents(data.message.components || []);
          } else {
            // Carrega dados clássicos
            setContent(data.message.content || '');
            if (data.message.embeds && Array.isArray(data.message.embeds)) {
              setEmbeds(data.message.embeds.map(emb => ({
                title: emb.title || '', description: emb.description || '', url: emb.url || '',
                color: emb.color ? '#' + emb.color.toString(16).padStart(6, '0') : '#5865F2',
                image: emb.image?.url || '', thumbnail: emb.thumbnail?.url || '',
                footerText: emb.footer?.text || '', footerIcon: emb.footer?.icon_url || '',
                authorName: emb.author?.name || '', authorIcon: emb.author?.icon_url || '', authorUrl: emb.author?.url || '',
                fields: emb.fields || []
              })));
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.accessToken) fetchData();
  }, [guildId, session, status, router]);

  // Handlers de Mudança de Modo
  const handleActivateV2 = () => {
    setIsV2(true);
    setContent('');
    setEmbeds([]);
    if (components.length === 0) {
      setComponents([]); // Inicializa array limpo para os novos componentes
    }
  };

  const handleDeactivateV2 = () => {
    setIsV2(false);
  };

  // ==========================================
  // GERENCIADORES DE COMPONENTES V2
  // ==========================================
  const addComponentV2 = (type) => {
    let newComp = { type };
    if (type === 10) { // Text Display
      newComp.content = '';
    } else if (type === 13) { // File
      newComp.file = { url: '' };
    } else if (type === 14) { // Separator
      // Opcionais por padrão: não criamos as chaves a menos que o usuário interaja
    } else if (type === 12) { // Media Gallery
      newComp.items = [];
    }
    setComponents([...components, newComp]);
  };

  const removeComponentV2 = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponentValue = (index, key, value) => {
    const updated = [...components];
    updated[index][key] = value;
    setComponents(updated);
  };

  const updateComponentFile = (index, value) => {
    const updated = [...components];
    updated[index].file = { url: value };
    setComponents(updated);
  };

  const updateSeparatorComponent = (index, field, value) => {
    const updated = [...components];
    if (value === "" || value === undefined) {
      delete updated[index][field]; // Se for vazio/padrão, remove a chave (não obrigatório)
    } else {
      updated[index][field] = value;
    }
    setComponents(updated);
  };

  // Sub-Gerenciamento para o Componente de Galeria de Mídia (Type 12)
  const addItemToGallery = (compIndex) => {
    const updated = [...components];
    updated[compIndex].items = [...updated[compIndex].items, { media: { url: '' }, description: '' }];
    setComponents(updated);
  };

  const removeItemFromGallery = (compIndex, itemIndex) => {
    const updated = [...components];
    updated[compIndex].items = updated[compIndex].items.filter((_, i) => i !== itemIndex);
    setComponents(updated);
  };

  const updateGalleryItem = (compIndex, itemIndex, key, value) => {
    const updated = [...components];
    if (key === 'url') {
      updated[compIndex].items[itemIndex].media = { url: value };
    } else {
      updated[compIndex].items[itemIndex][key] = value;
    }
    setComponents(updated);
  };

  // ==========================================
  // FUNÇÕES DO MODO CLÁSSICO (Embeds/Content)
  // ==========================================
  const addEmbed = () => {
    if (embeds.length >= 10) return;
    setEmbeds([...embeds, {
      title: '', description: '', url: '', color: '#5865F2', image: '', thumbnail: '',
      footerText: '', footerIcon: '', authorName: '', authorIcon: '', authorUrl: '', fields: []
    }]);
  };
  const removeEmbed = (index) => setEmbeds(embeds.filter((_, i) => i !== index));
  const updateEmbed = (index, key, value) => {
    const updated = [...embeds]; updated[index][key] = value; setEmbeds(updated);
  };
  const addFieldToEmbed = (embedIndex) => {
    const updated = [...embeds]; updated[embedIndex].fields = [...updated[embedIndex].fields, { name: '', value: '', inline: false }]; setEmbeds(updated);
  };
  const removeFieldFromEmbed = (embedIndex, fieldIndex) => {
    const updated = [...embeds]; updated[embedIndex].fields = updated[embedIndex].fields.filter((_, i) => i !== fieldIndex); setEmbeds(updated);
  };
  const updateFieldInEmbed = (embedIndex, fieldIndex, key, value) => {
    const updated = [...embeds]; updated[embedIndex].fields[fieldIndex][key] = value; setEmbeds(updated);
  };

  // ==========================================
  // SALVAR ALTERAÇÕES
  // ==========================================
  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (enabled) {
        if (!webhookURL.trim()) throw new Error('A URL do Webhook é obrigatória.');

        if (!isV2) {
          // Validação Clássica
          const hasContent = content.trim().length > 0;
          const hasValidEmbed = embeds.some(emb => emb.title.trim().length > 0 || emb.description.trim().length > 0);
          if (!hasContent && !hasValidEmbed) throw new Error('Obrigatório: Preencha o "Conteúdo" ou configure pelo menos um Embed.');
        } else {
          // Validação dos Componentes V2 antes de enviar
          for (let i = 0; i < components.length; i++) {
            const comp = components[i];
            if (comp.type === 10 && !comp.content?.trim()) {
              throw new Error(`No Componente #${i + 1} (Text Display): O campo conteúdo não pode ficar em branco.`);
            }
            if (comp.type === 13 && !comp.file?.url?.trim()) {
              throw new Error(`No Componente #${i + 1} (File): A URL do arquivo é obrigatória.`);
            }
            if (comp.type === 12) {
              if (comp.items.length === 0) throw new Error(`No Componente #${i + 1} (Galeria): Adicione pelo menos uma mídia.`);
              for (let j = 0; j < comp.items.length; j++) {
                if (!comp.items[j].media?.url?.trim()) throw new Error(`Na Galeria #${i + 1}, Item #${j + 1}: A URL da imagem é obrigatória.`);
              }
            }
          }
        }
      }

      setSaving(true);
      const finalMessage = {};

      if (isV2) {
        // Formatação exata do payload V2 solicitado
        finalMessage.flags = 32768;
        finalMessage.components = components.map(comp => {
          const base = { type: comp.type };
          if (comp.type === 10) base.content = comp.content.trim();
          if (comp.type === 13) base.file = { url: comp.file.url.trim() };
          if (comp.type === 14) {
            if (comp.divider !== undefined) base.divider = comp.divider;
            if (comp.spacing !== undefined) base.spacing = comp.spacing;
          }
          if (comp.type === 12) {
            base.items = comp.items.map(item => ({
              media: { url: item.media.url.trim() },
              description: item.description?.trim() || undefined
            }));
          }
          return base;
        });
      } else {
        // Payload Clássico
        if (content.trim()) finalMessage.content = content.trim();
        if (embeds.length > 0) {
          finalMessage.embeds = embeds.map(emb => {
            const decimalColor = parseInt(emb.color.replace('#', ''), 16);
            const obj = {
              title: emb.title.trim() || undefined,
              description: emb.description.trim() || undefined,
              url: emb.url.trim() || undefined,
              color: isNaN(decimalColor) ? 5814783 : decimalColor,
              image: emb.image.trim() ? { url: emb.image.trim() } : undefined,
              thumbnail: emb.thumbnail.trim() ? { url: emb.thumbnail.trim() } : undefined,
            };
            if (emb.footerText.trim()) obj.footer = { text: emb.footerText.trim(), icon_url: emb.footerIcon.trim() || undefined };
            if (emb.authorName.trim()) obj.author = { name: emb.authorName.trim(), icon_url: emb.authorIcon.trim() || undefined, url: emb.authorUrl.trim() || undefined };
            if (emb.fields.length > 0) obj.fields = emb.fields.map(f => ({ name: f.name.trim(), value: f.value.trim(), inline: !!f.inline }));
            return obj;
          });
        }
      }

      const response = await fetch(`/api/guild/${guildId}/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, webhookURL: webhookURL.trim(), isV2, message: finalMessage })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Falha ao salvar as configurações.');
      }
      
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 relative overflow-hidden">
      <Navbar />
      <div className="relative max-w-4xl mx-auto px-6 pt-36 pb-24 z-10">
        <button onClick={() => router.push(`/server/${guildId}`)} className="group inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 text-xs font-bold hover:text-slate-200">
          <FaArrowLeft size={11} /> <span>Voltar ao Dashboard</span>
        </button>

        {success && <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3"><FaCheckCircle size={16}/><span>{success}</span></div>}
        {error && <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3"><FaExclamationTriangle size={16}/><span>{error}</span></div>}

        <div className="space-y-5">
          {/* Módulo Master Ativo */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-200">Ativar Boas-vindas</h3>
              <p className="text-slate-400 text-xs mt-0.5">Disparar saudações configuradas na entrada de novos membros.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer"/>
              <div className="w-12 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-600 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className={`space-y-5 ${enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
            {/* Seletor de Estrutura */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mecanismo de Renderização</span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2 mt-1">
                  {isV2 ? <><FaCube className="text-indigo-400"/> Componentes v2</> : <><FaListAlt className="text-emerald-400"/> Formulário Clássico</>}
                </span>
              </div>
              <div className="flex gap-2">
                {!isV2 ? (
                  <button type="button" onClick={handleActivateV2} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 shadow-md shadow-indigo-950/50">
                    <FaCube size={12}/> Componentes v2
                  </button>
                ) : (
                  <button type="button" onClick={handleDeactivateV2} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700">
                    Retornar ao Clássico
                  </button>
                )}
              </div>
            </div>

            {/* URL Webhook */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-1">URL do Webhook</h3>
              <input type="text" value={webhookURL} onChange={(e) => setWebhookURL(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"/>
            </div>

            {/* RENDERS CONFIGURÁVEIS INDEPENDENTES */}
            {isV2 ? (
              /* ========================================================= */
              /* PAINEL COMPONENTES V2                                     */
              /* ========================================================= */
              <div className="space-y-4">
                <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Adicionar Blocos de Recursos Avançados</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button type="button" onClick={() => addComponentV2(10)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaAlignLeft className="text-indigo-400"/>Text Display</button>
                    <button type="button" onClick={() => addComponentV2(13)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaFileAlt className="text-blue-400"/>File Attachment</button>
                    <button type="button" onClick={() => addComponentV2(14)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaSlidersH className="text-amber-400"/>Separator</button>
                    <button type="button" onClick={() => addComponentV2(12)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaImages className="text-purple-400"/>Media Gallery</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {components.map((comp, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 relative animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">#{index + 1}</span>
                          <span className="text-xs font-bold text-slate-200">
                            {comp.type === 10 && "TEXT DISPLAY (Type 10)"}
                            {comp.type === 13 && "FILE (Type 13)"}
                            {comp.type === 14 && "SEPARATOR (Type 14)"}
                            {comp.type === 12 && "MEDIA GALLERY (Type 12)"}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeComponentV2(index)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><FaTrash size={12}/></button>
                      </div>

                      {/* RENDER - TEXT DISPLAY (TYPE 10) */}
                      {comp.type === 10 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Conteúdo do Bloco de Texto (Markdown Suportado)</label>
                          <textarea value={comp.content} onChange={(e) => updateComponentValue(index, 'content', e.target.value)} placeholder="# Seu Título aqui\n- Suporta Listas, Spoiler ||texto||, emojis e links..." rows={4} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>
                        </div>
                      )}

                      {/* RENDER - FILE (TYPE 13) */}
                      {comp.type === 13 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">URL do Arquivo / Anexo</label>
                          <input type="text" value={comp.file?.url || ''} onChange={(e) => updateComponentFile(index, e.target.value)} placeholder="attachment://nome-do-arquivo.zip ou https://..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"/>
                        </div>
                      )}

                      {/* RENDER - SEPARATOR (TYPE 14) */}
                      {comp.type === 14 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Exibir Linha Divisória (Divider)</label>
                            <select value={comp.divider === undefined ? "" : String(comp.divider)} onChange={(e) => updateSeparatorComponent(index, 'divider', e.target.value === "" ? undefined : e.target.value === "true")} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                              <option value="">Não Especificado (Opcional - Padrão Oculto)</option>
                              <option value="true">Sim (True)</option>
                              <option value="false">Não (False)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Espaçamento (Spacing)</label>
                            <select value={comp.spacing || ""} onChange={(e) => updateSeparatorComponent(index, 'spacing', e.target.value === "" ? undefined : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                              <option value="">Não Especificado (Opcional)</option>
                              <option value="1">1 (Padrão)</option>
                              <option value="2">2 (Espaço Duplo)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* RENDER - MEDIA GALLERY (TYPE 12) */}
                      {comp.type === 12 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-slate-950/40 p-2 border border-slate-800/50 rounded-lg">
                            <span className="text-[11px] font-bold text-slate-400">Itens Corporativos da Galeria ({comp.items?.length || 0})</span>
                            <button type="button" onClick={() => addItemToGallery(index)} className="px-2 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-bold text-[10px] rounded">+ Inserir Mídia</button>
                          </div>
                          
                          <div className="space-y-3">
                            {comp.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
                                <div className="md:col-span-5">
                                  <input type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItem(index, itemIdx, 'url', e.target.value)} placeholder="URL da imagem (Ex: .webp, .png)" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none"/>
                                </div>
                                <div className="md:col-span-6">
                                  <input type="text" value={item.description || ''} onChange={(e) => updateGalleryItem(index, itemIdx, 'description', e.target.value)} placeholder="Descrição Alt/Acessibilidade (Opcional)" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none"/>
                                </div>
                                <div className="md:col-span-1 flex justify-end pt-1">
                                  <button type="button" onClick={() => removeItemFromGallery(index, itemIdx)} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"><FaTrash size={10}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                  {components.length === 0 && (
                    <div className="p-8 border border-dashed border-slate-800 text-center text-xs text-slate-500 rounded-2xl">Nenhum componente avançado na fila. Clique nos botões acima para construir seu layout V2.</div>
                  )}
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* PAINEL CLÁSSICO ANTIGO                                    */
              /* ========================================================= */
              <>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-1">Conteúdo da Mensagem (Texto Simples)</h3>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Opcional se houver um embed válido com título ou descrição configurado abaixo..." rows={3} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-900/20 p-2 rounded-xl">
                    <span className="text-sm font-bold text-slate-300">Lista de Embeds ({embeds.length}/10)</span>
                    <button type="button" onClick={addEmbed} disabled={embeds.length >= 10} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 font-bold text-xs rounded-lg disabled:opacity-30"><FaPlus size={10}/> Adicionar Novo Embed</button>
                  </div>

                  {embeds.map((emb, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 relative animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Embed #{index + 1}</span>
                        <button type="button" onClick={() => removeEmbed(index)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><FaTrash size={12}/></button>
                      </div>

                      <div className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 block"><FaUser size={10} className="inline mr-1"/> Autor (Opcional)</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input type="text" value={emb.authorName} onChange={(e) => updateEmbed(index, 'authorName', e.target.value)} placeholder="Nome do Autor" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/>
                          <input type="text" value={emb.authorIcon} onChange={(e) => updateEmbed(index, 'authorIcon', e.target.value)} placeholder="URL do Ícone" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/>
                          <input type="text" value={emb.authorUrl} onChange={(e) => updateEmbed(index, 'authorUrl', e.target.value)} placeholder="URL do Link" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={emb.title} onChange={(e) => updateEmbed(index, 'title', e.target.value)} placeholder="Título do Embed" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>
                        <input type="text" value={emb.url} onChange={(e) => updateEmbed(index, 'url', e.target.value)} placeholder="URL do Link do Título" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>
                      </div>

                      <textarea value={emb.description} onChange={(e) => updateEmbed(index, 'description', e.target.value)} placeholder="Descrição do Embed..." rows={3} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <input type="text" value={emb.image} onChange={(e) => updateEmbed(index, 'image', e.target.value)} placeholder="URL Imagem (Grande)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>
                        <input type="text" value={emb.thumbnail} onChange={(e) => updateEmbed(index, 'thumbnail', e.target.value)} placeholder="URL Thumbnail (Pequena)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                          <input type="color" value={emb.color} onChange={(e) => updateEmbed(index, 'color', e.target.value)} className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"/>
                          <span className="text-xs font-mono text-slate-400 uppercase">{emb.color}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400"><FaInfoCircle size={10} className="inline mr-1"/> Campos Modulares</span>
                          <button type="button" onClick={() => addFieldToEmbed(index)} className="px-2 py-1 bg-slate-800 text-slate-300 font-semibold text-[10px] rounded-md hover:bg-slate-700">+ Adicionar Campo</button>
                        </div>
                        {emb.fields.map((f, fIdx) => (
                          <div key={fIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <div className="md:col-span-5"><input type="text" value={f.name} onChange={(e) => updateFieldInEmbed(index, fIdx, 'name', e.target.value)} placeholder="Nome" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/></div>
                            <div className="md:col-span-5"><input type="text" value={f.value} onChange={(e) => updateFieldInEmbed(index, fIdx, 'value', e.target.value)} placeholder="Valor" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/></div>
                            <div className="md:col-span-1 text-center"><label className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f.inline} onChange={(e) => updateFieldInEmbed(index, fIdx, 'inline', e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-emerald-500 w-3.5 h-3.5"/><span className="text-[10px] text-slate-400">Inline</span></label></div>
                            <div className="md:col-span-1 flex justify-end"><button type="button" onClick={() => removeFieldFromEmbed(index, fIdx)} className="text-rose-500 p-1 hover:bg-rose-500/10 rounded"><FaTrash size={10}/></button></div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 block">Rodapé (Footer)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input type="text" value={emb.footerText} onChange={(e) => updateEmbed(index, 'footerText', e.target.value)} placeholder="Texto do Rodapé" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/>
                          <input type="text" value={emb.footerIcon} onChange={(e) => updateEmbed(index, 'footerIcon', e.target.value)} placeholder="URL do Ícone do Rodapé" className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs"/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
            <button onClick={() => router.push(`/server/${guildId}`)} className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs tracking-wide flex items-center gap-2">
              {saving ? <><FaSpinner className="animate-spin" size={13}/><span>Salvando...</span></> : <><FaSave size={13}/><span>Salvar Alterações</span></>}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
}