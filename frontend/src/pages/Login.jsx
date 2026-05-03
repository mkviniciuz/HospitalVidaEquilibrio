import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Lock, Mail, HeartPulse, ShieldCheck, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { usePreferences } from '../contexts/PreferencesContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { reloadPreferences, appSettings } = usePreferences();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      reloadPreferences();
      navigate(`/dashboard/${response.user.role}`);
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white dark:bg-slate-950">
      
      {/* LEFT PANEL - Branding & Visual */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        {/* Abstract Background Gradient */}
        <div className="absolute inset-0 bg-primary shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#4a8074] to-[#2d5a50]"></div>
          
          {/* Animated Decorative Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-white/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-black/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden">
              {appSettings?.app_logo ? (
                <img src={appSettings.app_logo.startsWith('http') ? appSettings.app_logo : `http://localhost:3000${appSettings.app_logo}`} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <HeartPulse className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">{appSettings?.app_name || 'Vida Equilíbrio'}</span>
          </div>

          <div className="max-w-lg">
            <h2 className="text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Excelência no <br />
              <span className="text-primary-foreground/60 italic">Cuidado Clínico.</span>
            </h2>
            <p className="text-white/70 text-lg font-medium leading-relaxed max-w-sm">
              Gestão inteligente e humanizada para transformar a rotina hospitalar em resultados para a vida.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 animate-slide-up delay-300">
          <div className="px-5 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-white/90 text-sm font-bold flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
             Status: Sistema Online
          </div>
          <div className="px-5 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-white/90 text-sm font-bold flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-blue-300" />
             SSL de 256 bits
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-slate-50 dark:bg-slate-950">
        
        {/* Mobile Logo Only */}
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2">
           <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-primary" />
           </div>
           <span className="text-lg font-black text-slate-800 dark:text-white uppercase">{appSettings?.app_name || 'Vida Equilíbrio'}</span>
        </div>

        <div className="w-full max-w-[420px] animate-scale-in">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Acesso Restrito</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Entre com suas credenciais para continuar.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-3 animate-shake">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail ou Usuário</label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all text-sm font-medium"
                  placeholder="ex: joao.silva@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                <a href="#" className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest">Esqueci a senha</a>
              </div>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all text-sm font-medium"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#4a8074] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 mt-4 active:scale-95 group"
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>ACESSAR SISTEMA</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em]">
              Copyright © 2024 · Desenvolvido por Vida Equilíbrio Tech
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
