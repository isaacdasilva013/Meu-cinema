
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Tv, LayoutDashboard, LogOut, Play, Plus, X, Users, Home, Loader2, Star, User as UserIcon, Globe, Trophy, Radio, Sparkles } from 'lucide-react';
import { User, ContentItem } from '../types';
import { api } from '../services/api';

export const Input = React.forwardRef<HTMLInputElement, any>(({ className, label, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">{label}</label>}
    <input
      ref={ref}
      className={`w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all backdrop-blur-md ${className}`}
      {...props}
    />
  </div>
));

export const Button: React.FC<any> = ({ className, variant = 'primary', isLoading, children, ...props }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-white hover:text-black text-white shadow-xl shadow-blue-900/20',
    secondary: 'bg-white/10 border border-white/10 hover:bg-white/20 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-white/5 text-gray-500 hover:text-white'
  };

  return (
    <button
      className={`px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

// NOVO COMPONENTE: Header Flutuante (Perfil e Logout)
export const Header: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const handleLogout = async () => { await api.auth.logout(); navigate('/'); };

  if (!user) return null;

  return (
    <div className="fixed top-0 right-0 z-[60] p-6 flex items-center gap-4 pointer-events-none">
      <div className="flex items-center gap-3 bg-[#0F172A]/80 backdrop-blur-xl p-2 pr-5 rounded-full border border-white/10 shadow-2xl pointer-events-auto hover:bg-[#1E293B] transition-colors">
        <div 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm shadow-lg border border-white/10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden relative group"
        >
          {user.avatarUrl ? (
              <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
          ) : (
              user.name[0].toUpperCase()
          )}
        </div>
        
        <div className="hidden md:block">
           <p className="text-[10px] font-black uppercase tracking-tighter text-white leading-none">{user.name}</p>
           <p className="text-[8px] font-bold uppercase tracking-widest text-blue-500">{user.role}</p>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1"></div>

        <button 
          onClick={handleLogout} 
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
          title="Sair da Conta"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

// SIDEBAR REDESENHADA (Estilo Plex/Slim)
export const Sidebar: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-20 bg-[#0F172A] border-r border-white/5 text-white flex flex-col items-center py-8 shadow-2xl relative z-50">
      {/* Logo */}
      <div 
        onClick={() => navigate('/home')}
        className="mb-10 bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl shadow-lg shadow-blue-600/20 cursor-pointer hover:scale-110 transition-transform"
      >
        <Film className="w-6 h-6 text-white" />
      </div>

      <nav className="flex-1 w-full px-3 space-y-4 flex flex-col items-center overflow-y-auto scrollbar-hide">
        {user ? (
          <>
            <NavItem to="/home" icon={<Home size={22} />} label="Início" />
            <NavItem to="/filmes" icon={<Film size={22} />} label="Filmes" />
            <NavItem to="/series" icon={<Tv size={22} />} label="Séries" />
            <NavItem to="/animes" icon={<Sparkles size={22} />} label="Animes" />
            <div className="h-px w-8 bg-white/10 my-2"></div>
            <NavItem to="/tv" icon={<Radio size={22} />} label="TV Ao Vivo" badge />
            <NavItem to="/esportes" icon={<Trophy size={22} />} label="Esportes" />
            
            {user.role === 'admin' && (
              <>
                <div className="h-px w-8 bg-white/10 my-2"></div>
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={22} />} label="Painel Admin" />
                <NavItem to="/admin/usuarios" icon={<Users size={22} />} label="Usuários" />
              </>
            )}
          </>
        ) : (
          <NavItem to="/" icon={<Users size={22} />} label="Entrar" />
        )}
      </nav>

      {/* Footer Icon */}
      <div className="mt-auto opacity-30 hover:opacity-100 transition-opacity cursor-pointer" title="Meu Cinema Online">
          <Globe size={16} />
      </div>
    </div>
  );
};

const NavItem: React.FC<any> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`
    }
  >
    {icon}
    
    {/* Tooltip */}
    <div className="absolute left-14 bg-[#1E293B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 translate-x-[-10px] group-hover:translate-x-0">
      {label}
      {/* Seta do tooltip */}
      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1E293B] rotate-45 border-l border-b border-white/10"></div>
    </div>

    {/* Badge de Live */}
    {badge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
    )}
  </NavLink>
);

export const MovieCard: React.FC<{ item: ContentItem, onClick?: () => void }> = ({ item, onClick }) => {
  const isLive = item.isLive || item.type === 'channel';
  
  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#1E293B] rounded-[1.5rem] overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] w-full aspect-[2/3] border border-white/5"
    >
      <img 
        src={item.posterUrl} 
        referrerPolicy="no-referrer"
        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=Sem+Imagem')}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        alt={item.title} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      
      {isLive && (
         <div className="absolute top-3 right-3 bg-red-600 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-lg shadow-red-600/40">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-white uppercase tracking-wider">AO VIVO</span>
         </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 truncate">{item.genre}</p>
        <h3 className="text-white font-black text-sm leading-tight uppercase tracking-tighter line-clamp-2">{item.title}</h3>
        <div className="w-8 h-1 bg-blue-600 rounded-full mt-3"></div>
      </div>
      
      {!isLive && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xl px-2 py-1 rounded-lg text-[9px] font-black text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.year}
        </div>
      )}
    </div>
  );
}

export const Modal: React.FC<any> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#1E293B] rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 animate-slide-up">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide">{children}</div>
      </div>
    </div>
  );
};

export const Toast: React.FC<any> = ({ message, type }) => (
  <div className={`fixed bottom-10 right-10 z-[200] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest animate-slide-up border border-white/10 backdrop-blur-2xl ${
    type === 'success' ? 'bg-blue-600/90' : 'bg-red-600/90'
  }`}>
    {type === 'success' ? <Star size={16} fill="currentColor"/> : <X size={16}/>}
    {message}
  </div>
);
