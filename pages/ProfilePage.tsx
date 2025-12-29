import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Button, Input, Toast } from '../components/Common';
import { Upload, User as UserIcon, Link as LinkIcon } from 'lucide-react';

export const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', age: '', avatarUrl: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'link'>('link'); // Default to link
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentUser = await api.auth.initialize();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
            name: currentUser.name,
            age: currentUser.age?.toString() || '',
            avatarUrl: currentUser.avatarUrl || ''
        });
      }
    };
    load();
  }, []);

  const handleSave = async () => {
      if(!user) return;
      setLoading(true);
      try {
          let url = formData.avatarUrl;
          if (avatarMode === 'upload' && avatarFile) {
              try {
                  url = await api.storage.uploadFile(avatarFile, 'avatars');
              } catch(e) {
                  throw new Error("Erro no upload. Tente usar um link de imagem.");
              }
          }

          const success = await api.users.updateProfile(user.id, {
              name: formData.name,
              age: parseInt(formData.age),
              avatarUrl: url
          });

          if(success) {
              setToast({ msg: 'Perfil atualizado!', type: 'success' });
              // Reload page or state to update sidebar
              window.location.reload(); 
          } else {
             throw new Error("Falha ao atualizar");
          }
      } catch(e: any) {
          setToast({ msg: e.message || 'Erro ao salvar perfil.', type: 'error' });
      } finally {
          setLoading(false);
      }
  };

  if (!user) return null;

  return (
    <div className="p-8 min-h-screen bg-[#0F172A] text-white">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      
      <div className="max-w-2xl mx-auto bg-[#1E293B] rounded-xl shadow-xl border border-white/5 p-8">
         <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
             <UserIcon className="text-blue-500"/> Editar Perfil
         </h1>

         <div className="flex flex-col md:flex-row gap-8 items-start">
             {/* Avatar Section */}
             <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                 <div className="w-32 h-32 rounded-full bg-slate-700 overflow-hidden shadow-inner border-4 border-[#0F172A]">
                     {avatarMode === 'upload' && avatarFile ? (
                         <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                     ) : formData.avatarUrl ? (
                         <img src={formData.avatarUrl} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erro')} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500 font-bold">{user.name[0]}</div>
                     )}
                 </div>
                 
                 <div className="flex bg-[#0F172A] rounded p-1 border border-white/10">
                    <button 
                        onClick={() => setAvatarMode('link')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${avatarMode === 'link' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Link
                    </button>
                    <button 
                        onClick={() => setAvatarMode('upload')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${avatarMode === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Upload
                    </button>
                 </div>

                 {avatarMode === 'upload' ? (
                     <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-white/10 w-full justify-center">
                         <Upload size={14}/> {avatarFile ? 'Arquivo Selecionado' : 'Escolher Foto'}
                         <input type="file" className="hidden" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
                     </label>
                 ) : (
                     <div className="w-full">
                         <Input 
                            placeholder="https://..." 
                            className="!bg-[#0F172A] !text-white !border-white/10 text-xs"
                            value={formData.avatarUrl}
                            onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                         />
                     </div>
                 )}
             </div>

             {/* Form Section */}
             <div className="flex-1 space-y-4 w-full">
                 <Input 
                   label="Nome Completo" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="!bg-[#0F172A] !text-white !border-white/10"
                 />
                 
                 <Input 
                   label="Email (Não editável)" 
                   value={user.email} 
                   readOnly 
                   className="!text-gray-400 !bg-[#0F172A]/50 !border-white/5 cursor-not-allowed"
                 />

                 <Input 
                   label="Idade" 
                   type="number"
                   value={formData.age} 
                   onChange={e => setFormData({...formData, age: e.target.value})}
                   className="!bg-[#0F172A] !text-white !border-white/10 w-32"
                 />

                 <div className="pt-4 border-t border-white/10 mt-6">
                     <Button onClick={handleSave} isLoading={loading}>Salvar Alterações</Button>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
