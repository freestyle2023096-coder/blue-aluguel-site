
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageCircle, 
  Settings, 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  CheckCircle,
  Send,
  User,
  MapPin,
  Target,
  ArrowRight,
  Menu,
  X,
  Zap,
  Save,
  Briefcase,
  Download,
  Moon,
  Sun,
  Copy,
  Link as LinkIcon,
  Trophy,
  Crown,
  Instagram,
  ShieldCheck,
  Globe,
  ExternalLink,
  UserPlus,
  UserMinus,
  Check,
  Store,
  Key,
  Smartphone,
  Server,
  Activity,
  Award,
  Circle
} from 'lucide-react';
import { Plan, AppSettings, Lead, Message, PlanInterval, RankLevel, Reseller } from './types';
import { INITIAL_PLANS, DEFAULT_SETTINGS, BOT_NAME, ROBOT_NAME } from './constants';
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
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    if (!parsed.siteUrl) parsed.siteUrl = window.location.origin;
    return parsed;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reseller Form State
  const [newReseller, setNewReseller] = useState({ name: '', whatsapp: '' });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: `Opa! Sou o BLUE Bot Vendas, estou aqui para você escolher seu plano. 💙\n\nEscolha seu plano abaixo e preencha os dados.`, 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    city: '',
    neighborhood: '',
    projectName: '',
    purpose: 'Entretenimento',
    groupLink: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Loading Simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Save State
  useEffect(() => {
    localStorage.setItem('bluebot_plans_final', JSON.stringify(plans));
    localStorage.setItem('bluebot_settings_final', JSON.stringify(settings));
    localStorage.setItem('bluebot_leads_final', JSON.stringify(leads));
  }, [plans, settings, leads]);

  // Ranks Logic
  const resellerRanks = useMemo(() => {
    const counts: Record<string, { count: number, name: string }> = {};
    
    // Initial counts for Owner
    counts[settings.ownerNumber] = { count: 0, name: settings.ownerName };

    // Initial counts for AUTHORIZED resellers only
    settings.authorizedResellers.forEach(res => {
      counts[res.whatsapp] = { count: 0, name: res.name };
    });

    // Aggregate sales
    leads.forEach(lead => {
      const normalizedWA = lead.whatsapp.replace(/\D/g, '');
      if (counts[normalizedWA]) {
        counts[normalizedWA].count += 1;
      }
    });

    return Object.entries(counts).map(([whatsapp, data]) => {
      let rank: RankLevel = 'Bronze';
      if (whatsapp === settings.ownerNumber) rank = 'Dono';
      else if (data.count >= 50) rank = 'Diamante';
      else if (data.count >= 20) rank = 'Platina';
      else if (data.count >= 10) rank = 'Ouro';
      else if (data.count >= 5) rank = 'Prata';

      return {
        whatsapp,
        name: data.name,
        sales: data.count,
        rank
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [leads, settings.ownerNumber, settings.ownerName, settings.authorizedResellers]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  const triggerSaveFeedback = (message = "Alterações salvas!") => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(null), 3000);
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
      text: `Excelente! Você escolheu o plano **${plan.name}**. O valor é **R$ ${plan.price.toFixed(2).replace('.', ',')}**.\n\nPreencha os dados abaixo para que eu possa gerar seu pedido e comando de ativação (.addaluguel ${plan.days}).`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'form'
    }]);
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!formData.name || !formData.whatsapp || !formData.projectName || !formData.groupLink) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      planId: selectedPlan.id,
      timestamp: new Date()
    };

    setLeads(prev => [newLead, ...prev]);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `Pedido Gerado com Sucesso! 💙\n\nValor: **R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}**\nComando: \`.addaluguel ${selectedPlan.days}\`\n\nCopie a **Chave de Pagamento** abaixo. Após o Pix, clique no botão para enviar o comprovante ao ${settings.ownerName}.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'pix'
    }]);
  };

  const generateWhatsAppLink = () => {
    if (!selectedPlan) return "#";
    const waMessage = `Opa! Quero alugar o ${ROBOT_NAME}
