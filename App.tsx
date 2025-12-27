
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
  Monitor
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
      text: `Olá! Bem-vindo ao suporte oficial do ${settings.storeName}. 💙\n\nEstou aqui para te ajudar com seu aluguel. Qual plano você deseja ativar hoje?`, 
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
      text: `Ótima escolha! O plano ${plan.name} custa R$ ${plan.price.toFixed(2).replace('.', ',')}.\n\nPreencha os dados abaixo para gerar sua chave Pix e o comando de ativação.`,
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
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `✅ Pedido Gerado!\n\nValor: R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}\nComando: .addaluguel ${selectedPlan.days}\n\nCopie a chave Pix abaixo e envie o comprovante.`,
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

      {/* Admin Toggle (3 Dots - Somente visível/acessível por clique) */}
      <div className="fixed top-6 right-6 z-[100]">
        <button 
          onClick={() => setShowAdminMenu(!showAdminMenu)}
          className={`p-3 rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200 hover:bg-slate-300'}`}
        >
          <MoreVertical size={20} />
        </button>
        {showAdminMenu && (
          <div className={`absolute top-full right-0 mt-2 w-48 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#0d1526] border-white/10' : 'bg-white border-slate-200'}`}>
            <button 
              onClick={() => { setShowAdminLogin(true); setShowAdminMenu(false); }}
              className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3"
            >
              <Key size={14} /> {isAdminAuthenticated ? 'Painel ADM' : 'Login Admin'}
            </button>
            {isAdminAuthenticated && (
              <button 
                onClick={() => { setIsAdminAuthenticated(false); setActiveTab('home'); setShowAdminMenu(false); }}
                className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"
              >
                <X size={14} /> Sair
              </button>
            )}
            <button 
              onClick={() => { setIsDarkMode(!isDarkMode); setShowAdminMenu(false); }}
              className="w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 border-t border-white/5"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} Tema
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
      <header className="pt-12 pb-8 px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-pulse">
           <Zap size={14} /> Sistema Online 24h
        </div>
        <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
          {settings.storeName}
        </h1>
        <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
          Especialistas em Automação Profissional para WhatsApp
        </p>
      </header>

      {/* Main Tabs Navigation */}
      <div className="flex justify-center gap-2 mb-12 px-4 relative z-10">
        <button onClick={() => setActiveTab('home')} className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
          Vitrine
        </button>
        <button onClick={() => setActiveTab('chat')} className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
          Atendimento
        </button>
        {isAdminAuthenticated && (
          <button onClick={() => setActiveTab('admin')} className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'bg-white/5 hover:bg-white/10'}`}>
            Painel ADM
          </button>
        )}
      </div>

      {/* Content Area */}
      <main className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        {activeTab === 'home' && (
          <div className="space-y-24 animate-in fade-in duration-700">
            {/* Landing Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <div className="flex gap-1"><Smartphone size={16}/><Monitor size={16}/></div>, title: "iOS, Android & PC", desc: "Totalmente responsivo e otimizado para todas as telas." },
                { icon: <Server />, title: "Uptime 99.9%", desc: "Seu bot nunca para de trabalhar." },
                { icon: <ShieldCheck />, title: "Anti-Ban Pro", desc: "Segurança máxima para seus números." }
              ].map((feat, i) => (
                <div key={i} className={`p-8 rounded-[40px] border transition-all hover:translate-y-[-5px] ${isDarkMode ? 'bg-[#0d1526]/50 border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
                  <div className="w-12 h-12 rounded-2xl blue-gradient flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                    <div className="text-white">{feat.icon}</div>
                  </div>
                  <h3 className="font-black italic uppercase mb-2">{feat.title}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Plans Grid */}
            <div id="planos" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.filter(p => p.isActive).map(plan => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} isDarkMode={isDarkMode} />
              ))}
            </div>

            {/* Elite Ranking */}
            <div className="space-y-10">
               <div className="flex items-center gap-4">
                  <Trophy className="text-yellow-500 w-10 h-10" />
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Elite de Revendedores</h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {resellerRanks.slice(0, 8).map((res, i) => (
                    <div key={res.whatsapp} className={`p-6 rounded-[32px] border flex items-center gap-4 ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-100 shadow-md'}`}>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border ${getRankColor(res.rank)}`}>
                          {res.rank === 'Dono' ? <Crown size={24} /> : i + 1}
                       </div>
                       <div className="min-w-0">
                          <p className="font-black truncate uppercase text-sm">{res.name}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${getRankColor(res.rank)}`}>{res.rank}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={`max-w-2xl mx-auto h-[70vh] flex flex-col rounded-[48px] shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className="blue-gradient p-8 text-white flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center border border-white/20 shadow-xl">
                 <span className="text-4xl animate-pulse">💙</span>
              </div>
              <div>
                <h3 className="font-black text-xl uppercase leading-none">{settings.storeName}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Suporte de Vendas Online</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[32px] px-8 py-5 text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : isDarkMode ? 'bg-[#1a2333] border border-white/5 rounded-tl-none' : 'bg-slate-100 rounded-tl-none'}`}>
                    <p className="font-bold uppercase tracking-tight text-[11px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.type === 'form' && (
                      <form onSubmit={handleSubmitDetails} className="mt-6 space-y-4">
                        <input required placeholder="NOME COMPLETO" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input required placeholder="WHATSAPP (DDD)" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                        <input required placeholder="NOME DO BOT / PROJETO" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
                        <input required placeholder="LINK DO GRUPO" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500" value={formData.groupLink} onChange={e => setFormData({...formData, groupLink: e.target.value})} />
                        <button type="submit" className="w-full bg-white text-blue-900 font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all">Concluir Pedido</button>
                      </form>
                    )}

                    {msg.type === 'pix' && (
                      <div className="mt-6 space-y-4 text-center">
                        <div className="bg-black/30 p-6 rounded-3xl border border-white/10 break-all font-mono text-[10px] text-blue-400 font-black">{settings.pixKey}</div>
                        <button onClick={() => { navigator.clipboard.writeText(settings.pixKey); triggerSaveFeedback("Copiado!"); }} className="w-full py-4 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl font-black uppercase text-[10px] tracking-widest">Copiar Chave</button>
                        <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}&text=PAGO`} target="_blank" className="block w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Enviar Comprovante</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isBotTyping && <div className="text-blue-500 animate-pulse text-[10px] font-black uppercase">Digitando...</div>}
            </div>

            <div className={`p-6 border-t ${isDarkMode ? 'border-white/5 bg-[#0d1526]' : 'bg-white border-slate-200'} flex gap-3`}>
              <input 
                placeholder="DÚVIDAS? DIGITE AQUI..." 
                className={`flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase outline-none ${isDarkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="w-14 h-14 blue-gradient rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Send size={20} /></button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
             <div className="flex justify-between items-center flex-wrap gap-6">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Painel de Elite</h2>
                <div className="flex gap-4">
                   <button onClick={() => alert("Relatório gerado!")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2"><Download size={14} /> Exportar</button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SETTINGS */}
                <div className={`p-10 rounded-[48px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                   <h3 className="font-black flex items-center gap-3 uppercase mb-10 text-xs"><Crown className="text-blue-500" /> Configuração Global</h3>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block col-span-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Nome da Loja</span>
                           <input className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-xs" value={settings.storeName} onChange={e => updateSettingsField('storeName', e.target.value)} />
                        </label>
                        <label>
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Nome do Dono</span>
                           <input className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-xs" value={settings.ownerName} onChange={e => updateSettingsField('ownerName', e.target.value)} />
                        </label>
                        <label>
                           <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Senha ADM</span>
                           <input className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-xs" maxLength={4} value={settings.adminPin} onChange={e => updateSettingsField('adminPin', e.target.value)} />
                        </label>
                      </div>
                      <label className="block">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Chave de Pagamento (Pix)</span>
                         <input className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-xs" value={settings.pixKey} onChange={e => updateSettingsField('pixKey', e.target.value)} />
                      </label>
                   </div>
                </div>

                {/* RESELLERS */}
                <div className={`p-10 rounded-[48px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'}`}>
                   <h3 className="font-black flex items-center gap-3 uppercase mb-10 text-xs"><UserPlus className="text-blue-500" /> Revendedores ({settings.authorizedResellers.length}/10)</h3>
                   <div className="flex gap-4 mb-8">
                      <input placeholder="NOME" className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-black uppercase text-[10px]" value={newReseller.name} onChange={e => setNewReseller({...newReseller, name: e.target.value})} />
                      <input placeholder="WHATSAPP" className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-black uppercase text-[10px]" value={newReseller.whatsapp} onChange={e => setNewReseller({...newReseller, whatsapp: e.target.value})} />
                      <button onClick={addNewReseller} className="bg-blue-600 px-6 rounded-xl font-black uppercase text-[10px]"><Plus size={18} /></button>
                   </div>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {settings.authorizedResellers.map(res => (
                        <div key={res.id} className="p-5 bg-black/20 rounded-3xl border border-white/5 flex items-center justify-between">
                           <div>
                              <p className="font-black uppercase text-xs">{res.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">{res.whatsapp}</span>
                           </div>
                           <button onClick={() => removeReseller(res.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* STATS TABLE */}
             <div className={`p-10 rounded-[48px] border ${isDarkMode ? 'bg-[#0d1526] border-white/5' : 'bg-white border-slate-200'} overflow-hidden`}>
                <h3 className="font-black flex items-center gap-3 uppercase mb-10 text-xs"><Activity className="text-blue-500" /> Log de Ativações Blue</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-[10px] uppercase font-black">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500">
                          <th className="py-5 px-4">Cliente</th>
                          <th className="py-5 px-4">Projeto</th>
                          <th className="py-5 px-4">Plano</th>
                          <th className="py-5 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {leads.map(lead => (
                          <tr key={lead.id}>
                            <td className="py-4 px-4">{lead.name} <br/> <span className="font-mono text-slate-500">{lead.whatsapp}</span></td>
                            <td className="py-4 px-4">{lead.projectName}</td>
                            <td className="py-4 px-4"><span className="bg-blue-600 px-2 py-1 rounded-md">DIAS {plans.find(p => p.id === lead.planId)?.days}</span></td>
                            <td className="py-4 px-4 text-slate-500">{lead.timestamp.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer / Instagram */}
      <footer className="py-12 px-6 border-t border-white/5 text-center relative z-10">
        <div className="flex justify-center gap-8 mb-6">
           <a href="https://bit.ly/3YNgYFA" target="_blank" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all scale-110 shadow-lg"><Instagram size={24} /></a>
           <a href={`https://api.whatsapp.com/send?phone=${settings.ownerNumber}`} target="_blank" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all scale-110 shadow-lg"><MessageCircle size={24} /></a>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Site Oficial ⏤͟͟͞͞ {settings.storeName} ⏤͟͟͞͞ © 2025</p>
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
            }
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </div>
  );
}
