import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Save, Upload, Settings, Image as ImageIcon, CheckCircle2, Loader2, Palette, Globe } from 'lucide-react';

export default function AppSettings() {
  const [settings, setSettings] = useState({
    app_name: 'Vida Equilíbrio',
    app_logo: '',
    app_primary_color: '#5d9e90'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.getAppSettings();
      setSettings(data);
      if (data.app_logo) {
        setPreviewUrl(data.app_logo.startsWith('http') ? data.app_logo : `http://localhost:3000${data.app_logo}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('app_name', settings.app_name);
      formData.append('app_primary_color', settings.app_primary_color);
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      await api.updateAppSettings(formData);
      setMessage({ text: 'Configurações atualizadas com sucesso!', type: 'success' });
      
      // Notificar outros componentes (se necessário) ou recarregar
      // window.location.reload(); 
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações do Aplicativo
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize a identidade visual e o comportamento do sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identidade Visual */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Identidade da Marca
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Hospital/Clínica</label>
                <input
                  type="text"
                  className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={settings.app_name}
                  onChange={e => setSettings({...settings, app_name: e.target.value})}
                  placeholder="Ex: Hospital Vida Equilíbrio"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cor Primária do Sistema</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                    value={settings.app_primary_color}
                    onChange={e => setSettings({...settings, app_primary_color: e.target.value})}
                  />
                  <input
                    type="text"
                    className="input-modern flex-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono"
                    value={settings.app_primary_color}
                    onChange={e => setSettings({...settings, app_primary_color: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Logo do Sistema</label>
              <div className="relative group">
                <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-xs text-slate-400">Nenhum logo enviado</p>
                    </>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Alterar Logo
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">Recomendado: PNG ou SVG transparente, 512x512px.</p>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slide-up ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-[#4a8074] text-white px-8 py-4 rounded-[1.8rem] font-black flex items-center gap-2 transition-all hover-lift disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            SALVAR CONFIGURAÇÕES
          </button>
        </div>
      </form>
    </div>
  );
}
