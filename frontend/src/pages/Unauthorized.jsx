import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const handleGoBack = () => {
    if (role) {
      navigate(`/dashboard/${role}`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl animate-bounce-subtle">
              <ShieldAlert className="w-16 h-16 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Acesso Negado</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Oops! Parece que você tentou acessar uma área restrita. Suas permissões atuais não permitem visualizar este conteúdo.
          </p>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 group"
          >
            Voltar para o Início
          </button>
          
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Dúvidas? Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
