
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  CheckCircle,
  Send,
  User,
  ArrowRight,
  X,
  Zap,
  Download,
  Moon,
  Sun,
  Copy,
  Trophy,
  Crown,
  Instagram,
  ShieldCheck,
  UserPlus,
  Activity,
  MoreVertical,
  Smartphone,
  Server,
  Laptop,
  Circle,
  Key
} from 'lucide-react';
import { Plan, AppSettings, Lead, Message, RankLevel, Reseller } from './types';
import { INITIAL_PLANS, DEFAULT_SETTINGS } from './constants';
import { generateBotResponse } from './services/geminiService';
import { PlanCard } from './components/PlanCard';
import { AdminLogin } from './components/AdminLogin';

export default function App() {
  // Persistence
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('bluebot_plans_final');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('bluebot_settings_final');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('bluebot_leads_final');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'admin'>('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  // Conversational Form State
  const [chatStep, setChatStep] = useState(0); 
  // steps: 0: idle, 1: name, 2: wa, 3: mode, 4: project, 5: link, 6: add bot/ok
  const [tempLeadData, setTempLeadData] = useState({
    name: '', whatsapp: '', city: '', neighborhood: '', projectName: '', groupLink: '', purpose: ''
  });

  const [newReseller, setNewReseller] = useState({ name: '', whatsapp: '' });

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: `Opa! Sou o BLUE Bot Vendas. 💙\n\nAqui você pode escolher seu plano de aluguel de bot para WhatsApp.\n\nEscolha um plano na vitrine para começar o seu pedido!`, 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [lastWAText, setLastWAText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('bluebot_plans_final', JSON.stringify(plans));
    localStorage.setItem('bluebot_settings_final', JSON.stringify(settings));
    localStorage.setItem('bluebot_leads_final', JSON.stringify(leads));
  }, [plans, settings, leads]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  const resellerRanks = useMemo(() => {
    const counts: Record<string, { count: number, name: string }> = {};
    counts[settings.ownerNumber] = { count: 0, name: settings.ownerName };
    settings.authorizedResellers.forEach(res => {
      counts[res.whatsapp] = { count: 0, name: res.name };
    });
    leads.forEach(lead => {
      const normalizedWA = lead.whatsapp.replace(/\D/g, '');
      if (counts[normalizedWA]) counts[normalizedWA].count += 1;
    });
    return Object.entries(counts).map(([whatsapp, data]) => {
      let rank: RankLevel = 'Bronze';
      if (whatsapp === settings.ownerNumber) rank = 'Dono';
      else if (data.count >= 50) rank = 'Diamante';
      else if (data.count >= 20) rank = 'Platina';
      else if (data.count >= 10) rank = 'Ouro';
      else if (data.count >= 5) rank = 'Prata';
      return { whatsapp, name: data.name, sales: data.count, rank };
    }).sort((a, b) => b.sales - a.sales);
  }, [leads, settings]);

  const getRankColor = (rank: RankLevel) => {
    switch (rank) {
      case 'Dono': return 'border-blue-500 text-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'Diamante': return 'border-cyan-400 text-cyan-400 bg-cyan-400/10';
      case 'Platina': return 'border-purple-400 text-purple-400 bg-purple-400/10';
      case 'Ouro': return 'border-yellow-400 text-yellow-400 bg-yellow-400/10';
      case 'Prata': return 'border-slate-300 text-slate-300 bg-slate-300/10';
      default: return 'border-orange-700 text-orange-700 bg-orange-700/10';
    }
  };

  const triggerSaveFeedback = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const addNewReseller = () => {
    if (!newReseller.name || !newReseller.whatsapp) return;
    const reseller: Reseller = {
      id: Date.now().toString(),
      name: newReseller.name,
      whatsapp: newReseller.whatsapp.replace(/\D/g, ''),
      isActive: true
    };
    setSettings(prev => ({
      ...prev,
      authorizedResellers: [...prev.authorizedResellers, reseller]
    }));
    triggerSaveFeedback("Revendedor Adicionado!");
    setNewReseller({ name: '', whatsapp: '' });
  };

  const removeReseller = (id: string) => {
    setSettings(prev => ({
      ...prev,
      authorizedResellers: prev.authorizedResellers.filter(r => r.id !== id)
    }));
    triggerSaveFeedback("Revendedor Removido!");
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const userInput = inputMessage;
    setInputMessage('');

    // Check for owner bypass
    const isOwner = userInput.toLowerCase().includes(settings.ownerName.toLowerCase()) || 
                    userInput.toLowerCase().includes("eu sou o dono") ||
                    userInput.toLowerCase().includes("sou pedro bots") ||
                    userInput.toLowerCase().includes("meu criador");

    if (chatStep > 0) {
      if (isOwner && chatStep < 6) {
        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "Opa, Pedro! Reconhecido. 👑 Ativação gratuita liberada pra você. Já vou pular pro final!", sender: 'bot', timestamp: new Date() }]);
          finalizeOrderConversational({ ...tempLeadData, name: 'Pedro Bots' }, true);
          setChatStep(0);
        }, 1000);
      } else {
        handleChatFlow(userInput);
      }
    } else {
      setIsBotTyping(true);
      const response = await generateBotResponse(userInput, settings.storeName);
      setIsBotTyping(false);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, sender: 'bot', timestamp: new Date() }]);
    }
  };

  const handleChatFlow = (input: string) => {
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      switch (chatStep) {
        case 1: 
          setTempLeadData(prev => ({ ...prev, name: input }));
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "📱 Ótimo! Agora informe seu WHATSAPP com DDD (Ex: 5599981175724):", sender: 'bot', timestamp: new Date() }]);
          setChatStep(2);
          break;
        case 2:
          setTempLeadData(prev => ({ ...prev, whatsapp: input }));
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "🎯 Qual será o MODO DE USO do Bot? (Ex: Administração, Vendas, Jogos, etc):", sender: 'bot', timestamp: new Date() }]);
          setChatStep(3);
          break;
        case 3:
          setTempLeadData(prev => ({ ...prev, purpose: input }));
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "👥 Qual será o NOME DO GRUPO onde o bot será usado?", sender: 'bot', timestamp: new Date() }]);
          setChatStep(4);
          break;
        case 4:
          setTempLeadData(prev => ({ ...prev, projectName: input }));
          setMessages(prev => [...prev, { id: Date.now().toString(), text: "🔗 Agora envie o LINK DO GRUPO (onde o bot será adicionado):", sender: 'bot', timestamp: new Date() }]);
          setChatStep(5);
          break;
        case 5:
          setTempLeadData(prev => ({ ...prev, groupLink: input }));
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            text: `⚠️ IMPORTANTE:\n\nAdicione o número do Bot no grupo agora:\n👉 *+55 99 98117-5724*\n\nMe avise com um "OK" quando tiver adicionado!`, 
            sender: 'bot', 
            timestamp: new Date() 
          }]);
          setChatStep(6);
          break;
        case 6: // Finalize order
          finalizeOrderConversational({ ...tempLeadData }, false);
          setChatStep(0);
          break;
      }
    }, 600);
  };

  const finalizeOrderConversational = (data: typeof tempLeadData, free: boolean) => {
    if (!selectedPlan) return;
    
    const newLead: Lead = { 
      id: Date.now().toString(), 
      ...data, 
      planId: selectedPlan.id, 
      timestamp: new Date() 
    };
    setLeads(prev => [newLead, ...prev]);

    // Formatação exata para o PV do dono
    const waText = `🔔 *NOVO PEDIDO - BLUE ALUGUEL*\n\n📋 *Dados do Cliente:*\n👤 *Nome:* ${data.name}\n📱 *WhatsApp:* ${data.whatsapp}\n🎯 *Finalidade:* ${data.purpose}\n👥 *Grupo:* ${data.projectName}\n🔗 *Link:* ${data.groupLink}\n\n📦 *Plano:* ${selectedPlan.name} (${selectedPlan.days} dias)\n⚡ *Comando:* \`.addaluguel ${selectedPlan.days}\``;
    setLastWAText(waText);

    if (free) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `👑 *PEDIDO ELITE (DONO) ATIVADO!* ⏤͟͟͞͞ 💙\n\nComo você é o Pedro Bots, sua ativação é imediata e gratuita.\n\nEnviando comando no grupo: \`.addaluguel ${selectedPlan.days}\``,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?phone=${settings.ownerNumber}&text=${encodeURIComponent(waText + "\n\n(ATIVADO GRÁTIS PELO DONO)")}`, '_blank');
      }, 3000);
      return;
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `✅ Pedido Gerado com Sucesso!\n\nValor: R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}\n\nClique no botão abaixo para copiar a chave Pix e ser direcionado ao WhatsApp do Pedro Bots para enviar seu pedido.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'pix'
    }]);
  };

  const handleCheckoutAction = () => {
    // Copy Pix key
    navigator.clipboard.writeText(settings.pixKey);
    triggerSaveFeedback("Chave Pix Copiada!");
    
    // Redirect to WhatsApp with order details
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=${settings.ownerNumber}&text=${encodeURIComponent(lastWAText)}`, '_blank');
    }, 1000);
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab('chat');
    setChatStep(1); 
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `Excelente escolha! O plano *${plan.name}* para ${plan.days} dias. ⏤͟͟͞͞ 💙\n\nPara gerar o seu pedido, responda as perguntas abaixo:\n\n👤 Qual seu NOME COMPLETO?`,
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const updateSettingsField = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    triggerSaveFeedback("Configurações atualizadas!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#050b18] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>
      {isDarkMode && (
        <>
          <div className="glow-effect w-[500px] h-[500px] bg-blue-600/10 top-[-10%] right-[-10%]"></div>
          <div className="glow-effect w-[400px] h-[400px] bg-blue-900/10 bottom-[10%] left-[-5%]"></div>
        </>
      )}

      <div className="fixed top-6 right-6 z-[100]">
        <button 
          onClick={() => setShowAdminMenu(!showAdminMenu)}
          className={`p-3 rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200 hover:bg-slate-300'}`}
        >
          <MoreVertical size={20} />
        </button>
        {showAdminMenu && (
          <div className={`absolute top-full right-0 mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#0d1526] border-white/10' : 'bg-white border-slate-200'}`}>
            <button 
              onClick={() => { setShowAdminLogin(true); setShowAdminMenu(false); }}
              className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3"
            >
              <Key size={14} /> {isAdminAuthenticated ? 'Painel ADM Online' : 'Acesso Administrador'}
            </button>
            {isAdminAuthenticated && (
              <button 
                onClick={() => { setIsAdminAuthenticated(false); setActiveTab('home'); setShowAdminMenu(false); }}
                className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"
              >
                <X size={14} /> Encerrar Sessão
              </button>
            )}
            <button 
              onClick={() => { setIsDarkMode(!isDarkMode); setShowAdminMenu(false); }}
              className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} Alternar Tema
            </button>
          </div>
        )}
      </div>

      {saveStatus && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2">
            <CheckCircle size={14} /> {saveStatus}
          </div>
        </div>
      )}

      <header className="pt-16 pb-12 px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 animate-pulse">
           <Zap size={14} className="fill-blue-500" /> Sistema Ativo 24/7
        </div>
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {settings.storeName}
        </h1>
        <p className="mt-6 text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] max-w-2xl mx-auto leading-relaxed opacity-80">
          Especialista em aluguel de bots para WhatsApp. Gestão avançada e segurança total.
        </p>
      </header>

      <div className="flex justify-center gap-3 mb-16 px-4 relative z-10">
        <button onClick={() => setActiveTab('home')} className={`px-10 py-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
          Vitrine
        </button>
        <button onClick={() => setActiveTab('chat')} className={`px-10 py-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
          Loja & Vendas
        </button>
        {isAdminAuthenticated && (
          <button onClick={() => setActiveTab('admin')} className={`px-10 py-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
            Painel ADM
          </button>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        {activeTab === 'home' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <div className="flex gap-2"><Smartphone size={20}/><Laptop size={20}/></div>, title: "Android, iPhone & PC", desc: "Plataforma 100% responsiva e otimizada para todas as telas e dispositivos." },
                { icon: <Server size={24} />, title: "Uptime 99.9%", desc: "Hospedagem de alta performance para garantir seu bot online dia e noite." },
                { icon: <ShieldCheck size={24} />, title: "Anti-Ban Pro", desc: "Algoritmos inteligentes que simulam comportamento humano para total segurança." }
              ].map((feat, i) => (
                <div key={i} className={`p-10 rounded-[48px] border transition-all hover:translate-y-[-10px] ${isDarkMode ? 'bg-[#0d1526]/60 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <div className="w-16 h-16 rounded-3xl blue-gradient flex items-center justify-center mb-8 shadow-xl shadow-blue-500/30">
                    <div className="text-white">{feat.icon}</div>
                  </div>
                  <h3 className="text-xl font-black italic uppercase mb-3 tracking-tight">{feat.title}</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            <div id="planos" className="space-y-16">
               <div className="text-center">
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">Escolha o plano ideal</h2>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] mt-4">Ativação Instantânea ⏤͟͟͞͞ 💙</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.filter(p => p.isActive).map(plan => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} isDarkMode={isDarkMode} />
                ))}
               </div>
            </div>

            <div className="space-y-12 pb-12">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shadow-2xl shadow-yellow-900/10">
                    <Trophy className="text-yellow-500 w-10 h-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Elite de Revendedores</h2>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Os Maiores Gestores da Rede Blue</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {resellerRanks.slice(0, 8).map((res, i) => (
                    <div key={res.whatsapp} className={`p-8 rounded-[40px] border flex items-center gap-6 transition-all hover:scale-105 ${isDarkMode ? 'bg-[#0d1526]/80 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-lg'}`}>
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border ${getRankColor(res.rank)}`}>
                          {res.rank === 'Dono' ? <Crown size={28} /> : i + 1}
                       </div>
                       <div className="min-w-0">
                          <p className="font-black truncate uppercase text-sm mb-1">{res.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${getRankColor(res.rank)}`}>{res.rank}</span>
                            <span className="text-[11px] font-black text-blue-500">{res.sales} Sales</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={`max-w-3xl mx-auto h-[75vh] flex flex-col rounded-[56px] shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'} animate-in slide-in-from-bottom-8 duration-700`}>
            <div className="blue-gradient p-10 text-white flex items-center gap-8 border-b border-white/10">
              <div className="w-20 h-20 rounded-[32px] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl relative group">
                 <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
                 <span className="text-5xl animate-float relative z-10">💙</span>
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-4 border-blue-600 animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight">{settings.storeName}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <Circle key={i} size={6} className="fill-blue-400 text-blue-400" />)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Online Agora</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar ${isDarkMode ? 'bg-black/10' : 'bg-slate-50'}`}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-[40px] px-10 py-6 text-sm shadow-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : isDarkMode ? 'bg-[#1a2333] border border-white/5 rounded-tl-none' : 'bg-white rounded-tl-none border border-slate-100'}`}>
                    <p className="font-bold uppercase tracking-tight text-[11px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.type === 'pix' && (
                      <div className="mt-8 space-y-6 text-center animate-in fade-in zoom-in duration-500">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Chave de Pagamento Oficial 💰</p>
                        <div className="bg-black/40 p-8 rounded-[32px] border border-white/10 break-all font-mono text-[11px] text-blue-400 font-black shadow-inner">{settings.pixKey}</div>
                        <div className="flex flex-col gap-4">
                           <button onClick={handleCheckoutAction} className="py-6 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/30">
                             <Copy size={20} /> COPIAR PIX & ENVIAR PEDIDO
                           </button>
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                             enviar comprovante para sua comprar ser aprovada
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className={`px-6 py-4 rounded-full flex gap-2 ${isDarkMode ? 'bg-[#1a2333]' : 'bg-slate-100'}`}>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className={`p-8 border-t ${isDarkMode ? 'border-white/5 bg-[#0d1526]' : 'bg-white border-slate-200'} flex gap-4`}>
              <input 
                placeholder={chatStep > 0 ? "Responda aqui..." : "DÚVIDAS? PERGUNTE AO ASSISTENTE BLUE..."}
                className={`flex-1 px-8 py-6 rounded-2xl font-black text-[11px] uppercase outline-none shadow-inner transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 text-white focus:bg-white/10' : 'bg-slate-50 border border-slate-200 focus:bg-white'}`}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="w-16 h-16 blue-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"><Send size={24} /></button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="space-y-16 animate-in fade-in slide-in-from-right-12 duration-1000">
             <div className="flex justify-between items-center flex-wrap gap-8">
                <div>
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter">Painel Gestor Blue</h2>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] mt-3">Controle Central de Operações ⏤͟͟͞͞ 💙</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className={`p-12 rounded-[56px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                   <h3 className="font-black flex items-center gap-4 uppercase mb-12 text-sm tracking-widest"><Crown size={28} className="text-blue-500" /> Perfil & Site</h3>
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <label className="block">
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Nome da Loja</span>
                           <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-xs text-white" value={settings.storeName} onChange={e => updateSettingsField('storeName', e.target.value)} />
                        </label>
                        <label>
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Nome do Dono</span>
                           <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-black uppercase text-xs text-white" value={settings.ownerName} onChange={e => updateSettingsField('ownerName', e.target.value)} />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <label>
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">WhatsApp Dono</span>
                           <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-mono font-black text-xs text-white" value={settings.ownerNumber} onChange={e => updateSettingsField('ownerNumber', e.target.value)} />
                        </label>
                        <label>
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Senha ADM</span>
                           <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-mono font-black text-xs text-white" value={settings.adminPin} onChange={e => updateSettingsField('adminPin', e.target.value)} />
                        </label>
                      </div>
                   </div>
                </div>

                <div className={`p-12 rounded-[56px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                   <h3 className="font-black flex items-center gap-4 uppercase mb-12 text-sm tracking-widest"><UserPlus size={28} className="text-blue-500" /> Revendedores ({settings.authorizedResellers.length}/10)</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                      <input placeholder="NOME" className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-[10px] text-white" value={newReseller.name} onChange={e => setNewReseller({...newReseller, name: e.target.value})} />
                      <input placeholder="WHATSAPP" className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-[10px] text-white" value={newReseller.whatsapp} onChange={e => setNewReseller({...newReseller, whatsapp: e.target.value})} />
                      <button onClick={addNewReseller} className="bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Plus size={20} /> Add</button>
                   </div>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {settings.authorizedResellers.map(res => (
                        <div key={res.id} className="p-6 bg-black/30 rounded-[32px] border border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <User size={20} className="text-blue-500" />
                              <div>
                                 <p className="font-black uppercase text-xs text-white">{res.name}</p>
                                 <p className="text-[9px] text-slate-500 font-mono">{res.whatsapp}</p>
                              </div>
                           </div>
                           <button onClick={() => removeReseller(res.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="py-16 px-6 border-t border-white/5 text-center relative z-10 bg-black/20">
        <div className="flex justify-center gap-10 mb-8">
           <a href="https://bit.ly/3YNgYFA" target="_blank" className="p-5 bg-white/5 hover:bg-white/10 hover:text-pink-500 rounded-3xl transition-all scale-110 shadow-2xl border border-white/5"><Instagram size={28} /></a>
           <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}`} target="_blank" className="p-5 bg-white/5 hover:bg-white/10 hover:text-blue-500 rounded-3xl transition-all scale-110 shadow-2xl border border-white/5"><MessageCircle size={28} /></a>
        </div>
        <div className="space-y-4">
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 opacity-60">Site Oficial ⏤͟͟͞͞ {settings.storeName.replace('⏤͟͟͞͞ ', '').replace(' ⛤⃗ 💙', '')} ⏤͟͟͞͞ © 2025</p>
           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Desenvolvido por {settings.ownerName} ⏤͟͟͞͞ 💙</p>
        </div>
      </footer>

      {showAdminLogin && (
        <AdminLogin 
          correctPin={settings.adminPin}
          onLogin={(success) => {
            if (success) {
              setIsAdminAuthenticated(true);
              setShowAdminLogin(false);
              setActiveTab('admin');
              triggerSaveFeedback("Sessão Iniciada!");
            }
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </div>
  );
}
