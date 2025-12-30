
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Common';
import { AuthPage } from './pages/AuthPage';
import { Home, Catalog, Player, DetailsPage } from './pages/PublicPages';
import { AdminDashboard, ContentManager, UserManagement } from './pages/AdminPages';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';
import { User } from './types';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';

// Layout Component
const MainLayout: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      <Sidebar user={user} />
      <div className="flex-1 overflow-auto bg-white">
        <Outlet />
      </div>
    </div>
  );
};

// Route Guard for Authenticated Users
const ProtectedRoute: React.FC<{ children: React.ReactNode, user: User | null }> = ({ children, user }) => {
  if (!user) return <Navigate to="/" replace />;
  
  if (user.subscriptionStatus === 'blocked' && user.role !== 'admin') {
     return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white p-6 text-center">
            <div className="bg-red-500/20 p-6 rounded-full mb-4">
                <Lock size={48} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Acesso Bloqueado</h1>
            <p className="text-gray-400 max-w-md mb-6">
                Sua conta está suspensa ou aguardando pagamento. Entre em contato com a administração.
            </p>
            <button 
                onClick={() => api.auth.logout().then(() => window.location.reload())}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
                Sair da conta
            </button>
        </div>
     );
  }

  return <>{children}</>;
};

// Route Guard for Admin
const AdminRoute: React.FC<{ children: React.ReactNode, user: User | null }> = ({ children, user }) => {
  if (!user || user.role !== 'admin') return <Navigate to="/home" replace />;
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. TIMEOUT DE SEGURANÇA: Se o Supabase não responder em 2s, libera o acesso para Login
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Supabase demorou demais. Forçando renderização.");
            setLoading(false);
        }
    }, 2000);

    const initAuth = async () => {
      try {
        const currentUser = await api.auth.initialize();
        if (mounted) setUser(currentUser);
      } catch (e: any) {
        console.error("Erro na inicialização:", e);
        // Não define erro crítico aqui para permitir que a tela de login apareça
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listener de Auth
    try {
        const { data } = api.auth.onAuthStateChange((updatedUser) => {
          if (mounted) {
              setUser(updatedUser);
              setLoading(false);
          }
        });
        
        return () => {
          mounted = false;
          clearTimeout(safetyTimeout);
          if (data && data.subscription) data.subscription.unsubscribe();
        };
    } catch(e) {
        console.error("Erro no listener:", e);
        setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs text-gray-500 uppercase tracking-widest">Carregando Sistema...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/" element={user ? <Navigate to="/home" /> : <AuthPage />} />

        {/* User Routes */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
          <Route path="/filmes" element={<ProtectedRoute user={user}><Catalog type="movie" /></ProtectedRoute>} />
          <Route path="/series" element={<ProtectedRoute user={user}><Catalog type="series" /></ProtectedRoute>} />
          <Route path="/title/:id" element={<ProtectedRoute user={user}><DetailsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* Player */}
        <Route path="/player/:id" element={<ProtectedRoute user={user}><Player /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/admin/dashboard" element={<AdminRoute user={user}><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/filmes" element={<AdminRoute user={user}><ContentManager type="movie" /></AdminRoute>} />
          <Route path="/admin/series" element={<AdminRoute user={user}><ContentManager type="series" /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute user={user}><UserManagement /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
