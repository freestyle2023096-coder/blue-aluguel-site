
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, 
  Settings, 
  Users, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  CheckCircle,
  Send,
  User,
  ArrowRight,
  Menu,
  X,
  Zap,
  Download,
  Moon,
  Sun,
  Copy,
  Link as LinkIcon,
  Trophy,
  Crown,
  Instagram,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Check,
  Store,
  Key,
  Smartphone,
  Server,
  Activity,
  MoreVertical,
  ChevronDown,
  Monitor,
  Laptop,
  Circle
} from 'lucide-react';
import { Plan, AppSettings, Lead, Message, PlanInterval, RankLevel, Reseller } from './types';
import { INITIAL_PLANS, DEFAULT_SETTINGS, ROBOT_NAME } from './constants';
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
  
  // Form States
  const [newReseller, setNewReseller] = useState({ name: '', whatsapp: '' });
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: `Opa! Sou o BLUE Bot Vendas. 💙\n\nAqui você pode escolher seu plano de aluguel. Como posso te ajudar hoje?`, 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '', whatsapp: '', city: '', neighborhood: '', projectName: '', purpose: 'Entretenimento', groupLink: ''
  });

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

  // Ranking Logic
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
    if (settings.authorizedResellers.length >= 10) {
      alert("Limite de 10 revendedores atingido!");
      return;
    }
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
    
    // Zap notification logic
    const welcomeText = `Opa! Você foi autorizado como revendedor oficial do ${settings.storeName} ⏤͟͟͞͞ 💙\nLink da Loja: ${window.location.origin}\nSua senha: ${settings.adminPin}`;
    window.open(`https://api.whatsapp.com/send?phone=${reseller.whatsapp}&text=${encodeURIComponent(welcomeText)}`, '_blank');

    setNewReseller({ name: '', whatsapp: '' });
    triggerSaveFeedback("Revendedor Adicionado!");
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
    setInputMessage('');
    setIsBotTyping(true);
    const response = await generateBotResponse(inputMessage, settings.storeName);
    setIsBotTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: response, sender: 'bot', timestamp: new Date() }]);
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setActiveTab('chat');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `Excelente escolha! O plano ${plan.name} para ${plan.days} dias.\n\nPreencha os dados abaixo para gerar seu pedido e a chave de pagamento.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'form'
    }]);
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    const newLead: Lead = { id: Date.now().toString(), ...formData, planId: selectedPlan.id, timestamp: new Date() };
    setLeads(prev => [newLead, ...prev]);

    // Format WA Message
    const waText = `Opa! Novo Pedido Blue Aluguel ⏤͟͟͞͞ 💙\nPlano: ${selectedPlan.name}\nCliente: ${formData.name}\nWhatsApp: ${formData.whatsapp}\nCidade: ${formData.city}\nProjeto: ${formData.projectName}\nLink: ${formData.groupLink}`;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `✅ Pedido Gerado com Sucesso!\n\nValor: R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}\nComando de Ativação: .addaluguel ${selectedPlan.days}\n\nCopie a Chave de Pagamento abaixo e envie o comprovante para o Pedro Bots.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'pix'
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
      {/* Background Glows */}
      {isDarkMode && (
        <>
          <div className="glow-effect w-[500px] h-[500px] bg-blue-600/10 top-[-10%] right-[-10%]"></div>
          <div className="glow-effect w-[400px] h-[400px] bg-blue-900/10 bottom-[10%] left-[-5%]"></div>
        </>
      )}

      {/* Admin Toggle (3 Dots - Somente visível para o dono via autenticação) */}
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

      {/* Save Feedback Toast */}
      {saveStatus && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2">
            <CheckCircle size={14} /> {saveStatus}
          </div>
        </div>
      )}

      {/* Header / Logo */}
      <header className="pt-16 pb-12 px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 animate-pulse">
           <Zap size={14} className="fill-blue-500" /> Sistema Ativo 24/7
        </div>
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {settings.storeName}
        </h1>
        <p className="mt-6 text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] max-w-2xl mx-auto leading-relaxed opacity-80">
          A solução definitiva em aluguel de bots. Gestão profissional e segurança anti-ban.
        </p>
      </header>

      {/* Main Tabs Navigation */}
      <div className="flex justify-center gap-3 mb-16 px-4 relative z-10">
        <button onClick={() => setActiveTab('home')} className={`px-10 py-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
          Site Oficial
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

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        {activeTab === 'home' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
            {/* Landing Features */}
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

            {/* Plans Grid */}
            <div id="planos" className="space-y-16">
               <div className="text-center">
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">Planos Disponíveis</h2>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] mt-4">Ativação Instantânea ⏤͟͟͞͞ 💙</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.filter(p => p.isActive).map(plan => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} isDarkMode={isDarkMode} />
                ))}
               </div>
            </div>

            {/* Elite Ranking */}
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
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Suporte & Vendas Blue Bot</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar ${isDarkMode ? 'bg-black/10' : 'bg-slate-50'}`}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-[40px] px-10 py-6 text-sm shadow-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : isDarkMode ? 'bg-[#1a2333] border border-white/5 rounded-tl-none' : 'bg-white rounded-tl-none border border-slate-100'}`}>
                    <p className="font-bold uppercase tracking-tight text-[11px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.type === 'form' && (
                      <form onSubmit={handleSubmitDetails} className="mt-8 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input required placeholder="NOME COMPLETO *" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          <input required placeholder="WHATSAPP (DDD) *" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 text-white" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <input required placeholder="CIDADE / BAIRRO *" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 text-white" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                           <input required placeholder="NOME DO PROJETO *" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 text-white" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
                        </div>
                        <input required placeholder="LINK DO GRUPO (PARA ADD BOT) *" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 text-white" value={formData.groupLink} onChange={e => setFormData({...formData, groupLink: e.target.value})} />
                        <button type="submit" className="w-full bg-white text-blue-900 font-black py-6 rounded-2xl uppercase tracking-[0.3em] text-[11px] hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3">
                          Gerar Chave de Pagamento <ArrowRight size={18} />
                        </button>
                      </form>
                    )}

                    {msg.type === 'pix' && (
                      <div className="mt-8 space-y-6 text-center animate-in fade-in zoom-in duration-500">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Chave de Pagamento Oficinal 💰</p>
                        <div className="bg-black/40 p-8 rounded-[32px] border border-white/10 break-all font-mono text-[11px] text-blue-400 font-black shadow-inner">{settings.pixKey}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <button onClick={() => { navigator.clipboard.writeText(settings.pixKey); triggerSaveFeedback("Chave Copiada!"); }} className="py-5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                             <Copy size={18} /> Copiar Chave
                           </button>
                           <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}&text=PAGO`} target="_blank" className="py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-900/20">
                             <MessageCircle size={18} /> Enviar Comprovante
                           </a>
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
                placeholder="DÚVIDAS? PERGUNTE AO ASSISTENTE BLUE..." 
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
                <div className="flex gap-4">
                   <button onClick={() => alert("Relatório de Vendas gerado com sucesso!")} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all">
                     <Download size={18} /> Exportar Log de Ativações
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* GLOBAL SETTINGS */}
                <div className={`p-12 rounded-[56px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                   <h3 className="font-black flex items-center gap-4 uppercase mb-12 text-sm tracking-widest"><Crown size={28} className="text-blue-500" /> Perfil do Gestor & Site</h3>
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
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Senha ADM (4 Dígitos)</span>
                           <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-mono font-black text-xs text-white" maxLength={4} value={settings.adminPin} onChange={e => updateSettingsField('adminPin', e.target.value)} />
                        </label>
                      </div>
                      <label className="block">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">Chave de Pagamento (Pix)</span>
                         <input className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-5 font-mono font-black text-xs text-blue-400" value={settings.pixKey} onChange={e => updateSettingsField('pixKey', e.target.value)} />
                      </label>
                   </div>
                </div>

                {/* RESELLERS */}
                <div className={`p-12 rounded-[56px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
                   <h3 className="font-black flex items-center gap-4 uppercase mb-12 text-sm tracking-widest"><UserPlus size={28} className="text-blue-500" /> Revendedores Autorizados ({settings.authorizedResellers.length}/10)</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                      <input placeholder="NOME DO GESTOR" className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-[10px] text-white" value={newReseller.name} onChange={e => setNewReseller({...newReseller, name: e.target.value})} />
                      <input placeholder="WHATSAPP (DDD)" className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-[10px] text-white" value={newReseller.whatsapp} onChange={e => setNewReseller({...newReseller, whatsapp: e.target.value})} />
                      <button onClick={addNewReseller} className="bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"><Plus size={20} /> Adicionar</button>
                   </div>
                   <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                      {settings.authorizedResellers.map(res => {
                         const rankData = resellerRanks.find(r => r.whatsapp === res.whatsapp);
                         return (
                          <div key={res.id} className="p-6 bg-black/30 rounded-[32px] border border-white/5 flex items-center justify-between hover:border-blue-500/30 transition-all">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border ${getRankColor(rankData?.rank || 'Bronze')}`}>
                                  <User size={20} />
                                </div>
                                <div>
                                   <p className="font-black uppercase text-xs tracking-tight text-white">{res.name}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[9px] text-slate-500 font-mono font-bold">{res.whatsapp}</span>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${getRankColor(rankData?.rank || 'Bronze')}`}>{rankData?.rank || 'Bronze'}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="text-right mr-3">
                                   <p className="text-[10px] font-black text-blue-500">{rankData?.sales || 0} Sales</p>
                                </div>
                                <button onClick={() => removeReseller(res.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                             </div>
                          </div>
                         )
                      })}
                      {settings.authorizedResellers.length === 0 && (
                        <div className="py-16 text-center opacity-30 italic uppercase text-[10px] font-black tracking-widest">Nenhum revendedor cadastrado no momento.</div>
                      )}
                   </div>
                </div>
             </div>

             {/* STATS TABLE */}
             <div className={`p-12 rounded-[56px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} overflow-hidden`}>
                <div className="flex items-center justify-between mb-12">
                   <h3 className="font-black flex items-center gap-4 uppercase text-sm tracking-widest"><Activity size={28} className="text-blue-500" /> Log de Ativações Blue ⏤͟͟͞͞ 💙</h3>
                   <span className="bg-blue-600/10 text-blue-500 text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest border border-blue-500/20">{leads.length} Pedidos Totais</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left text-[10px] uppercase font-black">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 bg-white/5">
                          <th className="py-6 px-6">Identidade Blue</th>
                          <th className="py-6 px-6">Projeto / Destino</th>
                          <th className="py-6 px-6">Plano & Ativação</th>
                          <th className="py-6 px-6">Registro Temporal</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y divide-white/5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {leads.length === 0 ? (
                          <tr><td colSpan={4} className="py-24 text-center opacity-30 italic uppercase text-[10px] font-black tracking-widest">Aguardando as primeiras vendas da plataforma...</td></tr>
                        ) : (
                          leads.map(lead => {
                            const plan = plans.find(p => p.id === lead.planId);
                            return (
                              <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-6 px-6">
                                  <p className="font-black uppercase text-xs text-white tracking-tight">{lead.name}</p>
                                  <span className="font-mono text-slate-500 mt-1 block tracking-tighter">{lead.whatsapp}</span>
                                </td>
                                <td className="py-6 px-6 max-w-[200px]">
                                   <p className="font-bold text-blue-400 truncate uppercase">{lead.projectName}</p>
                                   <p className="text-[9px] text-slate-500 truncate mt-1 lowercase italic">{lead.groupLink}</p>
                                </td>
                                <td className="py-6 px-6">
                                   <div className="flex flex-col gap-1.5">
                                      <span className="bg-blue-600/20 text-blue-500 px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter w-fit border border-blue-500/20">{plan?.name || 'CUSTOM'}</span>
                                      <p className="text-[9px] font-black text-slate-500 italic">.addaluguel {plan?.days || 'X'}</p>
                                   </div>
                                </td>
                                <td className="py-6 px-6 text-slate-500 font-mono text-[9px] font-black italic">
                                  {lead.timestamp.toLocaleDateString()} {lead.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer / Instagram */}
      <footer className="py-16 px-6 border-t border-white/5 text-center relative z-10 bg-black/20">
        <div className="flex justify-center gap-10 mb-8">
           <a href="https://bit.ly/3YNgYFA" target="_blank" className="p-5 bg-white/5 hover:bg-white/10 hover:text-pink-500 rounded-3xl transition-all scale-110 shadow-2xl border border-white/5"><Instagram size={28} /></a>
           <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}`} target="_blank" className="p-5 bg-white/5 hover:bg-white/10 hover:text-blue-500 rounded-3xl transition-all scale-110 shadow-2xl border border-white/5"><MessageCircle size={28} /></a>
        </div>
        <div className="space-y-4">
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 opacity-60">Site Oficial ⏤͟͟͞͞ {settings.storeName.replace('⏤͟͟͞͞ ', '').replace(' ⛤⃗ 💙', '')} ⏤͟͟͞͞ © 2025</p>
           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Desenvolvido com excelência por {settings.ownerName} ⏤͟͟͞͞ 💙</p>
        </div>
      </footer>

      {/* Admin Login Modal */}
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
