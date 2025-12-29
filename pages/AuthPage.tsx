import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { Button, Input, Toast } from '../components/Common';
import { api } from '../services/api';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { user, error } = await api.auth.login(email, password);
        if (error) throw new Error(error);
        
        setToast({ msg: 'Bem-vindo de volta!', type: 'success' });
        setTimeout(() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/home'), 1000);
      } else {
        const { user, error } = await api.auth.register(email, password);
        if (error) throw new Error(error);
        
        setToast({ msg: 'Cadastro realizado com sucesso!', type: 'success' });
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
      // Clear toast after 3s
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full mb-4 ring-1 ring-blue-500/30">
             <Film className="w-10 h-10 text-blue-500" />
           </div>
           <h1 className="text-3xl font-bold text-white mb-2">Meu Cinema</h1>
           <p className="text-gray-400">O seu portal de entretenimento premium.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
          <div className="flex gap-4 mb-6 p-1 bg-black/20 rounded-lg">
             <button 
               onClick={() => setIsLogin(true)} 
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               Login
             </button>
             <button 
               onClick={() => setIsLogin(false)} 
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               Cadastro
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              type="email" 
              label="Email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input 
              type="password" 
              label="Senha" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            
            <Button type="submit" className="w-full mt-4" isLoading={loading}>
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Use <span className="font-mono text-blue-400">admin@meucinema.com</span> / <span className="font-mono text-blue-400">admin</span> para testar o admin.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ou qualquer senha <span className="font-mono text-blue-400">123456</span> para usuário comum.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
