
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
        // Registration
        const { error: registerError } = await api.auth.register(email, password);
        if (registerError) throw new Error(registerError);
        
        // Auto-login after registration
        const { user: loggedUser, error: loginError } = await api.auth.login(email, password);
        
        if (loginError) {
          // Fallback if auto-login fails (e.g., email verification required)
          setToast({ msg: 'Cadastro realizado! Faça login para continuar.', type: 'success' });
          setIsLogin(true);
        } else {
          setToast({ msg: 'Cadastro realizado! Entrando...', type: 'success' });
          setTimeout(() => navigate(loggedUser?.role === 'admin' ? '/admin/dashboard' : '/home'), 1000);
        }
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
      // Clear toast after 3s
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await api.auth.loginWithGoogle();
    if (error) {
      setToast({ msg: 'Erro ao conectar com Google: ' + error, type: 'error' });
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
    // Nota: Se funcionar, o Supabase irá redirecionar a página automaticamente.
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

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-gray-500 font-medium">OU CONTINUE COM</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium py-2.5 rounded-md flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Entrar com Google
          </button>

          {isLogin && (
            <div className="mt-4 text-center">
               <p className="text-xs text-gray-500 mt-1">
                Ainda não tem conta? Clique em Cadastro acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
