
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

export const Sidebar: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const handleLogout = async () => { await api.auth.logout(); navigate('/'); };

  return (
    <div className="h-full w-72 bg-[#0F172A] border-r border-white/5 text-white flex flex-col shadow-2xl relative z-50">
      <div className="p-10">
        <div className="flex items-center gap-3 text-2xl font-black tracking-tighter text-white italic">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-xl shadow-blue-600/30">
            <Film className="w-7 h-7 text-white" />
          </div>
          <span>MEU CINEMA</span>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {user ? (
          <>
            <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Central de Mídia</p>
            <NavItem to="/home" icon={<Home size={20} />}>Início</NavItem>
            <NavItem to="/filmes" icon={<Film size={20} />}>Filmes</NavItem>
            <NavItem to="/series" icon={<Tv size={20} />}>Séries</NavItem>
            <NavItem to="/animes" icon={<Sparkles size={20} />}>Animes</NavItem>
            <div className="pt-2"></div>
            <NavItem to="/tv" icon={<Radio size={20} />} badge="Live">Canais TV</NavItem>
            <NavItem to="/esportes" icon={<Trophy size={20} />}>Esportes</NavItem>
            
            {user.role === 'admin' && (
              <>
                <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mt-10 mb-4">Gestão</p>
                <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />}>Painel</NavItem>
                <NavItem to="/admin/filmes" icon={<Film size={20} />}>Filmes</NavItem>
                <NavItem to="/admin/series" icon={<Tv size={20} />}>Séries</NavItem>
                <NavItem to="/admin/usuarios" icon={<Users size={20} />}>Membros</NavItem>
              </>
            )}
          </>
        ) : (
          <NavItem to="/" icon={<Users size={20} />}>Entrar</NavItem>
        )}
      </nav>

      {user ? (
        <div className="p-8 border-t border-white/5 m-6 bg-white/5 rounded-[2.5rem] border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg border border-white/20">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black truncate uppercase tracking-tight">{user.name}</p>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={16} /> Encerrar
          </button>
        </div>
      ) : (
          <div className="p-6 text-center opacity-30">
              <Film size={48} className="mx-auto mb-2"/>
          </div>
      )}
      
      <div className="pb-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center justify-center gap-2">
             <Globe size={10}/> meucinema.online
          </p>
      </div>
    </div>
  );
};

const NavItem: React.FC<any> = ({ to, icon, children, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-tighter relative group ${
        isActive ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`
    }
  >
    {icon}
    {children}
    {badge && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/50">
            {badge}
        </span>
    )}
  </NavLink>
);

export const MovieCard: React.FC<{ item: ContentItem, onClick?: () => void }> = ({ item, onClick }) => {
  const isLive = item.isLive || item.type === 'channel';
  
  return (
    <div 
      onClick={onClick}
      className="group relative bg-[#1E293B] rounded-[2rem] overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] w-full aspect-[2/3] border border-white/5"
    >
      <img 
        src={item.posterUrl} 
        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=Sem+Imagem')}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        alt={item.title} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      
      {isLive && (
         <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-600/40">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">Ao Vivo</span>
         </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">{item.genre}</p>
        <h3 className="text-white font-black text-base leading-tight uppercase tracking-tighter line-clamp-2">{item.title}</h3>
        <div className="flex items-center gap-2 mt-4">
           <div className="bg-blue-600 p-2 rounded-full shadow-lg">
              <Play fill="currentColor" size={12} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Assistir</span>
        </div>
      </div>
      
      {!isLive && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="bg-[#1E293B] rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 animate-slide-up">
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-10 max-h-[80vh] overflow-y-auto scrollbar-hide">{children}</div>
      </div>
    </div>
  );
};

export const Toast: React.FC<any> = ({ message, type }) => (
  <div className={`fixed bottom-10 right-10 z-[200] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 text-white font-black uppercase text-xs tracking-widest animate-slide-up border border-white/10 backdrop-blur-2xl ${
    type === 'success' ? 'bg-blue-600/90' : 'bg-red-600/90'
  }`}>
    {type === 'success' ? <Star size={18} fill="currentColor"/> : <X size={18}/>}
    {message}
  </div>
);
