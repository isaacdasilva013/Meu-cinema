
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Film, Tv, LogOut, Play, Plus, X, Users, Home, Loader2, Star, User as UserIcon, Globe, Trophy, Radio, Sparkles, Heart, Search, Clock } from 'lucide-react';
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

// --- NOVO HEADER (Topo) ---
export const Header: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Relógio
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => { await api.auth.logout(); navigate('/'); };
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if(searchTerm.trim()) {
          // Redireciona para o catálogo de filmes com a busca (pode ser ajustado para busca global)
          navigate(`/filmes?q=${encodeURIComponent(searchTerm)}`);
      }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-[60] bg-[#0F172A]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between transition-all">
      {/* Lado Esquerdo: Logo */}
      <div onClick={() => navigate('/home')} className="flex items-center gap-3 cursor-pointer group">
         <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
            <Film className="text-white w-5 h-5" />
         </div>
         <span className="hidden md:block text-xl font-black text-white uppercase italic tracking-tighter">
             Meu<span className="text-blue-500">Cinema</span>
         </span>
      </div>

      {/* Lado Direito: Busca, Logout, Perfil, Hora */}
      <div className="flex items-center gap-4 md:gap-6">
          
          {/* Barra de Pesquisa */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
              <input 
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 w-48 focus:w-64 transition-all text-sm text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder-gray-500"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          </form>
          
          {/* Busca Mobile (Ícone apenas) */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => navigate('/filmes')}>
              <Search size={22} />
          </button>

          <div className="h-8 w-px bg-white/10 hidden md:block"></div>

          {/* Logout */}
          <button 
             onClick={handleLogout}
             className="text-gray-400 hover:text-red-500 transition-colors"
             title="Sair"
          >
              <LogOut size={22} />
          </button>

          {/* Perfil */}
          <div onClick={() => navigate('/profile')} className="relative cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                  {user.avatarUrl ? (
                      <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Perfil" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-white">{user.name[0]}</div>
                  )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0F172A] rounded-full"></div>
          </div>

          {/* Hora */}
          <div className="hidden lg:flex flex-col items-end text-right border-l border-white/10 pl-6">
              <span className="text-lg font-black text-white leading-none tracking-tight">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                  {time.toLocaleDateString([], { weekday: 'short', day: '2-digit' })}
              </span>
          </div>

      </div>
    </header>
  );
};

// --- NOVA NAVEGAÇÃO INFERIOR (Rodapé) ---
export const BottomNavigation: React.FC<{ user: User | null }> = ({ user }) => {
    if (!user) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#0F172A] border-t border-white/5 z-[60] px-2 md:px-8 pb-2">
            <div className="h-full max-w-5xl mx-auto flex items-center justify-between">
                <BottomNavItem to="/home" icon={<Home size={20} />} label="Início" />
                <BottomNavItem to="/filmes" icon={<Film size={20} />} label="Filmes" />
                <BottomNavItem to="/series" icon={<Tv size={20} />} label="Séries" />
                <BottomNavItem to="/animes" icon={<Sparkles size={20} />} label="Animes" />
                <BottomNavItem to="/tv" icon={<Radio size={20} />} label="Canais" />
                <BottomNavItem to="/esportes" icon={<Trophy size={20} />} label="Eventos" />
                <BottomNavItem to="/favoritos" icon={<Heart size={20} />} label="Favoritos" />
            </div>
        </nav>
    );
};

const BottomNavItem: React.FC<{ to: string, icon: any, label: string }> = ({ to, icon, label }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 group ${
                isActive ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-500/10 -translate-y-1' : 'group-hover:-translate-y-1'}`}>
                    {React.cloneElement(icon, { 
                        fill: isActive ? "currentColor" : "none",
                        className: isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""
                    })}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                    {label}
                </span>
            </>
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
  <div className={`fixed bottom-24 right-4 z-[200] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white font-black uppercase text-[10px] tracking-widest animate-slide-up border border-white/10 backdrop-blur-2xl ${
    type === 'success' ? 'bg-blue-600/90' : 'bg-red-600/90'
  }`}>
    {type === 'success' ? <Star size={16} fill="currentColor"/> : <X size={16}/>}
    {message}
  </div>
);
