import React, { useState } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { User, Shield, Palette, LayoutTemplate, Moon, Sun, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Preferences() {
  const { theme, setTheme, layout, setLayout } = usePreferences();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const roleLabel = {
    medico: 'Médico', enfermeira: 'Enfermeira',
    administrador: 'Administrador', recepcao: 'Recepção'
  }[user.role] || user.role;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
      return;
    }
    
    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.updateMyPassword(currentPassword, newPassword);
      setPwdMessage({ type: 'success', text: res.message || 'Senha atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMessage({ type: 'error', text: err.message || 'Erro ao alterar a senha.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Preferências</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Gerencie seu perfil, segurança e aparência do sistema.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
              activeTab === 'profile' 
                ? 'bg-primary text-white shadow-md shadow-primary/20 hover-lift' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-5 h-5" /> Meu Perfil
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
              activeTab === 'security' 
                ? 'bg-primary text-white shadow-md shadow-primary/20 hover-lift' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-5 h-5" /> Segurança
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
              activeTab === 'appearance' 
                ? 'bg-primary text-white shadow-md shadow-primary/20 hover-lift' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-5 h-5" /> Aparência
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:p-8 animate-slide-up">
            
            {/* --- TAB: PERFIL --- */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-[#4a8074] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                    <p className="text-primary font-semibold text-sm mb-1">{roleLabel}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Nome Completo</label>
                    <input type="text" readOnly value={user.name} className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 opacity-70 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">E-mail</label>
                    <input type="text" readOnly value={user.email} className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 opacity-70 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Cargo / Nível de Acesso</label>
                    <input type="text" readOnly value={roleLabel} className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 opacity-70 cursor-not-allowed" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                  * Para alterar seu nome ou e-mail, entre em contato com o Administrador do sistema.
                </p>
              </div>
            )}

            {/* --- TAB: SEGURANÇA --- */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Alterar Senha
                </h3>
                
                {pwdMessage.text && (
                  <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${pwdMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-900/50 dark:text-emerald-400'}`}>
                    {pwdMessage.type === 'error' ? <Shield className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <p className="text-sm font-medium">{pwdMessage.text}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Senha Atual</label>
                    <input 
                      type="password" 
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Nova Senha</label>
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" 
                      placeholder="No mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Confirmar Nova Senha</label>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" 
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full bg-primary hover:bg-[#4a8074] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                  >
                    {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Atualizar Senha
                  </button>
                </form>
              </div>
            )}

            {/* --- TAB: APARÊNCIA --- */}
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                {/* Tema */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Modo de Exibição</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <Sun className="w-8 h-8" />
                      <span className="font-semibold text-sm">Modo Claro</span>
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <Moon className="w-8 h-8" />
                      <span className="font-semibold text-sm">Modo Escuro</span>
                    </button>
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Layout do Menu</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <button 
                      onClick={() => setLayout('top')}
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${layout === 'top' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <LayoutTemplate className="w-8 h-8" />
                      <span className="font-semibold text-sm">Menu Superior</span>
                    </button>
                    <button 
                      onClick={() => setLayout('sidebar')}
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${layout === 'sidebar' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <div className="w-8 h-8 border-2 border-current rounded overflow-hidden flex">
                        <div className="w-2.5 h-full bg-current opacity-40"></div>
                      </div>
                      <span className="font-semibold text-sm">Menu Lateral</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                    A alteração do layout refletirá imediatamente em toda a sua navegação.
                  </p>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
