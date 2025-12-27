
import React from 'react';
import { Plan } from '../types';
import { Zap, ChevronRight } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  isDarkMode?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isDarkMode = false }) => {
  const benefits = [
    'Suporte prioritário 24h',
    'Ativação em até 5min',
    'Painel do Dono Incluso',
    'Bot anti-travas seguro',
    'Sem limite de usuários'
  ];

  return (
    <div className={`relative flex flex-col p-8 rounded-[40px] border transition-all duration-500 hover:scale-[1.02] group overflow-hidden ${
      isDarkMode 
        ? plan.isPopular 
          ? 'border-blue-500 bg-[#0d1526] ring-1 ring-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.15)]' 
          : 'border-white/10 bg-[#0d1526]/50 backdrop-blur-sm'
        : plan.isPopular
          ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-2xl shadow-blue-200'
          : 'border-slate-200 bg-white shadow-lg'
    }`}>
      {isDarkMode && (
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] transition-all duration-700 group-hover:scale-150 ${
          plan.isPopular ? 'bg-blue-600/20' : 'bg-slate-600/10'
        }`}></div>
      )}

      {plan.isPopular && (
        <div className="absolute top-6 right-8">
          <div className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg ${
            isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/40' : 'bg-blue-600 text-white'
          }`}>
            Mais Vendido
          </div>
        </div>
      )}
      
      <div className="mb-8 relative z-10">
        <h3 className={`text-3xl font-black italic tracking-tighter uppercase transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
        <p className={`text-[10px] font-black mt-2 uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/10 text-blue-500 inline-block rounded-lg`}>{plan.days} Dias de Acesso</p>
        <p className={`text-xs font-bold mt-4 uppercase tracking-widest leading-relaxed transition-colors duration-500 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{plan.description}</p>
      </div>

      <div className="space-y-4 mb-12 flex-grow relative z-10">
        {benefits.map((feat, idx) => (
          <div key={idx} className={`flex items-center text-xs font-bold uppercase tracking-widest gap-3 transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className={`p-1 rounded-md ${plan.isPopular ? 'bg-blue-600/20 text-blue-500' : isDarkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
              <Zap size={12} />
            </div>
            {feat}
          </div>
        ))}
      </div>

      <div className="mt-auto relative z-10">
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-2 ${
            plan.isPopular
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : isDarkMode 
                ? 'bg-white text-blue-950 hover:bg-slate-200'
                : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          Ver Preço & Alugar <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
