import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Tv, LayoutDashboard, LogOut, Play, Plus, X, Users, Home, Info, Loader2 } from 'lucide-react';
import { User, ContentItem } from '../types';
import { api } from '../services/api';

// --- ATOMS ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
    <input
      ref={ref}
      className={`w-full rounded-md border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
      {...props}
    />
  </div>
));

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', isLoading?: boolean }> = ({ className, variant = 'primary', isLoading, children, ...props }) => {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-white/10 border border-white/20 hover:bg-white/20 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-white/10 text-gray-300 hover:text-white'
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- NAVIGATION ---

const NavItem: React.FC<{ to: string, icon: React.ReactNode, children: React.ReactNode }> = ({ to, icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`
    }
  >
    {icon}
    <span className="font-medium">{children}</span>
  </NavLink>
);

export const Sidebar: React.FC<{ user: User | null, onClose?: () => void }> = ({ user, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.auth.logout();
    navigate('/');
  };

  return (
    <div className="h-full w-64 bg-zinc-900 text-white flex flex-col shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-500">
          <Film className="w-8 h-8" />
          <span>Meu Cinema</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {user ? (
          <>
            <div className="px-2 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Navegação
            </div>
            {user.role === 'admin' ? (
              <>
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />}>Dashboard</NavItem>
                <NavItem to="/admin/filmes" icon={<Film size={20} />}>Gerenciar Filmes</NavItem>
                <NavItem to="/admin/series" icon={<Tv size={20} />}>Gerenciar Séries</NavItem>
                <NavItem to="/admin/usuarios" icon={<Users size={20} />}>Usuários</NavItem>
              </>
            ) : (
              <>
                <NavItem to="/home" icon={<Home size={20} />}>Início</NavItem>
                <NavItem to="/filmes" icon={<Film size={20} />}>Filmes</NavItem>
                <NavItem to="/series" icon={<Tv size={20} />}>Séries</NavItem>
              </>
            )}
          </>
        ) : (
          <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
            <p className="text-sm text-blue-200 mb-3">Faça login para aproveitar todo o conteúdo.</p>
            <NavItem to="/" icon={<Users size={20} />}>Login / Cadastro</NavItem>
          </div>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
    </div>
  );
};

// --- CONTENT DISPLAY ---

export const MovieCard: React.FC<{ item: ContentItem, onClick?: () => void }> = ({ item, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative bg-zinc-800 rounded-lg overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-xl w-full aspect-[2/3]"
  >
    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{item.genre}</span>
      <h3 className="text-white font-bold text-lg leading-tight mt-1 mb-1">{item.title}</h3>
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <span>{item.year}</span>
        <span>•</span>
        <span className="capitalize">{item.type}</span>
      </div>
    </div>
    
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
       <div className="bg-blue-500 rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          <Play fill="white" className="text-white ml-1" size={24} />
       </div>
    </div>
  </div>
);

// --- MODALS ---

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Toast: React.FC<{ message: string, type: 'success' | 'error' }> = ({ message, type }) => (
  <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white font-medium animate-slide-up ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`}>
    {message}
  </div>
);