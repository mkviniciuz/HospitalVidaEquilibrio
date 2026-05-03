import { useParams, useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'medico': return 'Médico';
      case 'enfermeira': return 'Enfermeira';
      case 'administrador': return 'Administrador';
      case 'recepcao': return 'Recepção';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Activity className="w-6 h-6" />
          Clínica Vida Equilíbrio
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
            Painel: {getRoleDisplayName(role)}
          </span>
          <button 
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Bem-vindo(a) ao seu painel</h1>
          <p className="text-slate-600">
            Você está acessando a área restrita com permissões de <strong className="text-primary">{getRoleDisplayName(role)}</strong>.
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2">Visão Geral</h3>
              <p className="text-slate-500 text-sm">Resumo das atividades do dia.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2">Agenda</h3>
              <p className="text-slate-500 text-sm">Nenhum compromisso pendente.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2">Avisos</h3>
              <p className="text-slate-500 text-sm">Sistema atualizado recentemente.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
