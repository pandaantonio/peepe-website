// pages/server/[id]/welcome.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar';
import { 
  FaArrowLeft, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaPlus, FaTrash, FaCube, FaListAlt, FaFileAlt, FaSlidersH, FaImages, FaAlignLeft, FaHashtag, FaThLarge, FaLink, FaPalette, FaFolderPlus
} from 'react-icons/fa';

export default function WelcomePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { data: session, status } = useSession();

  const [guild, setGuild] = useState(null);
  const [channels, setChannels] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [isV2, setIsV2] = useState(false);

  // Estados Clássicos (V1)
  const [content, setContent] = useState('');
  const [embeds, setEmbeds] = useState([]);
  
  // Estado Dinâmico dos Componentes V2
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
        setLoading(true); setError(null);
        
        const guildsResponse = await fetch(`/api/user-guilds`, { headers: { 'Authorization': `Bearer ${session?.accessToken}` } });
        const guildsData = await guildsResponse.json();
        if (!guildsResponse.ok || !guildsData.success) throw new Error('Erro ao buscar dados do servidor');
        
        const foundGuild = guildsData.guilds?.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado.');
        setGuild(foundGuild);

        const channelsRes = await fetch(`/api/guild/${guildId}/channels`);
        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          if (channelsData?.success) setChannels(channelsData.channels || []);
        }

        const response = await fetch(`/api/guild/${guildId}/welcome`);
        if (!response.ok) throw new Error('Erro ao carregar dados de Boas-vindas.');
        
        const data = await response.json();
        setEnabled(!!data?.enabled); 
        setChannelId(data?.channelId || '');
        const loadedIsV2 = !!data?.isV2;
        setIsV2(loadedIsV2);

        if (data?.message) {
          if (loadedIsV2) {
            const mapped = (data.message.components || []).map(c => {
              if (c.type === 17) {
                return {
                  ...c,
                  _ui_hex: c.accent_color ? '#' + c.accent_color.toString(16).padStart(6, '0') : '#5865F2',
                  _has_color: c.accent_color !== undefined
                };
              }
              return c;
            });
            setComponents(mapped);
          } else {
            setContent(data.message.content || '');
            if (data.message.embeds && Array.isArray(data.message.embeds)) {
              setEmbeds(data.message.embeds.map(emb => ({
                title: emb.title || '', description: emb.description || '', color: emb.color ? '#' + emb.color.toString(16).padStart(6, '0') : '#5865F2'
              })));
            }
          }
        }
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    if (session?.accessToken) fetchData();
  }, [guildId, session, status, router]);

  // Criar Componente de Primeiro Nível (Raiz)
  const addComponentV2 = (type) => {
    let newComp = { type };
    if (type === 10) newComp.content = '';
    else if (type === 13) newComp.file = { url: '' };
    else if (type === 12) newComp.items = [];
    else if (type === 9) { newComp.components = []; newComp.accessory = null; }
    else if (type === 17) { newComp.components = []; newComp._ui_hex = '#5865F2'; newComp._has_color = false; }
    setComponents([...components, newComp]);
  };

  const removeComponentV2 = (index) => setComponents(components.filter((_, i) => i !== index));
  const updateComponentValue = (index, key, value) => {
    const updated = [...components]; updated[index][key] = value; setComponents(updated);
  };

  // Gerenciamento de Subcomponentes (Dentro de Container Raiz ou Section Raiz)
  const addSubComponentToNested = (parentIdx, type) => {
    const updated = [...components];
    let newSub = { type };
    if (type === 10) newSub.content = '';
    else if (type === 13) newSub.file = { url: '' };
    else if (type === 12) newSub.items = [];
    if (type === 9) { newSub.components = []; newSub.accessory = null; } // Permite Section dentro de Container!
    
    updated[parentIdx].components = [...(updated[parentIdx].components || []), newSub];
    setComponents(updated);
  };

  const removeSubComponentFromNested = (parentIdx, subIdx) => {
    const updated = [...components];
    updated[parentIdx].components = updated[parentIdx].components.filter((_, i) => i !== subIdx);
    setComponents(updated);
  };

  const updateSubComponentValue = (parentIdx, subIdx, key, value) => {
    const updated = [...components];
    updated[parentIdx].components[subIdx][key] = value;
    setComponents(updated);
  };

  // Gerenciamento de Sub-Subcomponentes (Exclusivo para uma Section que está DENTRO de um Container)
  const addDeepSubToSectionInsideContainer = (containerIdx, sectionIdx, type) => {
    const updated = [...components];
    let newDeepSub = { type };
    if (type === 10) newDeepSub.content = '';
    else if (type === 13) newDeepSub.file = { url: '' };
    else if (type === 12) newDeepSub.items = [];
    
    const targetSection = updated[containerIdx].components[sectionIdx];
    targetSection.components = [...(targetSection.components || []), newDeepSub];
    setComponents(updated);
  };

  const removeDeepSubFromSectionInsideContainer = (containerIdx, sectionIdx, deepIdx) => {
    const updated = [...components];
    const targetSection = updated[containerIdx].components[sectionIdx];
    targetSection.components = targetSection.components.filter((_, i) => i !== deepIdx);
    setComponents(updated);
  };

  const updateDeepSubValueInsideContainer = (containerIdx, sectionIdx, deepIdx, key, value) => {
    const updated = [...components];
    updated[containerIdx].components[sectionIdx].components[deepIdx][key] = value;
    setComponents(updated);
  };

  // Funções de Controle de Acessórios (Sections globais ou aninhadas)
  const updateSectionAccessoryType = (index, accType, isInsideContainer = false, containerIdx = null) => {
    const updated = [...components];
    let target;
    if (!isInsideContainer) {
      target = updated[index];
    } else {
      target = updated[containerIdx].components[index];
    }

    if (accType === "") target.accessory = null;
    else if (accType === "11") target.accessory = { type: 11, media: { url: "" } };
    else if (accType === "2") target.accessory = { type: 2, style: 5, label: "", url: "" };
    
    setComponents(updated);
  };

  const updateSectionAccessoryFields = (index, key, value, subKey = null, isInsideContainer = false, containerIdx = null) => {
    const updated = [...components];
    let target;
    if (!isInsideContainer) {
      target = updated[index];
    } else {
      target = updated[containerIdx].components[index];
    }

    if (subKey) {
      if (!target.accessory[key]) target.accessory[key] = {};
      target.accessory[key][subKey] = value;
    } else {
      target.accessory[key] = value;
    }
    setComponents(updated);
  };

  // Controle de Cor do Container
  const toggleContainerColor = (index, hasColor) => {
    const updated = [...components]; updated[index]._has_color = hasColor; setComponents(updated);
  };

  // Galerias de Mídia de múltiplos níveis
  const addGalleryItem = (compIdx, isSub = false, subIdx = null, isDeep = false, containerIdx = null) => {
    const updated = [...components];
    const newItem = { media: { url: '' } };
    if (!isSub) {
      updated[compIdx].items = [...(updated[compIdx].items || []), newItem];
    } else if (!isDeep) {
      updated[compIdx].components[subIdx].items = [...(updated[compIdx].components[subIdx].items || []), newItem];
    } else {
      updated[containerIdx].components[compIdx].components[subIdx].items = [...(updated[containerIdx].components[compIdx].components[subIdx].items || []), newItem];
    }
    setComponents(updated);
  };

  const updateGalleryItemMedia = (compIdx, itemIdx, val, isSub = false, subIdx = null, isDeep = false, containerIdx = null) => {
    const updated = [...components];
    if (!isSub) {
      updated[compIdx].items[itemIdx].media = { url: val };
    } else if (!isDeep) {
      updated[compIdx].components[subIdx].items[itemIdx].media = { url: val };
    } else {
      updated[containerIdx].components[compIdx].components[subIdx].items[itemIdx].media = { url: val };
    }
    setComponents(updated);
  };

  // Processador e Construtor do Payload de Envio (POST)
  const handleSave = async () => {
    try {
      setError(null); setSuccess(null);
      if (enabled && !channelId) throw new Error('Selecione um canal de texto de destino.');

      setSaving(true);
      const finalMessage = {};

      if (isV2) {
        finalMessage.flags = 32768;
        
        // Função limpa para mapear qualquer Section (seja na raiz ou profunda)
        const mapSectionPayload = (sectionObject) => {
          const sBase = { type: 9 };
          sBase.components = (sectionObject.components || []).map(sub => {
            const subBase = { type: sub.type };
            if (sub.type === 10) subBase.content = sub.content?.trim();
            if (sub.type === 13) subBase.file = { url: sub.file?.url?.trim() };
            if (sub.type === 14 && sub.spacing !== undefined) subBase.spacing = sub.spacing;
            if (sub.type === 12) {
              subBase.items = sub.items?.map(i => ({ media: { url: i.media?.url?.trim() } })) || [];
            }
            return subBase;
          });
          if (sectionObject.accessory) {
            sBase.accessory = { type: sectionObject.accessory.type };
            if (sectionObject.accessory.type === 11) {
              sBase.accessory.media = { url: sectionObject.accessory.media?.url?.trim() };
            } else if (sectionObject.accessory.type === 2) {
              sBase.accessory.style = 5;
              sBase.accessory.label = sectionObject.accessory.label?.trim();
              sBase.accessory.url = sectionObject.accessory.url?.trim();
            }
          }
          return sBase;
        };

        finalMessage.components = components.map(comp => {
          const base = { type: comp.type };
          if (comp.type === 10) base.content = comp.content?.trim();
          if (comp.type === 13) base.file = { url: comp.file?.url?.trim() };
          if (comp.type === 14 && comp.spacing !== undefined) base.spacing = comp.spacing;
          if (comp.type === 12) base.items = comp.items?.map(i => ({ media: { url: i.media?.url?.trim() } })) || [];
          
          if (comp.type === 9) return mapSectionPayload(comp);

          if (comp.type === 17) {
            if (comp._has_color && comp._ui_hex) base.accent_color = parseInt(comp._ui_hex.replace('#', ''), 16);
            base.components = (comp.components || []).map(sub => {
              // Se for uma Section dentro do Container
              if (sub.type === 9) return mapSectionPayload(sub);
              
              const subBase = { type: sub.type };
              if (sub.type === 10) subBase.content = sub.content?.trim();
              if (sub.type === 13) subBase.file = { url: sub.file?.url?.trim() };
              if (sub.type === 14 && sub.spacing !== undefined) subBase.spacing = sub.spacing;
              if (sub.type === 12) subBase.items = sub.items?.map(i => ({ media: { url: i.media?.url?.trim() } })) || [];
              return subBase;
            });
          }
          return base;
        });
      } else {
        if (content.trim()) finalMessage.content = content.trim();
        if (embeds.length > 0) finalMessage.embeds = embeds.map(emb => ({ title: emb.title.trim() || undefined, color: parseInt(emb.color.replace('#', ''), 16) || 5814783 }));
      }

      const response = await fetch(`/api/guild/${guildId}/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, channelId, isV2, message: finalMessage })
      });

      if (!response.ok) { const resData = await response.json(); throw new Error(resData.error || 'Erro ao salvar.'); }
      setSuccess('Configurações salvas perfeitamente!');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center"><div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-24">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-36">
        <button onClick={() => router.push(`/server/${guildId}`)} className="group inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-slate-200">
          <FaArrowLeft size={11} /> <span>Voltar ao Dashboard</span>
        </button>

        {success && <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3"><FaCheckCircle size={16}/><span>{success}</span></div>}
        {error && <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3"><FaExclamationTriangle size={16}/><span>{error}</span></div>}

        <div className="space-y-5">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Ativar Sistema de Boas-vindas</h3>
              <p className="text-slate-400 text-xs mt-0.5">Mensagens dinâmicas baseadas em componentes nativos v2.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer"/>
              <div className="w-12 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-600 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className={`space-y-5 ${enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2"><FaHashtag size={13}/> Canal de Destino</h3>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                <option value="">-- Escolha um canal de texto --</option>
                {channels.map(chan => <option key={chan.id} value={chan.id}>#{chan.name}</option>)}
              </select>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                {isV2 ? <><FaCube className="text-indigo-400"/> Modo Componentes v2 Ativo</> : <><FaListAlt className="text-emerald-400"/> Formato Clássico Ativo</>}
              </span>
              <button type="button" onClick={() => setIsV2(!isV2)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl">
                {isV2 ? "Alternar para Clássico" : "Alternar para Modo V2"}
              </button>
            </div>

            {isV2 ? (
              <div className="space-y-5">
                {/* Construtor Superior */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-bold text-indigo-400 block mb-3 uppercase tracking-wider">Adicionar Elemento V2 Raiz</span>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <button type="button" onClick={() => addComponentV2(10)} className="py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaAlignLeft className="text-indigo-400"/>Text Display</button>
                    <button type="button" onClick={() => addComponentV2(13)} className="py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaFileAlt className="text-blue-400"/>File Anexo</button>
                    <button type="button" onClick={() => addComponentV2(14)} className="py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaSlidersH className="text-amber-400"/>Separator</button>
                    <button type="button" onClick={() => addComponentV2(12)} className="py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaImages className="text-purple-400"/>Gallery</button>
                    <button type="button" onClick={() => addComponentV2(9)} className="py-2 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex flex-col items-center gap-2"><FaThLarge className="text-emerald-400"/>Section</button>
                    <button type="button" onClick={() => addComponentV2(17)} className="py-2 px-2 bg-indigo-950/40 border border-indigo-800/80 rounded-xl text-xs font-bold text-indigo-300 flex flex-col items-center gap-2"><FaFolderPlus className="text-indigo-400"/>Container</button>
                  </div>
                </div>

                {/* Listagem Geral de Blocos do Canvas */}
                <div className="space-y-4">
                  {components.map((comp, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          Bloco #{index + 1} - {comp.type === 9 ? 'SECTION' : comp.type === 17 ? 'CONTAINER' : 'ELEMENTO'}
                        </span>
                        <button type="button" onClick={() => removeComponentV2(index)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><FaTrash size={12}/></button>
                      </div>

                      {/* TEXT DISPLAY RAIZ */}
                      {comp.type === 10 && (
                        <textarea value={comp.content} onChange={(e) => updateComponentValue(index, 'content', e.target.value)} placeholder="Texto..." rows={3} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"/>
                      )}

                      {/* SECTION RAIZ (SOLTA) */}
                      {comp.type === 9 && (
                        <div className="space-y-4 bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                          {/* Menu Interno da Section */}
                          <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-300">Subcomponentes da Section</span>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => addSubComponentToNested(index, 10)} className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[10px]">+ Text</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 13)} className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[10px]">+ File</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 14)} className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[10px]">+ Separator</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 12)} className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[10px]">+ Gallery</button>
                            </div>
                          </div>
                          {/* Renderizador de Filhos da Section */}
                          <div className="space-y-2 border-l border-emerald-500/20 pl-3">
                            {comp.components?.map((sub, sIdx) => (
                              <div key={sIdx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
                                <div className="flex justify-between"><span className="text-[10px] text-slate-500">Sub #{sIdx+1}</span><button type="button" onClick={() => removeSubComponentFromNested(index, sIdx)} className="text-rose-400"><FaTrash size={10}/></button></div>
                                {sub.type === 10 && <textarea value={sub.content} onChange={(e) => updateSubComponentValue(index, sIdx, 'content', e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"/>}
                                {sub.type === 13 && <input type="text" value={sub.file?.url || ''} onChange={(e) => { const updated = [...components]; updated[index].components[sIdx].file = { url: e.target.value }; setComponents(updated); }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none" placeholder="URL do Arquivo"/>}
                                {sub.type === 14 && <select value={sub.spacing || ''} onChange={(e) => updateSubComponentValue(index, sIdx, 'spacing', e.target.value === '' ? undefined : Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300"><option value="">Normal</option><option value="1">1</option><option value="2">2</option></select>}
                                {sub.type === 12 && (
                                  <div className="space-y-1">
                                    <button type="button" onClick={() => addGalleryItem(index, true, sIdx)} className="text-[10px] text-indigo-400">+ Add Imagem</button>
                                    {sub.items?.map((item, itemIdx) => <input key={itemIdx} type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItemMedia(index, itemIdx, e.target.value, true, sIdx)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-300" placeholder="URL"/>)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Acessório da Section */}
                          <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Accessory</span>
                            <select value={comp.accessory?.type || ""} onChange={(e) => updateSectionAccessoryType(index, e.target.value)} className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 px-2 py-1"><option value="">Nenhum</option><option value="11">Thumbnail (11)</option><option value="2">Link Button (2)</option></select>
                          </div>
                          {comp.accessory?.type === 11 && <input type="text" value={comp.accessory.media?.url || ""} onChange={(e) => updateSectionAccessoryFields(index, 'media', e.target.value, 'url')} placeholder="URL da Imagem" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none"/>}
                          {comp.accessory?.type === 2 && (
                            <div className="grid grid-cols-2 gap-2"><input type="text" value={comp.accessory.label || ""} onChange={(e) => updateSectionAccessoryFields(index, 'label', e.target.value)} placeholder="Texto" className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300"/><input type="text" value={comp.accessory.url || ""} onChange={(e) => updateSectionAccessoryFields(index, 'url', e.target.value)} placeholder="Link Https" className="bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300"/></div>
                          )}
                        </div>
                      )}

                      {/* CONTAINER (SISTEMA MULTI-NÍVEL EXPANSIVO) */}
                      {comp.type === 17 && (
                        <div className="space-y-4 bg-indigo-950/10 p-4 rounded-xl border border-indigo-500/20">
                          {/* Topo do Container com Cor */}
                          <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl">
                            <div className="flex items-center gap-2 scale-90">
                              <span className="text-xs font-bold text-slate-300 flex items-center gap-1"><FaPalette/> Cor Lateral</span>
                              <input type="checkbox" checked={comp._has_color} onChange={(e) => toggleContainerColor(index, e.target.checked)}/>
                              {comp._has_color && <input type="color" value={comp._ui_hex || '#5865F2'} onChange={(e) => updateComponentValue(index, '_ui_hex', e.target.value)} className="w-6 h-6 border-none bg-transparent cursor-pointer"/>}
                            </div>
                            {/* ADIÇÃO DO BOTÃO + SECTION DENTRO DO CONTAINER */}
                            <div className="flex gap-1 scale-90 origin-right">
                              <button type="button" onClick={() => addSubComponentToNested(index, 10)} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold">+ Text</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 13)} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold">+ File</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 14)} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold">+ Sep</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 12)} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold">+ Gall</button>
                              <button type="button" onClick={() => addSubComponentToNested(index, 9)} className="px-2 py-1 bg-indigo-900 text-indigo-200 rounded border border-indigo-700 text-[10px] font-extrabold flex items-center gap-1"><FaThLarge size={8}/>+ Section</button>
                            </div>
                          </div>

                          {/* Renderização de Subcomponentes do Container */}
                          <div className="space-y-3 border-l-2 border-indigo-500/30 pl-4">
                            {comp.components?.map((sub, sIdx) => (
                              <div key={sIdx} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2 relative">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                    Sub #{sIdx + 1} - {sub.type === 9 ? 'SECTION INTERNAL' : `TIPO ${sub.type}`}
                                  </span>
                                  <button type="button" onClick={() => removeSubComponentFromNested(index, sIdx)} className="text-rose-400"><FaTrash size={10}/></button>
                                </div>

                                {/* Se o subcomponente for elementos normais */}
                                {sub.type === 10 && <textarea value={sub.content} onChange={(e) => updateSubComponentValue(index, sIdx, 'content', e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none" placeholder="Texto dentro do container..."/>}
                                {sub.type === 13 && <input type="text" value={sub.file?.url || ''} onChange={(e) => { const updated = [...components]; updated[index].components[sIdx].file = { url: e.target.value }; setComponents(updated); }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none" placeholder="URL do Arquivo Anexo"/>}
                                {sub.type === 14 && <select value={sub.spacing || ''} onChange={(e) => updateSubComponentValue(index, sIdx, 'spacing', e.target.value === '' ? undefined : Number(e.target.value))} className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-300"><option value="">Espaçamento</option><option value="1">1</option><option value="2">2</option></select>}
                                {sub.type === 12 && (
                                  <div className="space-y-1">
                                    <button type="button" onClick={() => addGalleryItem(index, true, sIdx)} className="text-[10px] text-indigo-400">+ Add Imagem</button>
                                    {sub.items?.map((item, itemIdx) => <input key={itemIdx} type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItemMedia(index, itemIdx, e.target.value, true, sIdx)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-300" placeholder="URL da imagem"/>)}
                                  </div>
                                )}

                                {/* SE FOR UMA SECTION COLOQUÍVEL DENTRO DO CONTAINER (ANINHAMENTO SEGUNDO NÍVEL) */}
                                {sub.type === 9 && (
                                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Estrutura Interna da Seção</span>
                                      <div className="flex gap-1 scale-90 origin-right">
                                        <button type="button" onClick={() => addDeepSubToSectionInsideContainer(index, sIdx, 10)} className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-300">+ Text</button>
                                        <button type="button" onClick={() => addDeepSubToSectionInsideContainer(index, sIdx, 13)} className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-300">+ File</button>
                                        <button type="button" onClick={() => addDeepSubToSectionInsideContainer(index, sIdx, 12)} className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] text-slate-300">+ Gall</button>
                                      </div>
                                    </div>

                                    {/* Lista de sub-subelementos ultra profundos */}
                                    <div className="space-y-2 pl-3 border-l border-slate-800">
                                      {sub.components?.map((deep, dIdx) => (
                                        <div key={dIdx} className="bg-slate-950 p-2 rounded border border-slate-900/60 relative space-y-1">
                                          <div className="flex justify-between text-[9px] text-slate-500"><span>Elemento Interno #{dIdx+1}</span><button type="button" onClick={() => removeDeepSubFromSectionInsideContainer(index, sIdx, dIdx)} className="text-rose-400">Remover</button></div>
                                          {deep.type === 10 && <textarea value={deep.content || ""} onChange={(e) => updateDeepSubValueInsideContainer(index, sIdx, dIdx, 'content', e.target.value)} rows={1} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 focus:outline-none"/>}
                                          {deep.type === 13 && <input type="text" value={deep.file?.url || ""} onChange={(e) => { const updated = [...components]; updated[index].components[sIdx].components[dIdx].file = { url: e.target.value }; setComponents(updated); }} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 focus:outline-none" placeholder="URL do Arquivo"/>}
                                          {deep.type === 12 && (
                                            <div className="space-y-1">
                                              <button type="button" onClick={() => addGalleryItem(sIdx, true, dIdx, true, index)} className="text-[9px] text-indigo-400">+ Adicionar Link</button>
                                              {deep.items?.map((item, itemIdx) => <input key={itemIdx} type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItemMedia(sIdx, itemIdx, e.target.value, true, dIdx, true, index)} className="w-full bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px] text-slate-300" placeholder="URL da Mídia"/>)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Acessório da Seção profunda */}
                                    <div className="border-t border-slate-900 pt-2 flex flex-col gap-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">Acessório da Seção</span>
                                        <select value={sub.accessory?.type || ""} onChange={(e) => updateSectionAccessoryType(sIdx, e.target.value, true, index)} className="bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 px-1 py-0.5"><option value="">Nenhum</option><option value="11">Thumbnail</option><option value="2">Link Button</option></select>
                                      </div>
                                      {sub.accessory?.type === 11 && <input type="text" value={sub.accessory.media?.url || ""} onChange={(e) => updateSectionAccessoryFields(sIdx, 'media', e.target.value, 'url', true, index)} placeholder="URL da Imagem Lateral" className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300 focus:outline-none"/>}
                                      {sub.accessory?.type === 2 && (
                                        <div className="grid grid-cols-2 gap-1"><input type="text" value={sub.accessory.label || ""} onChange={(e) => updateSectionAccessoryFields(sIdx, 'label', e.target.value, null, true, index)} placeholder="Texto Botão" className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300"/><input type="text" value={sub.accessory.url || ""} onChange={(e) => updateSectionAccessoryFields(sIdx, 'url', e.target.value, null, true, index)} placeholder="Link Https" className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300"/></div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                      {/* Fallbacks Raiz para itens Legados */}
                      {comp.type === 13 && <input type="text" value={comp.file?.url || ''} onChange={(e) => { const updated = [...components]; updated[index].file = { url: e.target.value }; setComponents(updated); }} placeholder="URL do Arquivo" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>}
                      {comp.type === 12 && (
                        <div className="space-y-2">
                          <button type="button" onClick={() => addGalleryItem(index)} className="text-xs text-indigo-400">+ Adicionar Imagem</button>
                          {comp.items?.map((item, iIdx) => <input key={iIdx} type="text" value={item.media?.url || ''} onChange={(e) => updateGalleryItemMedia(index, iIdx, e.target.value)} placeholder="URL da Imagem" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs"/>)}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mensagem clássica..." rows={3} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs resize-none focus:outline-none"/>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs">
              {saving ? <FaSpinner className="animate-spin inline mr-1"/> : null} Salvar Modificações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}