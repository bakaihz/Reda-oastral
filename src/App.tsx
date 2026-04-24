import { useState, useEffect, useRef, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, ArrowRight, Sparkles, BookOpen, Clock, LogOut, 
  ChevronRight, Save, Trash2, ExternalLink, LayoutGrid, 
  FileText, CheckCircle2, AlertCircle, Loader2, X, 
  ChevronLeft, Wand2, History, Settings, Info, Eye, EyeOff
} from 'lucide-react';

// Custom Discord Icon SVG
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export default function App() {
  const [ra, setRa] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeLimits, setTimeLimits] = useState({ min: '40', max: '90' });
  const [isEditingTime, setIsEditingTime] = useState(false);
  
  // Saved Accounts State
  const [savedAccounts, setSavedAccounts] = useState<{ra: string, pass: string}[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth & Data State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [userNick, setUserNick] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [essays, setEssays] = useState<any[]>([]);
  const [aggregatedEssays, setAggregatedEssays] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedEssays, setSelectedEssays] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState<Record<string, 'pending' | 'processing' | 'success' | 'error'>>({});
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');

  // Writing View State
  const [selectedEssay, setSelectedEssay] = useState<any | null>(null);
  const [essayDetails, setEssayDetails] = useState<any | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [generatedEssay, setGeneratedEssay] = useState<{titulo: string, texto: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Session Persistence
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedNick = localStorage.getItem('user_nick');
    const savedLimits = localStorage.getItem('time_limits');
    
    if (savedToken && savedNick) {
      setAuthToken(savedToken);
      setUserNick(savedNick);
      setIsLoggedIn(true);
      if (savedLimits) {
        setTimeLimits(JSON.parse(savedLimits));
      }
    }
  }, []);

  const handleLogin = async (e: FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!ra || !password) {
      setMessage({ type: 'error', text: 'RA e senha são obrigatórios.' });
      return false;
    }
    
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: ra, senha: password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('auth_token', String(data.auth_token));
        localStorage.setItem('user_nick', String(data.nick || ra));
        setIsLoggedIn(true);
        setAuthToken(String(data.auth_token));
        setUserNick(String(data.nick || ra));
        setMessage({ type: 'success', text: 'Login realizado com sucesso!' });
        return true;
      } else {
        setMessage({ type: 'error', text: data.error || 'Falha no login.' });
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAccounts(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading saved accounts:', error);
      setSavedAccounts([]);
    }
  }, []);

  const removeAccount = (raToRemove: string) => {
    try {
      const updated = savedAccounts.filter(acc => acc && acc.ra !== raToRemove);
      localStorage.setItem('saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };

  const fetchRooms = async () => {
    if (!authToken) return;
    
    try {
      const response = await fetch('/api/rooms', {
        headers: { 'x-api-key': authToken }
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return [];
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing JSON:', text);
        return [];
      }
      const roomsArray = Array.isArray(data) ? data : (data.rooms || data.results || data.data || []);
      
      if (Array.isArray(roomsArray)) {
        setRooms(roomsArray);
        if (roomsArray.length > 0 && !selectedRoom) {
          setSelectedRoom(roomsArray[0].name);
        }
        return roomsArray;
      }
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  };

  const fetchUserRooms = async () => {
    if (!authToken) return;
    setIsFetchingData(true);
    setMessage({ type: 'success', text: 'Buscando redações em todas as salas...' });

    try {
      // 1. Get all rooms
      const allRooms = await fetchRooms();
      let allAggregated: any[] = [];

      if (allRooms.length === 0) {
        console.warn('[Frontend] No rooms found.');
      }

      // 2. Coletar todos os 'publication_targets' possíveis
      const allTargets: string[] = [];
      const roomMap: Record<string, any> = {};

      for (const room of allRooms) {
        if (!room) continue;
        
        if (room.name) {
           allTargets.push(room.name);
           // Also add combination if userNick is available (e.g., roomname:userid)
           if (userNick) {
             const userSlug = userNick.replace(/\s+/g, '').toLowerCase();
             const finalSlug = userSlug.endsWith('sp') ? userSlug : userSlug + '-sp';
             allTargets.push(`${room.name}:${finalSlug}`);
           }
           roomMap[room.name] = room;
        }
        if (room.id) {
           allTargets.push(room.id.toString());
           roomMap[room.id.toString()] = room;
        }

        // Adicionar subjects/disciplinas se existirem
        if (room.subjects && Array.isArray(room.subjects)) {
           room.subjects.forEach((sub: any) => {
              if (sub.id) allTargets.push(sub.id.toString());
           });
        }
        
        // NOVO: Adicionando IDs das `group_categories` baseados no JSON oficial
        if (room.group_categories && Array.isArray(room.group_categories)) {
           room.group_categories.forEach((cat: any) => {
              if (cat.id) {
                allTargets.push(cat.id.toString());
                roomMap[cat.id.toString()] = cat;
              }
           });
        }
      }

      // 3. Fazer requisição única otimizada passando todos os targets no estilo da API oficial
      console.log(`[Frontend] Fetching essays for ${allTargets.length} extracted targets...`);
      
      const queryParams = new URLSearchParams();
      allTargets.forEach(target => queryParams.append('publication_target', target));

      const response = await fetch(`/api/tms/task/todo?${queryParams.toString()}`, {
        headers: { 'x-api-key': authToken }
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      const data = await response.json();
      let essaysArray = Array.isArray(data) ? data : (data.results || data.data || data.tasks || data.items || []);
      
      console.log(`[Frontend] Master fetch returned ${essaysArray.length} total essays`);

      if (Array.isArray(essaysArray) && essaysArray.length > 0) {
        // Find best room match for each essay
        const essaysWithRoom = essaysArray.map(e => {
           let matchedRoom = null;
           if (e.publication_target) {
              const baseTarget = e.publication_target.split(':')[0];
              matchedRoom = roomMap[baseTarget] || roomMap[e.publication_target];
           }
           return {
             ...e,
             roomName: matchedRoom ? matchedRoom.name : (e.publication_target || 'N/A'),
             roomId: matchedRoom ? matchedRoom.id : null
           };
        });
        allAggregated = essaysWithRoom;
      }

      setAggregatedEssays(allAggregated);
      setSelectedEssays(new Set());
      setBatchStatus({});
      setShowSelectionModal(true);
      
      if (allAggregated.length === 0) {
        setMessage({ type: 'error', text: 'Nenhuma redação pendente encontrada em nenhuma sala.' });
      } else {
        setMessage({ type: 'success', text: `${allAggregated.length} redações encontradas!` });
      }
    } catch (error) {
      console.error('Error in fetchUserRooms:', error);
      setMessage({ type: 'error', text: 'Erro ao buscar redações.' });
    } finally {
      setIsFetchingData(false);
    }
  };

  const fetchEssays = async (roomName: string) => {
    if (!authToken || !roomName) return;
    setIsFetchingData(true);

    try {
      // Usaremos a super-query de qualquer forma para não perder tarefas
      const room = rooms.find(r => r.name === roomName) || rooms[0];
      const allTargets: string[] = [];
      
      const allRoomsToScan = rooms; // Vamos varrer todas as salas para garantir
      
      for (const r of allRoomsToScan) {
        if (!r) continue;
        if (r.name) {
           allTargets.push(r.name);
           if (userNick) {
             const userSlug = userNick.replace(/\s+/g, '').toLowerCase();
             const finalSlug = userSlug.endsWith('sp') ? userSlug : userSlug + '-sp';
             allTargets.push(`${r.name}:${finalSlug}`);
           }
        }
        if (r.id) allTargets.push(r.id.toString());
        if (r.subjects && Array.isArray(r.subjects)) r.subjects.forEach((s: any) => s.id && allTargets.push(s.id.toString()));
        if (r.group_categories && Array.isArray(r.group_categories)) {
           r.group_categories.forEach((cat: any) => {
              if (cat.id) allTargets.push(cat.id.toString());
           });
        }
      }

      console.log(`[Frontend] FetchEssays mega-query with ${allTargets.length} targets...`);
      const queryParams = new URLSearchParams();
      // Remover duplicatas
      Array.from(new Set(allTargets)).forEach(target => queryParams.append('publication_target', target));

      const response = await fetch(`/api/tms/task/todo?${queryParams.toString()}`, {
        headers: { 'x-api-key': authToken }
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      const data = await response.json();
      let essaysArray = Array.isArray(data) ? data : (data.results || data.data || data.tasks || data.items || []);
      
      if (Array.isArray(essaysArray)) {
        setEssays(essaysArray);
      }
    } catch (error) {
      console.error('Error fetching essays:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    let text = html.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
    // Replace images with [IMAGEM]
    text = text.replace(/<img[^>]*>/gi, ' [IMAGEM] ');
    // Remove all other tags
    text = text.replace(/<[^>]*>/g, '');
    // Decode entities (basic)
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return text.trim();
  };

  const getEssayContext = (details: any) => {
    if (!details) return '';
    const q = details.questions?.[0];
    const support = q?.options?.support_text || '';
    const statement = q?.statement || '';
    const desc = details.description || '';
    const legacy = details.essay_motivation_texts?.map((t: any, idx: number) => `TEXTO ${idx + 1}: ${stripHtml(t.text)}`).join('\n') || '';
    return `INSTRUÇÕES/GERAL:\n${stripHtml(support)}\n\nCOLETÂNEA/ENUNCIADO:\n${stripHtml(statement)}\n\nDESCRIÇÃO:\n${stripHtml(desc)}\n\n${legacy}`.trim();
  };

  const handleBatchProcess = async () => {
    if (selectedEssays.size === 0) return;
    setIsBatchProcessing(true);
    
    const essayArray = aggregatedEssays.filter(e => selectedEssays.has(e.id));
    setBatchProgress({ current: 0, total: essayArray.length });
    
    const newStatus = { ...batchStatus };
    essayArray.forEach(e => newStatus[e.id] = 'pending');
    setBatchStatus(newStatus);

    for (let i = 0; i < essayArray.length; i++) {
      const essay = essayArray[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      setBatchStatus(prev => ({ ...prev, [essay.id]: 'processing' }));
      
      try {
        const detailsRes = await fetch(`/api/tms/task/${essay.id}/apply?room_id=${encodeURIComponent(essay.publication_target)}`, {
          headers: { 'x-api-key': authToken }
        });
        if (!detailsRes.ok) throw new Error(`Fetch failed: ${detailsRes.status}`);
        const details = await detailsRes.json();
        console.log(`[Batch] Details for task ${essay.id}:`, JSON.stringify(details).substring(0, 500));

        const question = details.questions?.[0];
        if (!question) {
            console.error(`[Batch] No questions found for task ${essay.id}`);
            setBatchStatus(prev => ({ ...prev, [essay.id]: 'error' }));
            continue;
        }

        // 2. Build Prompt
        const prompt = getEssayContext(details);

        // 3. Generate AI
        const aiRes = await fetch('/api/gerar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            genero: question?.options?.genre?.statement || "Dissertativo-argumentativo",
            contexto: prompt
          })
        });
        const aiData = await aiRes.json();
        
        // Pós-processamento
        const titulo = (aiData.titulo || '').replace(/\*/g, '').trim();
        const texto = (aiData.texto || '').replace(/\n{3,}/g, '\n\n').trim();

        // 4. Save Draft (Complete)
        const saveRes = await fetch('/api/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: essay.id,
            question_id: question.id,
            room_for_apply: essay.publication_target,
            auth_token: authToken,
            titulo: titulo,
            texto: texto,
            answer_id: essay.answer_id
          })
        });
        
        if (saveRes.ok) {
          setBatchStatus(prev => ({ ...prev, [essay.id]: 'success' }));
        } else {
          setBatchStatus(prev => ({ ...prev, [essay.id]: 'error' }));
        }
      } catch (error) {
        console.error(`Error processing essay ${essay.id}:`, error);
        setBatchStatus(prev => ({ ...prev, [essay.id]: 'error' }));
      }
    }
    
    setIsBatchProcessing(false);
    setTimeout(() => {
      if (selectedRoom) fetchEssays(selectedRoom);
    }, 2000);
  };

  const toggleEssaySelection = (id: string) => {
    const newSelected = new Set(selectedEssays);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEssays(newSelected);
  };

  const selectAllEssays = () => {
    if (selectedEssays.size === aggregatedEssays.length) {
      setSelectedEssays(new Set());
    } else {
      setSelectedEssays(new Set(aggregatedEssays.map(e => e.id)));
    }
  };

  const handleStartEssay = async (essay: any) => {
    setSelectedEssay(essay);
    setIsFetchingDetails(true);
    try {
      const roomParam = essay.roomName || selectedRoom;
      const response = await fetch(`/api/tms/task/${essay.id}/apply?room_id=${encodeURIComponent(roomParam)}`, {
        headers: { 'x-api-key': authToken }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setEssayDetails(data);
    } catch (error) {
      console.error('Error fetching essay details:', error);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleAutoGenerateAndSaveDraft = async () => {
    if (!essayDetails || !selectedEssay) return;
    setIsGenerating(true);
    try {
      setMessage({ type: 'success', text: 'Iniciando manifesto IA...' });
      
      const prompt = getEssayContext(essayDetails);
      const generoStr = essayDetails.questions?.[0]?.options?.genre?.statement || essayDetails.essay_genre_name || "Dissertativo-argumentativo";

      const response = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          genero: generoStr,
          contexto: prompt
        })
      });
      const data = await response.json();
      setGeneratedEssay(data);

      const saveResponse = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedEssay.id,
          question_id: essayDetails.questions?.[0]?.id,
          room_for_apply: selectedRoom,
          auth_token: authToken,
          titulo: data.titulo,
          texto: data.texto,
          answer_id: selectedEssay.answer?.id || selectedEssay.answer_id,
          apply_moment: selectedEssay.answer?.accessed_on || selectedEssay.apply_moment
        })
      });
      const saveData = await saveResponse.json();
      
      if (saveData.success) {
        setMessage({ type: 'success', text: 'Suas redações já foram salvas em rascunho' });
        setTimeout(() => {
          setSelectedEssay(null);
          setGeneratedEssay(null);
          setEssayDetails(null);
          fetchEssays(selectedRoom);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: saveData.error || 'Erro ao salvar rascunho.' });
      }
    } catch (error) {
      console.error('Error auto-generating and saving:', error);
      setMessage({ type: 'error', text: 'Erro ao processar a requisição.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedEssay || !essayDetails || !generatedEssay?.texto) {
        setMessage({ type: 'error', text: 'Nenhuma redação para finalizar. Gere ou escreva primeiro.' });
        return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedEssay.id,
          question_id: essayDetails.questions?.[0]?.id,
          room_for_apply: selectedRoom,
          auth_token: authToken,
          titulo: generatedEssay.titulo,
          texto: generatedEssay.texto,
          answer_id: selectedEssay.answer_id
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Redação finalizada com sucesso!' });
        setTimeout(() => {
          setSelectedEssay(null);
          setGeneratedEssay(null);
          setEssayDetails(null);
          fetchEssays(selectedRoom);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao finalizar.' });
      }
    } catch (error) {
      console.error('Error finalizing essay:', error);
      setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasFetchedRooms = useRef(false);

  useEffect(() => {
    if (isLoggedIn && authToken && !hasFetchedRooms.current) {
      hasFetchedRooms.current = true;
      fetchRooms();
    }
  }, [isLoggedIn, authToken]);

  useEffect(() => {
    if (selectedRoom) {
      fetchEssays(selectedRoom);
    }
  }, [selectedRoom]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_nick');
    setIsLoggedIn(false);
    setAuthToken('');
    setEssays([]);
    setRooms([]);
    setSelectedRoom('');
    setSelectedEssay(null);
  };

  const stats = useMemo(() => {
    return {
      total: essays.length,
      pending: essays.filter(e => e.answer_status?.toLowerCase() === 'pending').length,
      drafts: essays.filter(e => e.answer_status?.toLowerCase() === 'draft').length
    };
  }, [essays]);

  if (isLoggedIn) {
    return (
      <div className="relative min-h-screen w-full bg-[#020617] overflow-x-hidden font-sans text-white flex atmosphere-bg">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 border-r border-[#1e293b] bg-[#020617]/50 backdrop-blur-2xl flex flex-col z-30 sticky top-0 h-screen shadow-2xl">
          <div className="p-6 flex items-center gap-3">
            <div className="p-2 bg-[#2563eb]/20 rounded-xl border border-[#3b82f6]/30">
              <Sparkles className="w-6 h-6 text-[#60a5fa]" />
            </div>
            <h1 className="hidden lg:block text-xl font-display font-medium tracking-tight">
              Astral <span className="text-[#3b82f6]">SP</span>
            </h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <button 
              onClick={() => {setActiveTab('dashboard'); setSelectedEssay(null);}}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white'}`}
            >
              <LayoutGrid className="w-6 h-6" />
              <span className="hidden lg:block font-medium text-sm tracking-wide">Dashboard</span>
            </button>
            <button 
              onClick={() => {setActiveTab('history'); setSelectedEssay(null);}}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white'}`}
            >
              <History className="w-6 h-6" />
              <span className="hidden lg:block font-medium text-sm tracking-wide">Rascunhos</span>
            </button>
            <button 
              onClick={() => {setActiveTab('settings'); setSelectedEssay(null);}}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white'}`}
            >
              <Settings className="w-6 h-6" />
              <span className="hidden lg:block font-medium text-sm tracking-wide">Configurações</span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="hidden lg:flex items-center gap-3 p-3 mb-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                {userNick.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userNick}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Estudante Astral</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-6 h-6" />
              <span className="hidden lg:block font-bold text-sm">Sair</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 z-10">
          {/* Header */}
          <header className="h-20 border-b border-[#1e293b] bg-[#020617]/40 backdrop-blur-3xl flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              {selectedEssay && (
                <button 
                  onClick={() => {setSelectedEssay(null); setGeneratedEssay(null); setEssayDetails(null);}}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-xl font-display font-bold text-white">
                {selectedEssay ? 'Escrevendo Redação' : activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'history' ? 'Meus Rascunhos' : 'Configurações'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 px-6 py-2 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-inner shadow-black/50">
                <div className="text-center">
                  <p className="meta-label mb-1">Total</p>
                  <p className="text-sm font-mono tracking-tight text-white">{stats.total}</p>
                </div>
                <div className="w-px h-8 bg-[#1e293b]" />
                <div className="text-center">
                  <p className="meta-label mb-1 text-blue-400">Pendentes</p>
                  <p className="text-sm font-mono tracking-tight text-blue-400">{stats.pending}</p>
                </div>
                <div className="w-px h-8 bg-[#1e293b]" />
                <div className="text-center">
                  <p className="meta-label mb-1 text-amber-500">Rascunhos</p>
                  <p className="text-sm font-mono tracking-tight text-amber-400">{stats.drafts}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowTimeModal(true)}
                className="p-3 bg-[#1e293b]/50 hover:bg-[#2563eb]/20 border border-[#1e293b] hover:border-[#3b82f6]/50 rounded-xl text-blue-400 transition-all shadow-lg shadow-black/20"
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {selectedEssay ? (
                <motion.div 
                  key="writing-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-6xl mx-auto"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Reference */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="glass-card rounded-3xl p-8">
                        <div className="mb-8">
                          <h3 className="text-2xl font-display font-bold text-white mb-4 leading-tight">{selectedEssay.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
                              {essayDetails?.essay_genre_name || 'Carregando...'}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg border border-white/10">
                              {essayDetails?.min_words || 0} - {essayDetails?.max_words || 0} palavras
                            </span>
                          </div>
                        </div>

                        {isFetchingDetails ? (
                          <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm">Buscando detalhes do universo...</p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <section>
                              <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Enunciado da Missão
                              </h4>
                              <div className="text-sm text-gray-300 leading-relaxed bg-black/40 rounded-2xl p-6 border border-white/5">
                                {essayDetails?.description}
                              </div>
                            </section>

                            <section>
                              <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Textos de Apoio
                              </h4>
                              <div className="space-y-4">
                                {essayDetails?.essay_motivation_texts?.map((text: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-400 leading-relaxed italic bg-white/5 rounded-2xl p-6 border-l-4 border-blue-500/50">
                                    {text.text}
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Editor */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="glass-card rounded-3xl p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-display font-medium text-white flex items-center gap-3">
                            <Wand2 className="w-6 h-6 text-[#3b82f6]" />
                            Editor Astral
                          </h3>
                          <div className="flex gap-3">
                            <button 
                              onClick={handleAutoGenerateAndSaveDraft}
                              disabled={isGenerating || isFetchingDetails || isLoading}
                              className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] active:scale-95 text-xs tracking-wide"
                            >
                              {isGenerating || isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              Fazer em Rascunho
                            </button>
                            <button
                              onClick={handleFinalize}
                              disabled={isGenerating || isFetchingDetails || isLoading}
                              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-green-600/20 active:scale-95 text-xs tracking-wide"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Finalizar
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 space-y-4">
                          {generatedEssay ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-4 h-full flex flex-col"
                            >
                              <input 
                                value={generatedEssay.titulo || ''}
                                onChange={(e) => setGeneratedEssay({...generatedEssay, titulo: e.target.value})}
                                className="w-full bg-[#020617]/50 border border-[#1e293b] rounded-2xl p-4 text-xl font-display font-medium text-white focus:outline-none focus:border-[#3b82f6] transition-all"
                                placeholder="Título da sua obra..."
                              />
                              <textarea 
                                value={generatedEssay.texto || ''}
                                onChange={(e) => setGeneratedEssay({...generatedEssay, texto: e.target.value})}
                                className="flex-1 w-full min-h-[500px] bg-[#020617]/50 border border-[#1e293b] rounded-2xl p-6 text-sm text-[#94a3b8] leading-relaxed focus:outline-none focus:border-[#3b82f6] resize-none custom-scrollbar transition-all"
                                placeholder="Comece a escrever ou use a IA para guiar seus pensamentos..."
                              />
                            </motion.div>
                          ) : (
                            <div className="flex-1 border-2 border-dashed border-[#1e293b] rounded-3xl flex flex-col items-center justify-center text-center p-12 text-[#94a3b8]">
                              <div className="w-20 h-20 bg-[#1e293b]/50 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                <Sparkles className="w-10 h-10 text-[#3b82f6]/50" />
                              </div>
                              <h4 className="text-lg font-medium text-[#f8fafc] mb-2">Editor Vazio</h4>
                              <p className="text-sm max-w-sm mb-6">Use o botão <strong className="text-[#3b82f6]">Fazer em Rascunho</strong> para manifestar sua redação com IA automaticamente.</p>
                              <button 
                                onClick={() => setGeneratedEssay({ titulo: '', texto: '' })}
                                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] hover:underline transition-all"
                              >
                                Ou comece a escrever manualmente
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'dashboard' ? (
                <motion.div 
                  key="dashboard-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Room Selection Sidebar/Bar */}
                  <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
                    {Array.isArray(rooms) && rooms.map((room) => room && (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.name)}
                        className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
                          selectedRoom === room.name 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {String(room.name)}
                      </button>
                    ))}
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card rounded-3xl p-6 flex items-center gap-6">
                      <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/20">
                        <BookOpen className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Pendentes</p>
                        <p className="text-3xl font-display font-bold text-white">{stats.pending}</p>
                      </div>
                    </div>
                    <div className="glass-card rounded-3xl p-6 flex items-center gap-6">
                      <div className="p-4 bg-amber-600/20 rounded-2xl border border-amber-500/20">
                        <FileText className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rascunhos</p>
                        <p className="text-3xl font-display font-bold text-white">{stats.drafts}</p>
                      </div>
                    </div>
                    <div className="glass-card rounded-3xl p-6 flex items-center gap-6">
                      <div className="p-4 bg-green-600/20 rounded-2xl border border-green-500/20">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Concluídas</p>
                        <p className="text-3xl font-display font-bold text-white">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Essay Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                        <LayoutGrid className="w-6 h-6 text-blue-400" />
                        Redações Disponíveis
                      </h3>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={fetchUserRooms}
                          disabled={isFetchingData}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          {isFetchingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Redação Pendente
                        </button>
                        <button 
                          onClick={() => {
                            setAggregatedEssays(essays);
                            setShowSelectionModal(true);
                          }}
                          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-sm font-bold transition-all flex items-center gap-2"
                        >
                          <Wand2 className="w-4 h-4" />
                          Processar em Lote
                        </button>
                      </div>
                    </div>

                    {isFetchingData ? (
                      <div className="py-32 flex flex-col items-center justify-center text-gray-500 gap-6">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">Sincronizando com o universo acadêmico...</p>
                      </div>
                    ) : (Array.isArray(essays) && essays.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {essays.map((essay, idx) => essay && (
                          <motion.div
                            key={essay.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card p-6 flex flex-col h-full group"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className={`px-2 py-[2px] rounded text-[9px] font-mono font-bold uppercase tracking-widest ${
                                essay.answer_status === 'draft' ? 'bg-[#111] text-amber-500 border border-[#333]' : 'bg-[#111] text-blue-500 border border-blue-500/30'
                              }`}>
                                {essay.answer_status === 'draft' ? 'RASCUNHO' : 'PENDENTE'}
                              </div>
                              <p className="data-value text-[10px]">ID:{essay.id}</p>
                            </div>
                            
                            <h4 className="text-sm font-sans font-medium text-[#ededed] mb-8 line-clamp-2 leading-relaxed group-hover:text-blue-500 transition-colors">
                              {essay.title}
                            </h4>

                            <div className="mt-auto pt-4 border-t border-[#2a2a2a] flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[#8e9299]">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="meta-label">7 DIAS</span>
                              </div>
                              <button 
                                onClick={() => handleStartEssay(essay)}
                                className="p-2 bg-[#111] hover:bg-blue-600 rounded-lg text-[#8e9299] hover:text-white transition-all border border-[#2a2a2a] hover:border-blue-500 active:scale-95"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="glass-card rounded-2xl py-32 flex flex-col items-center justify-center text-center px-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                        <div className="w-20 h-20 bg-[#111] rounded-2xl border border-[#333] flex items-center justify-center mb-8 shadow-inner shadow-black/50">
                          <BookOpen className="w-8 h-8 text-neutral-600" />
                        </div>
                        <h3 className="text-2xl font-mono tracking-tight text-white mb-2 uppercase opacity-80">0 RESULTADOS ENCONTRADOS</h3>
                        <p className="text-[#8e9299] max-w-sm text-sm font-sans tracking-wide">Sem redações pendentes neste escopo. A plataforma não retornou tarefas ativas.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : activeTab === 'history' ? (
                <motion.div 
                  key="history-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Filter only drafts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {essays.filter(e => e.answer_status === 'draft').map((essay, idx) => (
                      <motion.div
                        key={essay.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card rounded-3xl p-6 flex flex-col group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/20">
                            Rascunho
                          </span>
                          <p className="text-[10px] text-gray-600 font-bold">ID: {essay.id}</p>
                        </div>
                        <h4 className="text-lg font-display font-bold text-white mb-6 line-clamp-2">{essay.title}</h4>
                        <button 
                          onClick={() => handleStartEssay(essay)}
                          className="w-full py-3 bg-white/5 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/30 rounded-2xl text-sm font-bold text-gray-400 hover:text-amber-400 transition-all flex items-center justify-center gap-2"
                        >
                          Continuar Editando
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {essays.filter(e => e.answer_status === 'draft').length === 0 && (
                      <div className="col-span-full py-32 text-center">
                        <p className="text-gray-500">Nenhum rascunho encontrado.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="settings-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <div className="glass-card rounded-3xl p-8 space-y-8">
                    <section>
                      <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-400" />
                        Prazos de Entrega
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1">Tempo Mínimo (min)</label>
                          <input 
                            type="number" 
                            value={timeLimits.min}
                            onChange={(e) => setTimeLimits({...timeLimits, min: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-display font-bold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1">Tempo Máximo (min)</label>
                          <input 
                            type="number" 
                            value={timeLimits.max}
                            onChange={(e) => setTimeLimits({...timeLimits, max: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-display font-bold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="pt-8 border-t border-white/5">
                      <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-3">
                        <User className="w-6 h-6 text-blue-400" />
                        Perfil do Estudante
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-sm text-gray-400">Nome de Exibição</span>
                          <span className="text-sm font-bold text-white">{userNick}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-sm text-gray-400">RA</span>
                          <span className="text-sm font-bold text-white">{ra}</span>
                        </div>
                      </div>
                    </section>

                    <button 
                      onClick={() => {
                        localStorage.setItem('time_limits', JSON.stringify(timeLimits));
                        setMessage({ type: 'success', text: 'Configurações salvas!' });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-astral" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-astral" style={{ animationDelay: '-5s' }} />
        
        {/* Stars/Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.2, scale: 0.5 }}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Discord Button */}
        <div className="absolute top-0 right-6 md:-right-12">
          <button 
            onClick={() => setShowDiscordModal(true)}
            className="p-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-full text-indigo-400 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-600/10"
          >
            <DiscordIcon className="w-6 h-6" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 animate-float">
            <Sparkles className="w-10 h-10 text-blue-400 text-glow" />
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-white mb-3">
            Redação <span className="text-blue-500">Astral SP</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-wide uppercase text-[10px]">Manifeste sua excelência acadêmica</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass border border-slate-200 rounded-[30px] p-10 shadow-lg relative overflow-hidden w-full max-w-md"
        >
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message.text}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {String(message.text)}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <label className="meta-label ml-1">Registro Acadêmico (RA)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#94a3b8] group-focus-within:text-[#3b82f6] transition-colors" />
                </div>
                <input
                  type="text"
                  value={ra}
                  onChange={(e) => setRa(e.target.value)}
                  className="block w-full pl-14 pr-5 py-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-white placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all font-mono tracking-tight"
                  placeholder="Seu RA (ex: 123456789sp)"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="meta-label ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#94a3b8] group-focus-within:text-[#3b82f6] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-14 pr-12 py-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-white placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-all font-mono tracking-tight"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94a3b8] hover:text-[#3b82f6] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                // Perform login first
                const success = await handleLogin(new Event('submit') as any);
                
                // If login successful, fetch rooms then essays
                if (success) {
                  const rooms = await fetchRooms();
                  if (rooms && rooms.length > 0) {
                      setShowSelectionModal(true);
                      fetchEssays(rooms[0].name);
                  } else {
                    setMessage({ type: 'error', text: 'Nenhuma sala encontrada.' });
                  }
                }
              }}
              className="relative w-full group overflow-hidden rounded-2xl bg-[#2563eb] py-4 font-bold text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Redações pendentes
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSavedModal(true)}
                className="w-full py-2 text-[10px] font-bold text-gray-600 hover:text-blue-400 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Save className="w-3.5 h-3.5" />
                Contas Salvas ({savedAccounts.length})
              </button>
            )}
          </form>
        </motion.div>

      {/* Selection Modal (Batch Processing) */}
      <AnimatePresence mode="wait">
        {showSelectionModal && (
          <div key="selection-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#020617]/90 backdrop-blur-md">
            <motion.div
              key="selection-modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-[#1e293b] rounded-[30px] p-10 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent"></div>
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-display font-medium text-white mb-2">Redações Pendentes</h3>
                  <p className="text-[#94a3b8] text-sm">Escolha uma redação abaixo para começar a escrever.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="meta-label">Min</label>
                    <input type="number" className="w-16 p-1 bg-[#1e293b]/50 border border-[#1e293b] rounded text-[#f8fafc] text-xs font-mono focus:border-[#3b82f6] focus:outline-none" placeholder="0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="meta-label">Max</label>
                    <input type="number" className="w-16 p-1 bg-[#1e293b]/50 border border-[#1e293b] rounded text-[#f8fafc] text-xs font-mono focus:border-[#3b82f6] focus:outline-none" placeholder="60" />
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowDiscordModal(true)} className="p-2 hover:bg-[#1e293b] rounded-full transition-colors text-[#94a3b8] hover:text-[#3b82f6]">
                      <DiscordIcon className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => !isBatchProcessing && setShowSelectionModal(false)} 
                      className="p-2 hover:bg-[#1e293b] rounded-full transition-colors text-[#94a3b8] hover:text-[#f8fafc]"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
              </div>

              {isBatchProcessing && (
                <div className="mb-8 space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-blue-400">Progresso da Manifestação</span>
                    <span className="text-gray-500">{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6 px-2">
                <span className="meta-label">
                  {aggregatedEssays.length} redações encontradas
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-4 custom-scrollbar mb-8">
                {aggregatedEssays.length > 0 ? (
                  aggregatedEssays.map((essay) => (
                    <div 
                      key={essay.id}
                      className="flex items-center gap-5 p-5 rounded-2xl border transition-all bg-[#1e293b]/30 border-[#1e293b] hover:bg-[#1e293b]/60 hover:border-[#3b82f6]/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-sans font-medium text-white truncate group-hover:text-[#3b82f6] transition-colors">{essay.title}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="data-value text-[10px]">ID:{essay.id}</span>
                          <span className="meta-label text-[#3b82f6]/70">• {essay.publication_target}</span>
                          <span className={`meta-label ${essay.answer_status === 'draft' ? 'text-amber-500' : 'text-[#3b82f6]'}`}>
                            • {essay.answer_status === 'draft' ? 'RASCUNHO' : 'PENDENTE'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowSelectionModal(false);
                          console.log('Fazer Redação clicked for:', essay.id);
                        }}
                        className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                      >
                        Fazer
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-gray-500">
                    <p className="text-lg font-bold text-gray-400 mb-2">Nenhuma redação pendente!</p>
                    <p className="text-sm">No momento, não há redações pendentes para processar.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Saved Accounts Modal */}
        <AnimatePresence mode="wait">
          {showSavedModal && (
            <div key="saved-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                key="saved-modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Save className="w-5 h-5 text-blue-400" />
                    Contas Salvas
                  </h3>
                  <button onClick={() => setShowSavedModal(false)} className="text-gray-500 hover:text-white">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.isArray(savedAccounts) && savedAccounts.map((acc, idx) => acc && (
                    <div key={idx} className="flex items-center gap-2 group">
                      <button
                        onClick={() => {
                          setRa(acc.ra || '');
                          setPassword(acc.pass || '');
                          setShowSavedModal(false);
                        }}
                        className="flex-1 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                            {(String(acc.ra || '??')).substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-300">{String(acc.ra)}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </button>
                      <button 
                        onClick={() => removeAccount(acc.ra)}
                        className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Discord Modal */}
        <AnimatePresence mode="wait">
          {showDiscordModal && (
            <div key="discord-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                key="discord-modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)]"
              >
                <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 mx-auto border border-indigo-500/20">
                  <DiscordIcon className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Comunidade Astral</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Junte-se ao nosso servidor no Discord para suporte, novidades e dicas astrais.
                </p>
                <div className="flex flex-col gap-3">
                  <a
                    href="https://discord.gg/jcHYPNMGX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-indigo-600 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-600 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    style={{ backgroundColor: '#5865F2', color: 'white' }}
                  >
                    Entrar no Servidor
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setShowDiscordModal(false)}
                    className="w-full py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-xs text-gray-600 uppercase tracking-widest font-medium"
        >
          Feito por bakai
        </motion.p>
      </div>
    </div>
  );
}
