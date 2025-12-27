
import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
  onClose: () => void;
  correctPin: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose, correctPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleInput = (val: string) => {
    if (val.length <= 4) {
      setPin(val);
      setError(false);
      if (val.length === 4) {
        if (val === correctPin) {
          onLogin(true);
        } else {
          setError(true);
          setPin('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 mb-8">Digite o PIN de 4 dígitos para acessar o painel administrativo.</p>

          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-12 h-16 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                  error ? 'border-red-500 animate-shake' : 
                  pin.length > i ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          <input
            type="tel"
            autoFocus
            className="opacity-0 absolute"
            value={pin}
            onChange={(e) => handleInput(e.target.value.replace(/\D/g, ''))}
          />

          {error && <p className="text-red-500 font-medium animate-pulse">PIN Incorreto. Tente novamente.</p>}
          
          <p className="mt-8 text-xs text-slate-400">Somente administradores autorizados</p>
        </div>
      </div>
    </div>
  );
};
