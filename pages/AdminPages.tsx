
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ContentItem, User, Episode } from '../types';
import { Button, Input, Modal, Toast } from '../components/Common';
import { Plus, Trash2, Edit2, Search, Upload, Film, Tv, PlayCircle, X, User as UserIcon, Shield, Link as LinkIcon, AlertTriangle, Database, CloudLightning, Download } from 'lucide-react';

// --- DASHBOARD ---

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ movies: 0, series: 0, users: 0 });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Import States - CHAVE DEFINIDA POR PADRÃO
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importApiKey, setImportApiKey] = useState('d6cdd588a4405dad47a55194c1efa29c');
  const [importPages, setImportPages] = useState(1);
  const [importType, setImportType] = useState<'movie'|'tv'>('movie');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, lastTitle: '' });

  const load = async () => {
      try {
        let movies = await api.content.getMovies();
        let series = await api.content.getSeries();
        const users = await api.users.getAll();
        setStats({ movies: movies.length, series: series.length, users: users.length });
        setRecentUsers(users.slice(0, 5));
      } catch (e) {
        console.error("Erro ao carregar dashboard", e);
      }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMassImport = async () => {
      if (!importApiKey) {
          setToast({ msg: 'Por favor, insira uma chave API do TMDB.', type: 'error' });
          return;
      }
      
      setImporting(true);
      setImportProgress({ current: 0, total: importPages * 20, lastTitle: 'Iniciando...' });

      try {
          const total = await api.tmdb.importFromTMDB(importApiKey, importType, importPages, (curr, tot, title) => {
              setImportProgress({ current: curr, total: tot, lastTitle: title });
          });
          
          setToast({ msg: `Importação concluída! ${total} itens adicionados.`, type: 'success' });
          setIsImportModalOpen(false);
          load(); // Refresh stats
      } catch (e: any) {
          setToast({ msg: 'Erro na importação: ' + e.message, type: 'error' });
      } finally {
          setImporting(false);
          setTimeout(() => setToast(null), 5000);
      }
  };

  return (
    <div className="p-8 bg-[#0F172A] min-h-screen text-white">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
           <p className="text-gray-400 text-sm mt-1">Gerencie seu conteúdo e usuários em tempo real.</p>
        </div>
        
        <Button onClick={() => setIsImportModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-blue-900/40 border border-white/10">
            <CloudLightning size={18} /> Importar Catálogo Massivo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Filmes no Catálogo" count={stats.movies} color="bg-blue-500" icon={<Film className="text-white/50" size={32}/>} />
        <StatCard title="Séries Ativas" count={stats.series} color="bg-indigo-500" icon={<Tv className="text-white/50" size={32}/>} />
        <StatCard title="Usuários Totais" count={stats.users} color="bg-purple-500" icon={<Users className="text-white/50" size={32}/>} />
      </div>

      <div className="bg-[#1E293B] p-6 rounded-lg shadow-xl border border-white/5">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <UserIcon size={20} className="text-blue-500"/> Usuários Recentes
        </h2>
        <div className="space-y-2">
           {recentUsers.length === 0 ? (
             <p className="text-gray-400 py-4 text-center border border-dashed border-white/10 rounded">Nenhum usuário encontrado ou banco de dados vazio.</p>
           ) : (
             recentUsers.map(u => (
               <div key={u.id} className="flex items-center justify-between p-3 bg-[#0F172A]/50 rounded-lg hover:bg-[#0F172A] transition-colors border border-transparent hover:border-white/5">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden text-white border border-white/10">
                     {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{u.name[0]}</div>}
                   </div>
                   <div>
                     <p className="font-bold text-sm text-white">{u.name}</p>
                     <p className="text-xs text-gray-500">{u.email}</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest ${u.subscriptionStatus === 'blocked' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {u.subscriptionStatus === 'blocked' ? 'Bloqueado' : 'Ativo'}
                    </span>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>

      {/* IMPORT MODAL */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Importador Massivo (TMDB)">
          <div className="space-y-6">
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20 text-sm text-blue-200">
                  <p className="mb-2 font-bold flex items-center gap-2"><Database size={16}/> Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                      <li>Conecta diretamente na API do <strong>The Movie Database</strong>.</li>
                      <li>Baixa metadados (Títulos, Capas, Gêneros).</li>
                      <li>Gera automaticamente links para o <strong>PlayerFlix</strong>.</li>
                      <li>Você precisa de uma <strong>API Key (v3)</strong> do TMDB (é gratuita).</li>
                  </ul>
              </div>

              {!importing ? (
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chave API TMDB</label>
                          <Input 
                              value={importApiKey} 
                              onChange={e => setImportApiKey(e.target.value)} 
                              placeholder="Ex: a1b2c3d4e5..." 
                              className="!bg-[#0F172A]"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">Chave configurada: {importApiKey.substring(0,8)}...</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Conteúdo</label>
                              <select 
                                  className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                  value={importType}
                                  onChange={e => setImportType(e.target.value as any)}
                              >
                                  <option value="movie">Filmes</option>
                                  <option value="tv">Séries</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Páginas (20 itens/pág)</label>
                              <select 
                                  className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                  value={importPages}
                                  onChange={e => setImportPages(Number(e.target.value))}
                              >
                                  <option value={1}>1 Página (20 itens)</option>
                                  <option value={5}>5 Páginas (100 itens)</option>
                                  <option value={20}>20 Páginas (400 itens)</option>
                                  <option value={50}>50 Páginas (1.000 itens)</option>
                                  <option value={100}>100 Páginas (2.000 itens)</option>
                                  <option value={500}>500 Páginas (10.000 itens)</option>
                              </select>
                          </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                          <Button onClick={handleMassImport} className="bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/30">
                              <Download size={18}/> Iniciar Importação
                          </Button>
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-8 space-y-6">
                      <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-white mb-1">Importando...</h3>
                          <p className="text-blue-400 font-mono text-sm">{importProgress.current} / {importProgress.total} itens processados</p>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                              className="bg-blue-500 h-full transition-all duration-300" 
                              style={{ width: `${(importProgress.current / Math.max(importProgress.total, 1)) * 100}%` }}
                          />
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-xs mx-auto">Processando: {importProgress.lastTitle}</p>
                      <p className="text-xs text-yellow-500/80">Por favor, não feche esta janela.</p>
                  </div>
              )}
          </div>
      </Modal>

    </div>
  );
};

const StatCard = ({ title, count, color, icon }: { title: string, count: number, color: string, icon: any }) => (
  <div className="bg-[#1E293B] p-6 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between relative overflow-hidden group">
    <div className="relative z-10">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-4xl font-black text-white mt-2 tracking-tighter">{count}</p>
    </div>
    <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
        {icon}
    </div>
    <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${color} blur-3xl opacity-20`} />
  </div>
);

// --- USER MANAGEMENT (Mantido igual) ---
import { Users } from 'lucide-react';

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
    const [mode, setMode] = useState<'upload' | 'link'>('link');

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
  
  // Edit Mode State
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

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

  const openAddModal = () => {
      setEditingItem(null);
      resetForm();
      setIsModalOpen(true);
  };

  const openEditModal = (item: ContentItem) => {
      setEditingItem(item);
      setFormData({
          title: item.title,
          description: item.description,
          genre: item.genre,
          year: item.year,
          type: item.type
      });
      setPosterUrlInput(item.posterUrl);
      setPosterFile(null);
      if (item.type === 'movie') {
          setVideoUrlInput(item.videoUrl || '');
          setVideoFile(null);
      }
      setIsModalOpen(true);
  };

  const handleSaveContent = async () => {
    // Validação Básica
    if (!formData.title) {
        setToast({ msg: 'O Título é obrigatório.', type: 'error' });
        return;
    }
    // Permite salvar sem capa se for edição rápida
    if (!posterFile && !posterUrlInput && !editingItem) {
        setToast({ msg: 'Por favor, adicione uma capa (Link ou Arquivo).', type: 'error' });
        return;
    }

    setLoading(true);
    try {
      // 1. Handle Poster
      let finalPosterUrl = posterUrlInput || editingItem?.posterUrl || '';
      if (posterFile) {
         try {
             finalPosterUrl = await api.storage.uploadFile(posterFile, 'media');
         } catch (e) {
             throw new Error("Erro no upload da capa. Verifique se o 'Storage' do Supabase está público.");
         }
      }

      // 2. Handle Video
      let finalVideoUrl = editingItem?.videoUrl || '';
      if (type === 'movie') {
          finalVideoUrl = videoUrlInput;
          if (videoFile) {
              try {
                  finalVideoUrl = await api.storage.uploadFile(videoFile, 'media');
              } catch (e) {
                  throw new Error("Erro no upload do vídeo.");
              }
          }
      }

      if (editingItem) {
          // UPDATE
          await api.content.updateContent(editingItem.id, {
              title: formData.title,
              description: formData.description,
              genre: formData.genre,
              year: formData.year,
              posterUrl: finalPosterUrl,
              videoUrl: finalVideoUrl,
          }, type);
          setToast({ msg: 'Item atualizado com sucesso!', type: 'success' });
      } else {
          // CREATE
          const newItem: ContentItem = {
            id: '', 
            title: formData.title!,
            description: formData.description || 'Sem descrição',
            posterUrl: finalPosterUrl,
            videoUrl: finalVideoUrl,
            genre: formData.genre || 'Geral',
            year: formData.year || 2024,
            type: type,
            createdAt: new Date().toISOString()
          };
          
          await api.content.addContent(newItem);
          setToast({ msg: 'Conteúdo criado! Atualizando lista...', type: 'success' });
      }
      
      setIsModalOpen(false);
      resetForm();
      // Pequeno delay para garantir que o banco atualizou
      setTimeout(loadData, 500);
    } catch (e: any) {
      setToast({ msg: `Erro ao salvar: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', genre: '', year: new Date().getFullYear(), type });
    setPosterFile(null);
    setPosterUrlInput('');
    setVideoFile(null);
    setVideoUrlInput('');
    setEditingItem(null);
  }

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja remover este item permanentemente?')) {
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
         setToast({ msg: 'Título do episódio é obrigatório', type: 'error' });
         return;
     }

     setLoading(true);
     try {
         let vidUrl = episodeVideoUrlInput;
         if (episodeVideoFile) {
             try {
                vidUrl = await api.storage.uploadFile(episodeVideoFile, 'media');
             } catch (e) {
                throw new Error("Erro no upload do vídeo do episódio.");
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
         setToast({ msg: 'Episódio adicionado!', type: 'success' });
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
           <p className="text-gray-400">Adicione conteúdo manualmente ou edite o que foi importado.</p>
        </div>
        <Button onClick={openAddModal} className="shadow-lg shadow-blue-900/40">
          <Plus size={18} /> Novo {type === 'movie' ? 'Filme' : 'Série'}
        </Button>
      </div>

      {/* Search & Table */}
      <div className="bg-[#1E293B] rounded-xl shadow-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-[#1E293B]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
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
                  <td className="px-6 py-3 font-medium text-white">
                      {item.title}
                      {(!item.videoUrl && type === 'movie') && <span className="ml-2 text-[10px] text-red-400 border border-red-500/30 px-1 rounded bg-red-500/10">Sem Vídeo</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-400">{item.year}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {type === 'series' && (
                           <Button variant="secondary" onClick={() => openEpisodes(item)} className="px-3 py-1 text-xs border-blue-500/30 hover:border-blue-500">
                               <Tv size={14} className="mr-2"/> Episódios
                           </Button>
                       )}
                       <button onClick={() => openEditModal(item)} className="p-2 hover:bg-yellow-500/20 rounded-md text-yellow-400 transition-colors" title="Editar Link de Vídeo">
                           <Edit2 size={16} />
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                  <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                          Nenhum conteúdo encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Content Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Editar' : 'Adicionar'} ${type === 'movie' ? 'Filme' : 'Série'}`}>
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
               label="Ano de Lançamento" 
               value={formData.year} 
               onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-500">Descrição / Sinopse</label>
            <textarea 
              className="w-full rounded-md bg-[#0F172A] border border-white/10 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white placeholder-gray-600"
              rows={3}
              placeholder="Digite uma breve descrição..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Media Inputs (Url or File) */}
          <div className="space-y-6 pt-4 border-t border-white/10">
              <MediaInput 
                 label="Capa / Pôster (Obrigatório)"
                 accept="image/*"
                 currentFileName={posterFile?.name || null}
                 currentUrlValue={posterUrlInput}
                 onFileChange={setPosterFile}
                 onUrlChange={setPosterUrlInput}
              />

              {type === 'movie' && (
                  <div className="bg-blue-900/10 p-5 rounded-lg border border-blue-500/20 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <PlayCircle size={16} className="text-blue-400"/>
                        <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">Link do Vídeo / Upload</p>
                    </div>
                    <MediaInput 
                        label="Arquivo de Filme ou URL (MP4, YouTube, etc)"
                        accept="video/*"
                        currentFileName={videoFile?.name || null}
                        currentUrlValue={videoUrlInput}
                        onFileChange={setVideoFile}
                        onUrlChange={setVideoUrlInput}
                    />
                 </div>
              )}
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/10 mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="!text-gray-400 hover:!text-white">Cancelar</Button>
            <Button onClick={handleSaveContent} isLoading={loading} className="w-32">
                {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Episode Manager Modal */}
      {selectedSeries && (
          <Modal isOpen={isEpisodeModalOpen} onClose={() => setIsEpisodeModalOpen(false)} title={`Episódios: ${selectedSeries.title}`}>
              <div className="space-y-6">
                  {/* List Episodes */}
                  <div className="max-h-60 overflow-y-auto space-y-2 border-b border-white/10 pb-4 pr-2">
                      {episodes.length === 0 && <p className="text-gray-500 text-sm text-center py-4 bg-white/5 rounded">Nenhum episódio cadastrado nesta série.</p>}
                      {episodes.map(ep => (
                          <div key={ep.id} className="flex items-center justify-between bg-[#0F172A] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                              <span className="text-sm font-medium text-white flex items-center gap-2">
                                  <span className="text-xs bg-blue-600 px-1.5 rounded text-white font-bold">S{ep.season} E{ep.number}</span>
                                  {ep.title}
                              </span>
                              <button onClick={() => handleDeleteEpisode(ep.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>

                  {/* Add Episode Form */}
                  <div className="bg-blue-900/10 p-5 rounded-xl space-y-4 border border-blue-500/20">
                      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                          <Plus size={14}/> Adicionar Novo Episódio
                      </h4>
                      <Input 
                        className="!bg-[#0F172A] !text-white !border-blue-500/20 focus:!border-blue-500" 
                        placeholder="Título do Episódio" 
                        value={newEpisode.title}
                        onChange={e => setNewEpisode({...newEpisode, title: e.target.value})}
                      />
                      <div className="flex gap-3">
                          <Input className="!bg-[#0F172A] !text-white !border-blue-500/20" type="number" label="Temporada" value={newEpisode.season} onChange={e => setNewEpisode({...newEpisode, season: Number(e.target.value)})}/>
                          <Input className="!bg-[#0F172A] !text-white !border-blue-500/20" type="number" label="Episódio" value={newEpisode.number} onChange={e => setNewEpisode({...newEpisode, number: Number(e.target.value)})}/>
                      </div>
                      
                      <MediaInput 
                         label="Vídeo do Episódio"
                         accept="video/*"
                         currentFileName={episodeVideoFile?.name || null}
                         currentUrlValue={episodeVideoUrlInput}
                         onFileChange={setEpisodeVideoFile}
                         onUrlChange={setEpisodeVideoUrlInput}
                      />

                      <Button onClick={handleAddEpisode} isLoading={loading} className="w-full mt-2">Adicionar Episódio</Button>
                  </div>
              </div>
          </Modal>
      )}
    </div>
  );
};
