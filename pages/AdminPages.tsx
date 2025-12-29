import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ContentItem, User, Episode } from '../types';
import { Button, Input, Modal, Toast } from '../components/Common';
import { Plus, Trash2, Edit2, Search, Upload, Film, Tv, PlayCircle, X, User as UserIcon, Shield, Link as LinkIcon, AlertTriangle, Database } from 'lucide-react';

// --- DASHBOARD ---

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ movies: 0, series: 0, users: 0 });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const load = async () => {
      let movies = await api.content.getMovies();
      let series = await api.content.getSeries();
      
      // AUTO POPULATION: Se o banco estiver vazio (primeiro acesso), popula automaticamente
      if (movies.length === 0 && series.length === 0) {
          await api.content.populateDemoContent();
          movies = await api.content.getMovies();
          series = await api.content.getSeries();
      }

      const users = await api.users.getAll();
      setStats({ movies: movies.length, series: series.length, users: users.length });
      setRecentUsers(users.slice(0, 5));
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerateDemo = async () => {
      if (!confirm("Isso adicionará filmes e séries de exemplo ao seu banco de dados. Continuar?")) return;
      
      setLoadingDemo(true);
      const success = await api.content.populateDemoContent();
      if (success) {
          setToast({ msg: 'Catálogo de demonstração gerado com sucesso!', type: 'success' });
          load(); // Refresh stats
      } else {
          setToast({ msg: 'Erro ao gerar catálogo.', type: 'error' });
      }
      setLoadingDemo(false);
      setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-8 bg-[#0F172A] min-h-screen text-white">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        
        <Button onClick={handleGenerateDemo} isLoading={loadingDemo} variant="secondary" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
            <Database size={18} /> Forçar Recarga de Catálogo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Filmes Ativos" count={stats.movies} color="bg-blue-500" />
        <StatCard title="Séries Ativas" count={stats.series} color="bg-indigo-500" />
        <StatCard title="Usuários Registrados" count={stats.users} color="bg-purple-500" />
      </div>

      <div className="bg-[#1E293B] p-6 rounded-lg shadow-xl border border-white/5">
        <h2 className="text-xl font-bold mb-4 text-white">Usuários Recentes</h2>
        <div className="space-y-4">
           {recentUsers.length === 0 ? (
             <p className="text-gray-400">Nenhum usuário encontrado.</p>
           ) : (
             recentUsers.map(u => (
               <div key={u.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden text-white">
                     {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{u.name[0]}</div>}
                   </div>
                   <div>
                     <p className="font-medium text-white">{u.name}</p>
                     <p className="text-sm text-gray-400">{u.email}</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${u.subscriptionStatus === 'blocked' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {u.subscriptionStatus === 'blocked' ? 'Bloqueado' : 'Ativo'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-gray-300'}`}>
                        {u.role}
                    </span>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => (
  <div className="bg-[#1E293B] p-6 rounded-lg shadow-xl border border-white/5 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-400 uppercase">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{count}</p>
    </div>
    <div className={`w-12 h-12 rounded-full ${color} opacity-20`} />
  </div>
);

// --- USER MANAGEMENT ---

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    const data = await api.users.getAll();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setEditingUser({...user});
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const success = await api.users.updateProfile(editingUser.id, {
        role: editingUser.role,
        subscriptionStatus: editingUser.subscriptionStatus
      });

      if (success) {
        setToast({ msg: 'Usuário atualizado com sucesso!', type: 'success' });
        setEditingUser(null);
        loadUsers();
      } else {
        throw new Error("Erro ao atualizar banco de dados.");
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Tem certeza? Esta ação removerá o perfil do usuário.")) {
      await api.users.deleteUser(id);
      setToast({ msg: 'Perfil removido.', type: 'success' });
      loadUsers();
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-[#0F172A] min-h-screen text-white">
       {toast && <Toast message={toast.msg} type={toast.type} />}

       <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
           <p className="text-gray-400">Controle o acesso e status de pagamento dos usuários.</p>
         </div>
       </div>

       <div className="bg-[#1E293B] rounded-lg shadow-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-[#1E293B]">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar usuário..." 
                className="pl-10 pr-4 py-2 w-full rounded-md bg-[#0F172A] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0F172A] text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Função</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 text-white">
                           {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{user.name[0]}</div>}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                         <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscriptionStatus === 'blocked' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {user.subscriptionStatus === 'blocked' ? <AlertTriangle size={12}/> : null}
                            {user.subscriptionStatus === 'blocked' ? 'Bloqueado' : 'Ativo'}
                         </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-gray-300'
                      }`}>
                         {user.role === 'admin' && <Shield size={10} />}
                         {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => handleEditClick(user)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"><Edit2 size={16}/></button>
                         <button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {/* Edit User Modal */}
       <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Gerenciar Acesso">
          {editingUser && (
             <div className="space-y-4">
                 <div className="p-4 bg-slate-800 rounded mb-4">
                    <p className="text-sm text-gray-300">Editando: <strong className="text-white">{editingUser.name}</strong></p>
                    <p className="text-xs text-gray-500">{editingUser.email}</p>
                 </div>

                 <div className="space-y-4">
                    <div className="w-full">
                       <label className="block text-sm font-medium text-gray-500 mb-1">Status de Assinatura (Pagamento)</label>
                       <select 
                         className="w-full rounded-md border border-white/10 bg-[#0F172A] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                         value={editingUser.subscriptionStatus || 'active'}
                         onChange={e => setEditingUser({...editingUser, subscriptionStatus: e.target.value as any})}
                       >
                         <option value="active">Ativo (Acesso Liberado)</option>
                         <option value="blocked">Bloqueado (Pagamento Pendente)</option>
                       </select>
                       <p className="text-xs text-gray-500 mt-1">Se bloqueado, o usuário não conseguirá assistir a nenhum conteúdo.</p>
                    </div>

                    <div className="w-full">
                       <label className="block text-sm font-medium text-gray-500 mb-1">Função</label>
                       <select 
                         className="w-full rounded-md border border-white/10 bg-[#0F172A] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                         value={editingUser.role}
                         onChange={e => setEditingUser({...editingUser, role: e.target.value as 'user' | 'admin'})}
                       >
                         <option value="user">Usuário</option>
                         <option value="admin">Administrador</option>
                       </select>
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditingUser(null)} className="!text-gray-400 hover:!text-white">Cancelar</Button>
                    <Button onClick={handleSaveUser} isLoading={loading}>Salvar Permissões</Button>
                 </div>
             </div>
          )}
       </Modal>
    </div>
  );
};

// --- HELPER COMPONENT FOR MEDIA INPUT (FILE OR LINK) ---
const MediaInput = ({ 
    label, 
    onFileChange, 
    onUrlChange, 
    currentUrlValue, 
    currentFileName,
    accept 
}: { 
    label: string, 
    onFileChange: (f: File | null) => void, 
    onUrlChange: (s: string) => void,
    currentUrlValue: string,
    currentFileName: string | null,
    accept: string
}) => {
    const [mode, setMode] = useState<'upload' | 'link'>('link'); // Default to link to avoid upload issues

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-400">{label}</label>
                <div className="flex bg-[#0F172A] rounded p-0.5 border border-white/10">
                    <button 
                        onClick={() => { setMode('link'); onFileChange(null); }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${mode === 'link' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Link
                    </button>
                    <button 
                        onClick={() => { setMode('upload'); onUrlChange(''); }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${mode === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Upload
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
                <div className="border border-dashed border-white/20 rounded-lg p-4 bg-[#0F172A] hover:bg-[#1E293B] transition-colors relative">
                    <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="text-gray-400 mb-2" size={20} />
                        <span className="text-sm font-medium text-gray-300">Escolher Arquivo</span>
                        <span className="text-xs text-gray-500 mt-1">{currentFileName || 'Nenhum arquivo selecionado'}</span>
                        <input type="file" accept={accept} className="hidden" onChange={e => onFileChange(e.target.files?.[0] || null)} />
                    </label>
                </div>
            ) : (
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="https://..." 
                        className="pl-9 pr-4 py-2 w-full rounded-md bg-[#0F172A] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                        value={currentUrlValue}
                        onChange={e => onUrlChange(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};


// --- CONTENT MANAGER (MOVIES & SERIES) ---

export const ContentManager = ({ type }: { type: 'movie' | 'series' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // File/URL States
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterUrlInput, setPosterUrlInput] = useState('');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '', description: '', genre: '', year: new Date().getFullYear(), type
  });

  // Series Episode Management State
  const [selectedSeries, setSelectedSeries] = useState<ContentItem | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [newEpisode, setNewEpisode] = useState({ title: '', season: 1, number: 1 });
  const [episodeVideoFile, setEpisodeVideoFile] = useState<File | null>(null);
  const [episodeVideoUrlInput, setEpisodeVideoUrlInput] = useState('');

  const loadData = async () => {
    const data = type === 'movie' ? await api.content.getMovies() : await api.content.getSeries();
    setItems(data);
  };

  useEffect(() => {
    loadData();
    setFormData(prev => ({ ...prev, type }));
  }, [type]);

  const handleSaveContent = async () => {
    // Validate Poster
    if (!formData.title) {
        setToast({ msg: 'Título é obrigatório', type: 'error' });
        return;
    }
    if (!posterFile && !posterUrlInput) {
        setToast({ msg: 'É necessário uma capa (Arquivo ou Link)', type: 'error' });
        return;
    }

    // Validate Video (if movie)
    if (type === 'movie' && !videoFile && !videoUrlInput) {
        setToast({ msg: 'É necessário um vídeo (Arquivo ou Link)', type: 'error' });
        return;
    }

    setLoading(true);
    try {
      // 1. Handle Poster
      let finalPosterUrl = posterUrlInput;
      if (posterFile) {
         try {
             finalPosterUrl = await api.storage.uploadFile(posterFile, 'media');
         } catch (e) {
             throw new Error("Erro no upload da capa. Tente usar um link.");
         }
      }

      // 2. Handle Video
      let finalVideoUrl = '';
      if (type === 'movie') {
          finalVideoUrl = videoUrlInput;
          if (videoFile) {
              try {
                  finalVideoUrl = await api.storage.uploadFile(videoFile, 'media');
              } catch (e) {
                  throw new Error("Erro no upload do vídeo. Tente usar um link.");
              }
          }
      }

      const newItem: ContentItem = {
        id: '', // DB generates
        title: formData.title!,
        description: formData.description || '',
        posterUrl: finalPosterUrl,
        videoUrl: finalVideoUrl,
        genre: formData.genre || 'Geral',
        year: formData.year || 2024,
        type: type,
        createdAt: new Date().toISOString()
      };

      await api.content.addContent(newItem);
      
      setToast({ msg: 'Conteúdo adicionado com sucesso!', type: 'success' });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      setToast({ msg: e.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', genre: '', year: new Date().getFullYear(), type });
    setPosterFile(null);
    setPosterUrlInput('');
    setVideoFile(null);
    setVideoUrlInput('');
  }

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja remover este item?')) {
      await api.content.deleteContent(id, type);
      loadData();
      setToast({ msg: 'Item removido.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // --- EPISODE LOGIC ---
  const openEpisodes = async (series: ContentItem) => {
    setSelectedSeries(series);
    setIsEpisodeModalOpen(true);
    const eps = await api.content.getEpisodes(series.id);
    setEpisodes(eps);
  };

  const handleAddEpisode = async () => {
     if (!newEpisode.title) {
         setToast({ msg: 'Título é obrigatório', type: 'error' });
         return;
     }
     if (!episodeVideoFile && !episodeVideoUrlInput) {
         setToast({ msg: 'Vídeo é obrigatório (Arquivo ou Link)', type: 'error' });
         return;
     }

     setLoading(true);
     try {
         let vidUrl = episodeVideoUrlInput;
         if (episodeVideoFile) {
             try {
                vidUrl = await api.storage.uploadFile(episodeVideoFile, 'media');
             } catch (e) {
                throw new Error("Erro no upload do vídeo. Use um link.");
             }
         }

         if (!selectedSeries) return;

         await api.content.addEpisode({
             serieId: selectedSeries.id,
             title: newEpisode.title,
             season: newEpisode.season,
             number: newEpisode.number,
             videoUrl: vidUrl
         });
         
         const eps = await api.content.getEpisodes(selectedSeries.id);
         setEpisodes(eps);
         setNewEpisode({ title: '', season: 1, number: episodes.length + 2 });
         setEpisodeVideoFile(null);
         setEpisodeVideoUrlInput('');
         setToast({ msg: 'Episódio enviado!', type: 'success' });
     } catch(e: any) {
         setToast({ msg: e.message, type: 'error' });
     } finally {
         setLoading(false);
         setTimeout(() => setToast(null), 3000);
     }
  };

  const handleDeleteEpisode = async (epId: string) => {
      if(confirm('Deletar episódio?')) {
          await api.content.deleteEpisode(epId);
          if (selectedSeries) {
            const eps = await api.content.getEpisodes(selectedSeries.id);
            setEpisodes(eps);
          }
      }
  }

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 bg-[#0F172A] min-h-screen text-white">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold text-white capitalize">Gerenciar {type === 'movie' ? 'Filmes' : 'Séries'}</h1>
           <p className="text-gray-400">Adicione links ou faça upload de arquivos para seu catálogo.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Adicionar {type === 'movie' ? 'Filme' : 'Série'}
        </Button>
      </div>

      {/* Search & Table */}
      <div className="bg-[#1E293B] rounded-lg shadow-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-[#1E293B]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-10 pr-4 py-2 w-full rounded-md bg-[#0F172A] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0F172A] text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Capa</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Ano</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3">
                    <img src={item.posterUrl} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40x56?text=Erro')} alt="" className="w-10 h-14 object-cover rounded shadow-sm bg-slate-700" />
                  </td>
                  <td className="px-6 py-3 font-medium text-white">{item.title}</td>
                  <td className="px-6 py-3">{item.year}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {type === 'series' && (
                           <Button variant="secondary" onClick={() => openEpisodes(item)} className="px-2 py-1 text-xs">
                               <Tv size={14} className="mr-1"/> Episódios
                           </Button>
                       )}
                       <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Content Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adicionar ${type === 'movie' ? 'Filme' : 'Série'}`}>
        <div className="space-y-4">
          <Input 
             className="!bg-[#0F172A] !text-white !border-white/10"
             label="Título" 
             value={formData.title} 
             onChange={e => setFormData({...formData, title: e.target.value})} 
          />
          
          <div className="grid grid-cols-2 gap-4">
             <Input 
               className="!bg-[#0F172A] !text-white !border-white/10"
               label="Gênero" 
               value={formData.genre} 
               onChange={e => setFormData({...formData, genre: e.target.value})} 
            />
             <Input 
               className="!bg-[#0F172A] !text-white !border-white/10"
               type="number"
               label="Ano" 
               value={formData.year} 
               onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-500">Descrição</label>
            <textarea 
              className="w-full rounded-md bg-[#0F172A] border border-white/10 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Media Inputs (Url or File) */}
          <div className="space-y-4 pt-2 border-t border-white/10">
              <MediaInput 
                 label="Capa / Pôster"
                 accept="image/*"
                 currentFileName={posterFile?.name || null}
                 currentUrlValue={posterUrlInput}
                 onFileChange={setPosterFile}
                 onUrlChange={setPosterUrlInput}
              />

              {type === 'movie' && (
                  <MediaInput 
                    label="Arquivo de Filme ou URL"
                    accept="video/*"
                    currentFileName={videoFile?.name || null}
                    currentUrlValue={videoUrlInput}
                    onFileChange={setVideoFile}
                    onUrlChange={setVideoUrlInput}
                 />
              )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="!text-gray-400 hover:!text-white">Cancelar</Button>
            <Button onClick={handleSaveContent} isLoading={loading}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Episode Manager Modal */}
      {selectedSeries && (
          <Modal isOpen={isEpisodeModalOpen} onClose={() => setIsEpisodeModalOpen(false)} title={`Episódios: ${selectedSeries.title}`}>
              <div className="space-y-6">
                  {/* List Episodes */}
                  <div className="max-h-60 overflow-y-auto space-y-2 border-b border-white/10 pb-4">
                      {episodes.length === 0 && <p className="text-gray-500 text-sm text-center">Nenhum episódio cadastrado.</p>}
                      {episodes.map(ep => (
                          <div key={ep.id} className="flex items-center justify-between bg-[#0F172A] p-2 rounded">
                              <span className="text-sm font-medium text-white">S{ep.season}:E{ep.number} - {ep.title}</span>
                              <button onClick={() => handleDeleteEpisode(ep.id)} className="text-red-400 hover:text-red-500"><X size={16}/></button>
                          </div>
                      ))}
                  </div>

                  {/* Add Episode Form */}
                  <div className="bg-blue-900/20 p-4 rounded-lg space-y-3 border border-blue-500/20">
                      <h4 className="text-sm font-bold text-blue-400">Adicionar Episódio</h4>
                      <Input 
                        className="!bg-[#0F172A] !text-white !border-blue-500/30" 
                        placeholder="Título do Episódio" 
                        value={newEpisode.title}
                        onChange={e => setNewEpisode({...newEpisode, title: e.target.value})}
                      />
                      <div className="flex gap-2">
                          <Input className="!bg-[#0F172A] !text-white !border-blue-500/30" type="number" label="Temp." value={newEpisode.season} onChange={e => setNewEpisode({...newEpisode, season: Number(e.target.value)})}/>
                          <Input className="!bg-[#0F172A] !text-white !border-blue-500/30" type="number" label="Ep." value={newEpisode.number} onChange={e => setNewEpisode({...newEpisode, number: Number(e.target.value)})}/>
                      </div>
                      
                      <MediaInput 
                         label="Vídeo do Episódio"
                         accept="video/*"
                         currentFileName={episodeVideoFile?.name || null}
                         currentUrlValue={episodeVideoUrlInput}
                         onFileChange={setEpisodeVideoFile}
                         onUrlChange={setEpisodeVideoUrlInput}
                      />

                      <Button onClick={handleAddEpisode} isLoading={loading} className="w-full">Adicionar</Button>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};
