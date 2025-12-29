import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ContentItem, User } from '../types';
import { Button, Input, Modal, Toast } from '../components/Common';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

// --- DASHBOARD ---

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ movies: 0, series: 0, users: 1 });

  useEffect(() => {
    const load = async () => {
      const movies = await api.content.getMovies();
      const series = await api.content.getSeries();
      setStats({ movies: movies.length, series: series.length, users: 124 }); // Mock user count
    };
    load();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-[#0F172A]">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Filmes Ativos" count={stats.movies} color="bg-blue-500" />
        <StatCard title="Séries Ativas" count={stats.series} color="bg-indigo-500" />
        <StatCard title="Usuários Registrados" count={stats.users} color="bg-purple-500" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        <div className="space-y-4">
           {[1,2,3].map(i => (
             <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
               <div>
                 <p className="font-medium text-gray-800">Novo usuário registrado</p>
                 <p className="text-sm text-gray-500">user_{i}@email.com</p>
               </div>
               <span className="text-xs text-gray-400">Há {i}h</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
    </div>
    <div className={`w-12 h-12 rounded-full ${color} opacity-20`} />
  </div>
);


// --- CONTENT MANAGER (MOVIES & SERIES) ---

export const ContentManager = ({ type }: { type: 'movie' | 'series' }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '', description: '', genre: '', year: new Date().getFullYear(), posterUrl: '', videoUrl: '', type
  });

  const loadData = async () => {
    const data = type === 'movie' ? await api.content.getMovies() : await api.content.getSeries();
    setItems(data);
  };

  useEffect(() => {
    loadData();
    setFormData(prev => ({ ...prev, type }));
  }, [type]);

  const handleSave = async () => {
    if (!formData.title || !formData.posterUrl) {
      setToast({ msg: 'Preencha os campos obrigatórios', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const newItem: ContentItem = {
        id: crypto.randomUUID(),
        title: formData.title!,
        description: formData.description || '',
        posterUrl: formData.posterUrl!,
        videoUrl: formData.videoUrl || '',
        genre: formData.genre || 'Geral',
        year: formData.year || 2024,
        type: type,
        createdAt: new Date().toISOString()
      };
      await api.content.addContent(newItem);
      setToast({ msg: `✅ ${type === 'movie' ? 'Filme' : 'Série'} adicionado com sucesso!`, type: 'success' });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', genre: '', year: new Date().getFullYear(), posterUrl: '', videoUrl: '', type });
      loadData();
    } catch (e) {
      setToast({ msg: '❌ Erro ao processar solicitação.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Tem certeza que deseja remover este item?')) {
      await api.content.deleteContent(id, type);
      loadData();
      setToast({ msg: 'Item removido.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold text-[#0F172A] capitalize">Gerenciar {type === 'movie' ? 'Filmes' : 'Séries'}</h1>
           <p className="text-gray-500">Adicione, edite ou remova conteúdo do catálogo.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Adicionar {type === 'movie' ? 'Filme' : 'Série'}
        </Button>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Gênero</th>
                <th className="px-6 py-4">Ano</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <img src={item.posterUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">{item.genre}</span>
                  </td>
                  <td className="px-6 py-3">{item.year}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2 hover:bg-gray-100 rounded-md text-gray-500"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-md text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adicionar ${type === 'movie' ? 'Filme' : 'Série'}`}>
        <div className="space-y-4">
          <Input 
             className="!text-gray-900 !bg-white !border-gray-300"
             label="Título" 
             placeholder="Ex: Matrix" 
             value={formData.title} 
             onChange={e => setFormData({...formData, title: e.target.value})} 
          />
          
          <div className="grid grid-cols-2 gap-4">
             <Input 
               className="!text-gray-900 !bg-white !border-gray-300"
               label="Gênero" 
               placeholder="Ex: Ação" 
               value={formData.genre} 
               onChange={e => setFormData({...formData, genre: e.target.value})} 
            />
             <Input 
               className="!text-gray-900 !bg-white !border-gray-300"
               type="number"
               label="Ano" 
               value={formData.year} 
               onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-500">Descrição</label>
            <textarea 
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <Input 
             className="!text-gray-900 !bg-white !border-gray-300"
             label="URL do Poster" 
             placeholder="https://..." 
             value={formData.posterUrl} 
             onChange={e => setFormData({...formData, posterUrl: e.target.value})} 
          />
          
          {type === 'movie' && (
             <Input 
               className="!text-gray-900 !bg-white !border-gray-300"
               label="URL do Vídeo (MP4)" 
               placeholder="https://..." 
               value={formData.videoUrl} 
               onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
            />
          )}

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="!text-gray-500">Cancelar</Button>
            <Button onClick={handleSave} isLoading={loading}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
