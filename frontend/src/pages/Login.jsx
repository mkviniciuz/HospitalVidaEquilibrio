import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Lock, Mail, HeartPulse } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate(`/dashboard/${response.user.role}`);
    } catch (err) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary to-[#3d7a6e] p-12 text-white animate-fade-in">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight">Vida Equilíbrio</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Cuidado<br />com excelência,<br />gestão inteligente.
          </h2>
          <p className="text-white/70 text-base max-w-xs leading-relaxed">
            Plataforma integrada de gestão hospitalar para médicos, enfermeiras e equipe administrativa.
          </p>
        </div>

        {/* Decorative floating cards */}
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-sm font-medium border border-white/20 animate-slide-up delay-200">
            🛏️ Controle de Leitos
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-sm font-medium border border-white/20 animate-slide-up delay-300">
            💊 Prontuário Digital
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-sm font-medium border border-white/20 animate-slide-up delay-400">
            🔔 Alertas em Tempo Real
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-slate-50 p-8">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8 text-primary font-bold text-xl">
            <HeartPulse className="w-6 h-6" />
            Vida Equilíbrio
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo de volta!</h1>
          <p className="text-slate-500 text-sm mb-8">Entre com suas credenciais para acessar.</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2 animate-bounce-in">
              <span className="w-4 h-4 flex-shrink-0">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="animate-slide-up delay-75">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="email">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="email"
                  type="text"
                  className="input-modern pl-10"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-slide-up delay-150">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-modern pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 animate-slide-up delay-200">
              <button
                type="submit"
                disabled={loading}
                className="hover-lift w-full bg-primary text-white font-semibold py-3 rounded-xl transition-all focus:ring-4 focus:ring-primary/20 outline-none flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Entrar no Sistema
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