Plano: ${selectedPlan.name}
Valor: R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}
Comando: .addaluguel ${selectedPlan.days}
---
Cliente: ${formData.name}
WhatsApp: ${formData.whatsapp}
Cidade: ${formData.city} / ${formData.neighborhood}
Projeto: ${formData.projectName}
Finalidade: ${formData.purpose}
Link do Grupo: ${formData.groupLink}`;

    return `https://api.whatsapp.com/send?phone=${settings.ownerNumber}&text=${encodeURIComponent(waMessage)}`;
  };

  const toggleAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminAuthenticated(false);
      setActiveTab('home');
    } else {
      setShowAdminLogin(true);
    }
  };

  const getRankColor = (rank: RankLevel) => {
    switch(rank) {
      case 'Dono': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Diamante': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'Platina': return 'text-slate-200 bg-slate-200/10 border-slate-200/20';
      case 'Ouro': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Prata': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-orange-600 bg-orange-600/10 border-orange-600/20';
    }
  };

  // Admin Actions
  const updateSettingsField = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    triggerSaveFeedback();
  };

  const addNewReseller = () => {
    if (settings.authorizedResellers.length >= 10) {
      alert("Limite de 10 revendedores atingido!");
      return;
    }
    const normalizedWA = newReseller.whatsapp.replace(/\D/g, '');
    if (!newReseller.name || !normalizedWA) return;

    if (settings.authorizedResellers.some(r => r.whatsapp === normalizedWA)) {
      alert("Revendedor já cadastrado!");
      return;
    }

    const reseller: Reseller = {
      id: `res-${Date.now()}`,
      name: newReseller.name,
      whatsapp: normalizedWA,
      isActive: true
    };

    setSettings(prev => ({
      ...prev,
      authorizedResellers: [...prev.authorizedResellers, reseller]
    }));

    const welcomeText = `Opa! Bem-vindo(a) como novo revendedor do ${settings.storeName} ⏤͟͟͞͞ 💙
Acesse a loja e seu painel ADM usando o link abaixo:
${settings.siteUrl}

Sua senha de acesso: ${settings.adminPin}
Boas vendas e conte conosco! 🚀`;
    
    const waLink = `https://api.whatsapp.com/send?phone=${reseller.whatsapp}&text=${encodeURIComponent(welcomeText)}`;
    window.open(waLink, '_blank');
    
    setNewReseller({ name: '', whatsapp: '' });
    triggerSaveFeedback("Revendedor cadastrado e notificado!");
  };

  const removeReseller = (id: string) => {
    if (window.confirm("Remover este revendedor permanentemente?")) {
      setSettings(prev => ({
        ...prev,
        authorizedResellers: prev.authorizedResellers.filter(r => r.id !== id)
      }));
      triggerSaveFeedback("Revendedor removido!");
    }
  };

  const updatePlanField = (id: string, field: keyof Plan, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePlan = (id: string) => {
    if (confirm("Deletar este plano?")) {
      setPlans(prev => prev.filter(p => p.id !== id));
      triggerSaveFeedback("Plano excluído!");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${isDarkMode ? 'bg-[#050b18] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {saveStatus && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="text-white w-5 h-5" />
          <span className="font-black text-sm tracking-wide uppercase">{saveStatus}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed inset-y-0 left-0 z-40 w-64 ${isDarkMode ? 'bg-gradient-to-b from-blue-900 to-black' : 'blue-gradient'} text-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg">
              <Zap className="text-white fill-white" />
            </div>
            <span className="font-black text-lg leading-tight uppercase tracking-widest">
              {settings.storeName.replace('⏤͟͟͞͞ ', '').replace(' ⛤⃗ 💙', '')}
            </span>
          </div>

          <div className="space-y-2 flex-grow">
            <button onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === 'home' ? 'bg-white text-blue-800 shadow-xl font-black' : 'hover:bg-white/10 font-bold opacity-70 hover:opacity-100 uppercase text-xs'}`}>
              <Store size={20} />
              <span>Site Oficial</span>
            </button>
            <button onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white text-blue-800 shadow-xl font-black' : 'hover:bg-white/10 font-bold opacity-70 hover:opacity-100 uppercase text-xs'}`}>
              <MessageCircle size={20} />
              <span>Vendas Bot</span>
            </button>
            {isAdminAuthenticated && (
              <button onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-white text-blue-800 shadow-xl font-black' : 'hover:bg-white/10 font-bold opacity-70 hover:opacity-100 uppercase text-xs'}`}>
                <LayoutDashboard size={20} />
                <span>Painel ADM</span>
              </button>
            )}
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-white/10">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center gap-3 py-3 bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-all text-[10px] font-black uppercase tracking-widest">
              {isDarkMode ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-blue-200" />}
              {isDarkMode ? 'Modo Claro' : 'Modo Cyber'}
            </button>
            <button onClick={toggleAdmin} className="w-full flex items-center justify-center gap-2 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
              <Key size={14} />
              {isAdminAuthenticated ? 'Encerrar ADM' : 'Acesso Admin'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        )}

        <header className={`h-16 border-b px-4 flex items-center justify-between md:hidden z-30 ${isDarkMode ? 'bg-[#050b18]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
           <div className="flex items-center gap-2">
            <Zap className="text-blue-500 w-6 h-6" />
            <span className={`font-black uppercase text-sm ${isDarkMode ? 'text-blue-100' : 'text-slate-900'}`}>{settings.storeName}</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className={`p-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
             <Menu size={24} />
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 lg:p-16 relative z-10 custom-scrollbar pb-24">
          {activeTab === 'home' && (
            <div className="max-w-6xl mx-auto space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {/* HERO */}
              <div className="text-center space-y-10 py-12">
                <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border transition-all ${isDarkMode ? 'bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                  <Activity size={14} className="animate-pulse" /> Automação Híbrida ⏤͟͟͞͞ 💙
                </div>
                <h1 className={`text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] italic uppercase ${isDarkMode ? 'text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-900'}`}>
                  {settings.storeName}
                </h1>
                <p className={`text-xl max-w-2xl mx-auto font-bold opacity-80 transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  A solução definitiva em aluguel de bots. Gestão profissional, segurança anti-ban e escalabilidade 24/7.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                  <button onClick={() => setActiveTab('chat')} className="px-12 py-7 rounded-[32px] bg-blue-600 text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl shadow-blue-600/50">
                    Começar Aluguel agora
                  </button>
                  <a href="#planos" className={`px-12 py-7 rounded-[32px] border font-black uppercase tracking-widest text-xs transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-800'}`}>
                    Ver Planos Blue
                  </a>
                </div>
              </div>

              {/* FEATURES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <Smartphone />, title: "Interface Mobile", desc: "Totalmente otimizado para iOS e Android. Controle na palma da mão." },
                  { icon: <Server />, title: "Uptime 99.9%", desc: "Infraestrutura de alta performance. Seu bot online dia e noite." },
                  { icon: <ShieldCheck />, title: "Segurança Anti-Ban", desc: "Algoritmos inteligentes que simulam comportamento humano." }
                ].map((feat, i) => (
                  <div key={i} className={`p-10 rounded-[48px] border flex flex-col gap-6 transition-all hover:translate-y-[-10px] ${isDarkMode ? 'bg-[#0d1526]/60 border-white/5' : 'bg-white border-slate-100 shadow-2xl shadow-blue-100'}`}>
                    <div className="w-14 h-14 rounded-2xl blue-gradient flex items-center justify-center text-white shadow-xl">
                      {feat.icon}
                    </div>
                    <h3 className="font-black italic uppercase text-xl leading-none">{feat.title}</h3>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">{feat.desc}</p>
                  </div>
                ))}
              </div>

              {/* PLANS SECTION */}
              <div id="planos" className="space-y-16 py-12 scroll-mt-24">
                <div className="flex flex-col items-center gap-6 text-center">
                   <h2 className={`text-5xl md:text-7xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Planos Disponíveis</h2>
                   <p className="text-blue-500 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Ativação Instantânea via Comando</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {plans.filter(p => p.isActive).map(plan => (
                    <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} isDarkMode={isDarkMode} />
                  ))}
                </div>
              </div>

              {/* RANKING SECTION */}
              <div className="space-y-12 py-12">
                <div className="flex items-center gap-4 justify-between flex-wrap">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                       <Trophy className="text-yellow-500 w-8 h-8 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
                    </div>
                    <div>
                      <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Elite de Revendedores</h2>
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Membros Verificados do {settings.storeName}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {resellerRanks.slice(0, 8).map((reseller, idx) => (
                    <div key={reseller.whatsapp} className={`p-8 rounded-[40px] border flex items-center gap-6 transition-all hover:scale-[1.05] ${isDarkMode ? 'bg-[#0d1526]/90 border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-2xl shadow-blue-50'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border ${getRankColor(reseller.rank)}`}>
                        {reseller.rank === 'Dono' ? <Crown size={32} className="animate-float" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black truncate uppercase text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{reseller.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getRankColor(reseller.rank)}`}>
                            {reseller.rank}
                          </span>
                          <span className="text-[11px] font-black text-blue-500 uppercase">{reseller.sales} Sales</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 opacity-70 hover:opacity-100 transition-all pb-12">
                <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
                   <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg blue-gradient flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Zap className="text-white w-4 h-4" />
                    </div>
                    <span className="font-black text-lg uppercase tracking-widest">{settings.storeName}</span>
                   </div>
                   <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">
                     Design & Eng. por {settings.ownerName} ⏤͟͟͞͞ 💙 © 2025
                   </p>
                </div>
                <div className="flex items-center gap-10">
                  <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}`} target="_blank" className="hover:text-blue-500 transition-colors flex items-center gap-3 font-black uppercase text-xs tracking-widest">
                    <MessageCircle size={18} /> Suporte
                  </a>
                  <a href="https://bit.ly/3YNgYFA" target="_blank" className="hover:text-pink-500 transition-colors flex items-center gap-3 font-black uppercase text-xs tracking-widest">
                    <Instagram size={18} /> Instagram
                  </a>
                </div>
              </footer>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className={`max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col rounded-[48px] shadow-2xl overflow-hidden border transition-all duration-500 ${isDarkMode ? 'border-white/5 bg-[#0d1526]' : 'border-slate-200 bg-white'}`}>
              <div className="blue-gradient p-8 text-white flex items-center gap-6 border-b border-white/10">
                <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl relative">
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></div>
                  <span className="text-4xl">💙</span>
                </div>
                <div>
                  <h3 className="font-black text-xl leading-tight uppercase tracking-wider">{settings.storeName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Atendimento Blue Bot 24h</span>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${isDarkMode ? 'bg-[#0d1526]' : 'bg-slate-50'}`}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-[32px] px-8 py-5 text-sm shadow-2xl ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : isDarkMode ? 'bg-[#1a2333] text-slate-100 rounded-tl-none border border-white/5' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed font-bold uppercase tracking-tight text-[11px]">{msg.text}</div>
                      
                      {msg.type === 'form' && (
                        <form onSubmit={handleSubmitDetails} className={`mt-8 space-y-5 p-8 rounded-[40px] border ${isDarkMode ? 'bg-black/20 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="space-y-4">
                            <input type="text" required placeholder="NOME COMPLETO *" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input type="tel" required placeholder="WHATSAPP (DDD) *" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                              <input type="text" required placeholder="CIDADE *" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                              <input type="text" placeholder="BAIRRO" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                            </div>
                            <input type="text" required placeholder="PROJETO / NOME DO BOT *" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
                            <input type="url" required placeholder="LINK DO GRUPO (ADD BOT) *" className={`w-full px-6 py-5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[11px] uppercase ${isDarkMode ? 'bg-[#0d1526] border-white/10 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`} value={formData.groupLink} onChange={e => setFormData({...formData, groupLink: e.target.value})} />
                          </div>
                          <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-[24px] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl uppercase tracking-[0.3em] text-[11px]">
                            Gerar Pedido Blue <Send size={20} />
                          </button>
                        </form>
                      )}

                      {msg.type === 'pix' && (
                        <div className={`mt-8 p-10 rounded-[48px] border transition-all duration-500 text-center ${isDarkMode ? 'bg-blue-600/10 border-blue-600/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'bg-blue-50 border-blue-200'}`}>
                          <p className={`font-black mb-6 uppercase tracking-[0.4em] text-[10px] ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>Chave de Pagamento Oficinal 💰</p>
                          <div className="space-y-4">
                            <code className={`font-mono font-black text-xs break-all p-6 rounded-[24px] w-full border block ${isDarkMode ? 'bg-black/30 border-white/10 text-blue-400' : 'bg-white border-blue-100 text-blue-600'}`}>{settings.pixKey}</code>
                            <button onClick={() => { navigator.clipboard.writeText(settings.pixKey); triggerSaveFeedback("Copiado com sucesso!"); }} className="w-full bg-blue-600 text-white px-6 py-6 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl">
                              <Copy size={20} /> Copiar Chave Pix
                            </button>
                            <a href={generateWhatsAppLink()} target="_blank" className="w-full bg-green-600 text-white px-6 py-6 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-xl">
                              <MessageCircle size={20} /> Enviar Comprovante ao Dono
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex justify-start">
                    <div className={`rounded-full px-8 py-5 flex gap-2 transition-all ${isDarkMode ? 'bg-[#1a2333] border border-white/5' : 'bg-white border border-slate-100'}`}>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-8 border-t flex gap-4 ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                <input type="text" placeholder="Dúvidas? Pergunte ao Assistente BLUE..." className={`flex-1 px-8 py-5 rounded-[24px] transition-all font-black text-xs uppercase shadow-inner ${isDarkMode ? 'bg-[#1a2333] border-white/10 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} disabled={!inputMessage.trim() || isBotTyping} className="w-16 h-16 rounded-[24px] blue-gradient text-white flex items-center justify-center shadow-2xl disabled:opacity-50 transition-all active:scale-90">
                  <Send size={24} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdminAuthenticated && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h2 className={`text-5xl font-black tracking-tighter italic uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Painel Administrativo</h2>
                  <p className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] mt-2">Configurações de Elite ⏤͟͟͞͞ 💙</p>
                </div>
                <div className="flex items-center gap-4 text-xs px-8 py-4 rounded-[24px] font-black uppercase tracking-widest border bg-green-500/10 text-green-400 border-green-500/20 shadow-2xl shadow-green-900/10">
                  <ShieldCheck size={20} /> Acesso Verificado
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* GLOBAL SETTINGS */}
                <div className={`rounded-[48px] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className={`p-10 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <h3 className={`font-black flex items-center gap-4 uppercase tracking-wider text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <Crown size={24} className="text-blue-500" /> Perfil do Dono & Site
                    </h3>
                  </div>
                  <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Nome Comercial</label>
                        <input type="text" className={`w-full rounded-[20px] px-6 py-4 font-black text-xs uppercase ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={settings.storeName} onChange={(e) => updateSettingsField('storeName', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Nome do Gestor</label>
                        <input type="text" className={`w-full rounded-[20px] px-6 py-4 font-black text-xs uppercase ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={settings.ownerName} onChange={(e) => updateSettingsField('ownerName', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">URL do Site Oficial (Para Onboarding)</label>
                      <input type="text" placeholder="https://seu-dominio.com" className={`w-full rounded-[20px] px-6 py-4 font-mono font-black text-xs italic ${isDarkMode ? 'bg-black/30 border-white/10 text-blue-400' : 'bg-slate-50 border-slate-300 text-blue-600'}`} value={settings.siteUrl} onChange={(e) => updateSettingsField('siteUrl', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Chave Pix Ativa</label>
                        <input type="text" className={`w-full rounded-[20px] px-6 py-4 font-mono font-black text-[11px] ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={settings.pixKey} onChange={(e) => updateSettingsField('pixKey', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">PIN de Segurança (4 Dígitos)</label>
                        <input type="text" maxLength={4} className={`w-full rounded-[20px] px-6 py-4 font-mono font-black text-xs ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={settings.adminPin} onChange={(e) => updateSettingsField('adminPin', e.target.value.replace(/\D/g, ''))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PLAN MANAGEMENT */}
                <div className={`rounded-[48px] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                   <div className={`p-10 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                    <h3 className={`font-black flex items-center gap-4 uppercase tracking-wider text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <Zap size={24} className="text-blue-500" /> Edição de Planos
                    </h3>
                    <button onClick={() => {
                      const newPlan: Plan = { id: `plan-${Date.now()}`, name: 'Novo Plano', price: 0, days: 30, interval: PlanInterval.MENSAL, description: 'Desc.', isActive: true };
                      setPlans(prev => [...prev, newPlan]);
                    }} className="bg-blue-600 text-white p-3.5 rounded-2xl hover:scale-110 transition-all shadow-lg">
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto custom-scrollbar">
                    {plans.map(plan => (
                      <div key={plan.id} className="p-8 space-y-6 hover:bg-black/5 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <input className={`font-black bg-transparent border-none focus:ring-0 p-0 text-sm italic uppercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`} value={plan.name} onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)} />
                          <div className="flex items-center gap-3">
                             <button onClick={() => updatePlanField(plan.id, 'isActive', !plan.isActive)} className={`p-3 rounded-xl ${plan.isActive ? 'text-green-400 bg-green-500/10' : 'text-slate-500 bg-slate-100/10'}`}>
                              <Zap size={18} />
                            </button>
                            <button onClick={() => deletePlan(plan.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <input type="number" step="0.01" className={`w-full border rounded-[16px] px-5 py-3 font-black text-xs ${isDarkMode ? 'bg-black/20 border-white/10 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`} value={plan.price || ""} placeholder="R$ Valor" onChange={(e) => updatePlanField(plan.id, 'price', parseFloat(e.target.value) || 0)} />
                           <input type="number" className={`w-full border rounded-[16px] px-5 py-3 font-black text-xs ${isDarkMode ? 'bg-black/20 border-white/10 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={plan.days || ""} placeholder="Dias" onChange={(e) => updatePlanField(plan.id, 'days', parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RESELLER MANAGEMENT */}
              <div className={`rounded-[48px] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                <div className={`p-10 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                  <h3 className={`font-black flex items-center gap-4 uppercase tracking-wider text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <UserPlus size={24} className="text-blue-500" /> Novos Talentos & Parceiros ({settings.authorizedResellers.length}/10)
                  </h3>
                </div>
                <div className="p-10">
                  {settings.authorizedResellers.length < 10 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      <input type="text" placeholder="NOME DO PARCEIRO" className={`px-6 py-5 rounded-[20px] font-black text-xs uppercase ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={newReseller.name} onChange={e => setNewReseller({...newReseller, name: e.target.value})} />
                      <input type="tel" placeholder="WHATSAPP (55...)" className={`px-6 py-5 rounded-[20px] font-black text-xs uppercase ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} value={newReseller.whatsapp} onChange={e => setNewReseller({...newReseller, whatsapp: e.target.value})} />
                      <button onClick={addNewReseller} className="bg-blue-600 text-white font-black py-5 rounded-[20px] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl uppercase tracking-[0.2em] text-[10px]">
                        <Plus size={20} /> Cadastrar
                      </button>
                    </div>
                  )}

                  <div className="space-y-6">
                    {settings.authorizedResellers.map(res => {
                      const rankData = resellerRanks.find(r => r.whatsapp === res.whatsapp);
                      return (
                        <div key={res.id} className={`p-8 rounded-[40px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${isDarkMode ? 'bg-black/10 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${getRankColor(rankData?.rank || 'Bronze')}`}>
                              <User size={24} />
                            </div>
                            <div>
                              <p className={`font-black uppercase text-base ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{res.name}</p>
                              <div className="flex items-center gap-4 mt-1.5">
                                <span className="text-xs text-slate-500 font-mono font-bold tracking-tight">{res.whatsapp}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${getRankColor(rankData?.rank || 'Bronze')}`}>
                                  {rankData?.rank || 'Bronze'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="text-right mr-6 hidden md:block">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativações</p>
                               <p className="font-black text-blue-500 text-xl leading-none mt-1">{rankData?.sales || 0}</p>
                             </div>
                             <button onClick={() => {
                               const welcomeText = `Opa! Bem-vindo(a) como novo revendedor do ${settings.storeName} ⏤͟͟͞͞ 💙\nPainel: ${settings.siteUrl}\nSenha: ${settings.adminPin}`;
                               const waLink = `https://api.whatsapp.com/send?phone=${res.whatsapp}&text=${encodeURIComponent(welcomeText)}`;
                               window.open(waLink, '_blank');
                               triggerSaveFeedback("Welcome Card enviado!");
                             }} className="p-3.5 rounded-2xl text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" title="Reenviar Boas-vindas">
                               <Send size={20} />
                             </button>
                            <button onClick={() => removeReseller(res.id)} className="p-3.5 text-red-500 bg-red-500/10 rounded-2xl hover:bg-red-500/20" title="Revogar acesso permanentemente">
                              <UserMinus size={20} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {settings.authorizedResellers.length === 0 && (
                      <p className="text-center py-16 text-slate-500 font-black uppercase tracking-widest italic opacity-40 text-xs">Nenhum parceiro autorizado na rede.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RECENT SALES TABLE */}
              <div className={`rounded-[48px] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                <div className={`p-10 border-b ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                  <h3 className={`font-black flex items-center gap-4 uppercase tracking-wider text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <Activity size={24} className="text-blue-500" /> Fluxo de Ativações Blue ⏤͟͟͞͞ 💙
                  </h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-black/20 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
                        <th className="px-10 py-6">Identidade Blue</th>
                        <th className="px-10 py-6">Alocação / Grupo</th>
                        <th className="px-10 py-6">Plano Blue</th>
                        <th className="px-10 py-6">Data Registry</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-white/5 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {leads.length === 0 ? (
                        <tr><td colSpan={4} className="px-10 py-24 text-center font-black uppercase tracking-widest italic opacity-40 text-xs">Aguardando as primeiras ativações do bot</td></tr>
                      ) : (
                        leads.map(lead => {
                           const plan = plans.find(p => p.id === lead.planId);
                           return (
                            <tr key={lead.id} className="hover:bg-black/10 transition-colors">
                              <td className="px-10 py-7">
                                <p className="font-black uppercase text-xs tracking-tight">{lead.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-1.5 font-bold tracking-tighter">{lead.whatsapp}</p>
                              </td>
                              <td className="px-10 py-7">
                                <p className="font-bold text-[10px] uppercase truncate max-w-[180px]">{lead.projectName}</p>
                                <a href={lead.groupLink} target="_blank" className="text-blue-500 text-[10px] hover:underline flex items-center gap-2 mt-1.5 font-black truncate max-w-[180px]">
                                  <LinkIcon size={12} /> External Group Link
                                </a>
                              </td>
                              <td className="px-10 py-7">
                                <div className="flex flex-col gap-2">
                                   <span className="bg-blue-600 text-white text-[9px] px-3.5 py-1.5 rounded-xl font-black uppercase tracking-tighter w-fit">
                                    {plan?.name || 'BLUE CUSTOM'}
                                  </span>
                                  <p className="text-[10px] font-black text-slate-500 italic">.addaluguel {plan?.days || 'X'}</p>
                                </div>
                              </td>
                              <td className="px-10 py-7 text-slate-500 font-mono text-[10px] font-black italic">
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

              <div className={`p-12 rounded-[56px] border flex flex-col md:flex-row items-center justify-between gap-10 ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="text-center md:text-left">
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter">Relatórios Oficiais</h4>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2">Exporte toda a base de inteligência e vendas.</p>
                </div>
                <button onClick={() => alert("Relatório processado e pronto para download.")} className="bg-blue-600 text-white px-12 py-6 rounded-[32px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all">
                  <Download size={22} className="inline mr-3" /> Exportar Dados (.xlsx)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin 
          correctPin={settings.adminPin}
          onLogin={(success) => {
            if (success) {
              setIsAdminAuthenticated(true);
              setShowAdminLogin(false);
              setActiveTab('admin');
            }
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </div>
  );
}
