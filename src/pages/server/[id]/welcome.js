// pages/server/[id]/welcome.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaPlus, FaTrash, FaCube, FaListAlt, FaFileAlt, FaSlidersH, FaImages, FaAlignLeft, FaUser, FaInfoCircle, FaHashtag
} from 'react-icons/fa';

export default function WelcomePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  // Estados principais
  const [guild, setGuild] = useState(null);
  const [channels, setChannels] = useState([]); // Lista de canais buscada do bot
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState(''); // Armazena apenas o ID do canal selecionado
  const [isV2, setIsV2] = useState(false);

  // Estados dos Modos
  const [content, setContent] = useState('');
  const [embeds, setEmbeds] = useState([]);
  const [components, setComponents] = useState([]);

  // UI States
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
        
        // 1. Validar servidor do usuário
        const guildsResponse = await fetch(`/api/user-guilds`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
        const guildsData = await guildsResponse.json();
        if (!guildsResponse.ok || !guildsData.success) throw new Error('Erro ao buscar dados do servidor');
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado.');
        setGuild(foundGuild);

        // 2. Buscar canais de texto reais do servidor usando a nova rota
        const channelsRes = await fetch(`/api/guild/${guildId}/channels`);
        const channelsData = await channelsRes.json();
        if (channelsRes.ok && channelsData.success) {
          setChannels(channelsData.channels || []);
        }

        // 3. Carregar configurações salvas
        const response = await fetch(`/api/guild/${guildId}/welcome`);
        if (!response.ok) throw new Error('Erro ao carregar dados de Boas-vindas.');
        
        const data = await response.json();
        setEnabled(!!data?.enabled); 
        setChannelId(data?.channelId || '');
        
        const loadedIsV2 = !!data?.isV2;
        setIsV2(loadedIsV2);

        if (data?.message) {
          if (loadedIsV2) {
            setComponents(data.message.components || []);
          } else {
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

  // Modos de gerenciamento V2
  const handleActivateV2 = () => {
    setIsV2(true); setContent(''); setEmbeds([]);
  };

  const addComponentV2 = (type) => {
    let newComp = { type };
    if (type === 10) newComp.content = '';
    else if (type === 13) newComp.file = { url: '' };
    else if (type === 12) newComp.items = [];
    setComponents([...components, newComp]);
  };

  const removeComponentV2 = (index) => setComponents(components.filter((_, i) => i !== index));
  const updateComponentValue = (index, key, value) => {
    const updated = [...components]; updated[index][key] = value; setComponents(updated);
  };
  const updateComponentFile = (index, value) => {
    const updated = [...components]; updated[index].file = { url: value }; setComponents(updated);
  };
  const updateSeparatorComponent = (index, field, value) => {
    const updated = [...components];
    if (value === "" || value === undefined) delete updated[index][field];
    else updated[index][field] = value;
    setComponents(updated);
  };

  // Itens da Galeria (Type 12)
  const addItemToGallery = (compIndex) => {
    const updated = [...components]; updated[compIndex].items = [...updated[compIndex].items, { media: { url: '' }, description: '' }]; setComponents(updated);
  };
  const removeItemFromGallery = (compIndex, itemIndex) => {
    const updated = [...components]; updated[compIndex].items = updated[compIndex].items.filter((_, i) => i !== itemIndex); setComponents(updated);
  };
  const updateGalleryItem = (compIndex, itemIndex, key, value) => {
    const updated = [...components];
    if (key === 'url') updated[compIndex].items[itemIndex].media = { url: value };
    else updated[compIndex].items[itemIndex][key] = value;
    setComponents(updated);
  };

  // Métodos Clássicos redundantes mantidos por segurança
  const addEmbed = () => setEmbeds([...embeds, { title: '', description: '', url: '', color: '#5865F2', fields: [] }]);
  const updateEmbed = (idx, k, v) => { const u = [...embeds]; u[idx][k] = v; setEmbeds(u); };

  const handleSave = async () => {
    try {
      setError(null); setSuccess(null);

      if (enabled) {
        if (!channelId) throw new Error('Selecione um canal de texto de destino.');

        if (!isV2) {
          const hasContent = content.trim().length > 0;
          const hasValidEmbed = embeds.some(emb => emb.title.trim().length > 0 || emb.description.trim().length > 0);
          if (!hasContent && !hasValidEmbed) throw new Error('Obrigatório: Configure um texto ou Embed válido.');
        } else {
          for (let i = 0; i < components.length; i++) {
            const comp = components[i];
            if (comp.type === 10 && !comp.content?.trim()) throw new Error(`Componente #${i + 1} (Text Display) sem conteúdo.`);
            if (comp.type === 13 && !comp.file?.url?.trim()) throw new Error(`Componente #${i + 1} (File) sem URL de anexo.`);
            if (comp.type === 12) {
              if (comp.items.length === 0) throw new Error(`Componente #${i + 1} (Galeria) precisa de pelo menos 1 item.`);
              for (let j = 0; j < comp.items.length; j++) {
                if (!comp.items[j].media?.url?.trim()) throw new Error(`Galeria #${i + 1}, Item #${j + 1}: URL em falta.`);
              }
            }
          }
        }
      }

      setSaving(true);
      const finalMessage = {};

      if (isV2) {
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
        if (content.trim()) finalMessage.content = content.trim();
        if (embeds.length > 0) {
          finalMessage.embeds = embeds.map(emb => ({
            title: emb.title.trim() || undefined,
            description: emb.description.trim() || undefined,
            color: parseInt(emb.color.replace('#', ''), 16) || 5814783
          }));
        }
      }

      const response = await fetch(`/api/guild/${guildId}/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, channelId, isV2, message: finalMessage })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || 'Erro ao gravar as configurações.');
      }
      
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
          {/* Módulo Ativo */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-200">Ativar Módulo de Boas-vindas</h3>
              <p className="text-slate-400 text-xs mt-0.5">Controla se o envio de saudações automáticas nativas do bot está ativo.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer"/>
              <div className="w-12 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-600 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className={`space-y-5 ${enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
            {/* Alternador de Estrutura */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mapeamento de Renderização</span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2 mt-1">
                  {isV2 ? <><FaCube className="text-indigo-400"/> Componentes v2 Ativo</> : <><FaListAlt className="text-emerald-400"/> Formulário Clássico Ativo</>}
                </span>
              </div>
              <div className="flex gap-2">
                {!isV2 ? (
                  <button type="button" onClick={handleActivateV2} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl hover:opacity-90 flex items-center gap-1.5 shadow-md shadow-indigo-950/50">
                    <FaCube size={12}/> Mudar para Componentes v2
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsV2(false)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl">
                    Voltar ao Clássico
                  </button>
                )}
              </div>
            </div>

            {/* SELETOR DE CANAIS DO BOT - SUBSTITUIU O WEBHOOK */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                <FaHashtag className="text-slate-400"/> Canal de Destino da Mensagem
              </h3>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none cursor-pointer">
                <option value="">-- Selecione um canal de texto --</option>
                {channels.map((chan) => (
                  <option key={chan.id} value={chan.id}>
                    #{chan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* INTERFACE DO MODO V2 */}
            {isV2 ? (
              <div className="space-y-4">
                <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Inserir Sub-Componentes Nativos V2</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button type="button" onClick={() => addComponentV2(10)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaAlignLeft className="text-indigo-400"/>Text Display</button>
                    <button type="button" onClick={() => addComponentV2(13)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaFileAlt className="text-blue-400"/>File Attachment</button>
                    <button type="button" onClick={() => addComponentV2(14)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaSlidersH className="text-amber-400"/>Separator</button>
                    <button type="button" onClick={() => addComponentV2(12)} className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaImages className="text-purple-400"/>Media Gallery</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {components.map((comp, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 relative animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Bloco #{index + 1}</span>
                        <button type="button" onClick={() => removeComponentV2(index)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><FaTrash size={12}/></button>
                      </div>

                      {comp.type === 10 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Conteúdo do Bloco de Texto (Markdown)</label>
                          <textarea value={comp.content} onChange={(e) => updateComponentValue(index, 'content', e.target.value)} placeholder="# Texto em destaque..." rows={4} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>
                        </div>
                      )}

                      {comp.type === 13 && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">URL do Arquivo Anexo (file.url)</label>
                          <input type="text" value={comp.file?.url || ''} onChange={(e) => updateComponentFile(index, e.target.value)} placeholder="attachment://game.zip" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"/>
                        </div>
                      )}

                      {comp.type === 14 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Divider (Linha Divisória)</label>
                            <select value={comp.divider === undefined ? "" : String(comp.divider)} onChange={(e) => updateSeparatorComponent(index, 'divider', e.target.value === "" ? undefined : e.target.value === "true")} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                              <option value="">Não enviado (Opcional)</option>
                              <option value="true">Sim (True)</option>
                              <option value="false">Não (False)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Spacing (Espaçamento)</label>
                            <select value={comp.spacing || ""} onChange={(e) => updateSeparatorComponent(index, 'spacing', e.target.value === "" ? undefined : Number(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                              <option value="">Não enviado (Opcional)</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {comp.type === 12 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-slate-950/40 p-2 border border-slate-800/50 rounded-lg">
                            <span className="text-[11px] font-bold text-slate-400">Itens da Galeria ({comp.items?.length || 0})</span>
                            <button type="button" onClick={() => addItemToGallery(index)} className="px-2 py-1 bg-indigo-600/20 text-indigo-400 font-bold text-[10px] rounded">+ Adicionar Item</button>
                          </div>
                          <div className="space-y-3">
                            {comp.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start border-b border-slate-800/40 pb-2 last:border-0">
                                <div className="md:col-span-5">
                                  <input type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItem(index, itemIdx, 'url', e.target.value)} placeholder="URL da Mídia" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none"/>
                                </div>
                                <div className="md:col-span-6">
                                  <input type="text" value={item.description || ''} onChange={(e) => updateGalleryItem(index, itemIdx, 'description', e.target.value)} placeholder="Descrição Alt" className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none"/>
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
                </div>
              </div>
            ) : (
              /* INTERFACE CLÁSSICA */
              <>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-1">Conteúdo da Mensagem</h3>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-900/20 p-2 rounded-xl">
                    <span className="text-sm font-bold text-slate-300">Embeds ({embeds.length}/10)</span>
                    <button type="button" onClick={addEmbed} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 text-xs font-bold rounded-lg">+ Novo Embed</button>
                  </div>
                  {embeds.map((emb, idx) => (
                    <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <input type="text" value={emb.title} onChange={(e) => updateEmbed(idx, 'title', e.target.value)} placeholder="Título" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"/>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
            <button onClick={() => router.push(`/server/${guildId}`)} className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs">
              {saving ? <FaSpinner className="animate-spin inline mr-1"/> : null} Salvar Modificações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}