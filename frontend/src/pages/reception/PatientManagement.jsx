import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Pencil, Trash2, Plus, User, Search, UserCheck, ChevronRight } from 'lucide-react';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { role } = useParams();

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este paciente? O leito será liberado se estiver ocupado.')) {
      try {
        await api.deletePatient(id);
        fetchPatients();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <UserCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pacientes</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-3 animate-slide-up delay-100">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nome ou CPF..."
              className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-white pl-10 py-2.5 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => navigate(`/dashboard/${role}/patients/new`)}
            className="hover-lift bg-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm whitespace-nowrap shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-slide-up delay-150">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Paciente</th>
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">CPF</th>
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Contato</th>
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Convênio</th>
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Data Entrada</th>
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredPatients.map((patient, i) => (
              <tr
                key={patient.id}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group animate-slide-right"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-800 dark:text-white font-bold text-sm">{patient.name}</p>
                      {patient.social_name && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">"{patient.social_name}"</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-mono font-medium">{patient.cpf}</td>
                <td className="p-4">
                  <div className="flex flex-col text-xs gap-0.5">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{patient.whatsapp || patient.phone || '—'}</span>
                    <span className="text-slate-400 dark:text-slate-500">{patient.email || '—'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    patient.service_type === 'Particular'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {patient.service_type || 'Particular'}
                  </span>
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                  {new Date(patient.entry_date).toLocaleDateString('pt-BR')}
                  <span className="text-slate-400 dark:text-slate-500 ml-1">
                    {new Date(patient.entry_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => navigate(`/dashboard/${role}/patients/edit/${patient.id}`)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/8 rounded-xl transition-all hover:scale-110"
                      title="Editar Ficha"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan="6" className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 animate-fade-in">
                    <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-full">
                      <User className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-slate-400">Nenhum paciente encontrado.</p>
                    <p className="text-sm">Tente ajustar o filtro ou cadastre um novo paciente.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
