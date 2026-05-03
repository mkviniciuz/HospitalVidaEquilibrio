import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Mock function to simulate Node.js/SQLite API login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Simulating API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock user database with roles: 'enfermeira', 'medico', 'administrador', 'recepcao'
      let role = '';
      if (email.includes('medico')) role = 'medico';
      else if (email.includes('enfermeira')) role = 'enfermeira';
      else if (email.includes('admin')) role = 'administrador';
      else if (email.includes('recepcao')) role = 'recepcao';
      else throw new Error('Credenciais inválidas. Tente incluir medico, enfermeira, admin ou recepcao no email para simular.');

      const user = { email, role };
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to role-specific dashboard
      navigate(`/dashboard/${role}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">Clínica Vida Equilíbrio</h1>
          <p className="text-slate-500 text-sm mt-1">Acesso ao Sistema de Gestão</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              E-mail ou Usuário
            </label>
            <input
              id="email"
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-[#4a8074] text-white font-medium py-2.5 rounded-lg transition-colors focus:ring-4 focus:ring-primary/30 outline-none mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
