import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h1>
        <p className="text-slate-600 mb-6">
          Você não tem permissão para acessar esta página. Verifique suas credenciais com o administrador do sistema.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary hover:bg-[#4a8074] text-white font-medium py-2 px-6 rounded-lg transition-colors focus:ring-4 focus:ring-primary/30 outline-none"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
