
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Sidebar, Toast } from './components/Common';
import { AuthPage } from './pages/AuthPage';
import { Home, Catalog, Player, DetailsPage } from './pages/PublicPages';
import { AdminDashboard, ContentManager, UserManagement } from './pages/AdminPages';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';
import { User } from './types';
import { Loader2, Lock } from 'lucide-react';

// Layout Component to handle Sidebar presence
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
  
  // Block logic
  if (user.subscriptionStatus === 'blocked' && user.role !== 'admin') {
     return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white p-6 text-center">
            <div className="bg-red-500/20 p-6 rounded-full mb-4">
                <Lock size={48} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Acesso Bloqueado</h1>
            <p className="text-gray-400 max-w-md mb-6">
                Sua conta está suspensa ou aguardando pagamento. Entre em contato com a administração para regularizar seu acesso.
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

// Route Guard for Admin Only
const AdminRoute: React.FC<{ children: React.ReactNode, user: User | null }> = ({ children, user }) => {
  if (!user || user.role !== 'admin') return <Navigate to="/home" replace />;
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const initAuth = async () => {
      const currentUser = await api.auth.initialize();
      setUser(currentUser);
      setLoading(false);
    };
    initAuth();

    // Listen for changes (login/logout)
    const { data: { subscription } } = api.auth.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Public / Auth */}
        <Route path="/" element={user ? <Navigate to="/home" /> : <AuthPage />} />

        {/* User Routes (Wrapped in Layout) */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>} />
          <Route path="/filmes" element={<ProtectedRoute user={user}><Catalog type="movie" /></ProtectedRoute>} />
          <Route path="/series" element={<ProtectedRoute user={user}><Catalog type="series" /></ProtectedRoute>} />
          <Route path="/title/:id" element={<ProtectedRoute user={user}><DetailsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* Player (No Sidebar, Full Screen) */}
        <Route path="/player/:id" element={<ProtectedRoute user={user}><Player /></ProtectedRoute>} />

        {/* Admin Routes (Wrapped in Layout) */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/admin/dashboard" element={<AdminRoute user={user}><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/filmes" element={<AdminRoute user={user}><ContentManager type="movie" /></AdminRoute>} />
          <Route path="/admin/series" element={<AdminRoute user={user}><ContentManager type="series" /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute user={user}><UserManagement /></AdminRoute>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
