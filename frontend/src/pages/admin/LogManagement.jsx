import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, Search, Filter, Calendar, User, Activity, Clock, Eye, X, Info } from 'lucide-react';

export default function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.user_name?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
      );
    }

    if (filterRole !== 'all') {
      result = result.filter(log => log.user_role === filterRole);
    }

    setFilteredLogs(result);
  }, [searchTerm, filterRole, logs]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getRoleBadge = (role) => {
    const configs = {
      administrador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      medico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      enfermeira: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      recepcao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return configs[role] || 'bg-slate-100 text-slate-700';
  };

  const renderDetails = (details) => {
    if (!details) return '—';
    try {
      const parsed = JSON.parse(details);
      return (
        <div className="space-y-2">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm border-b border-slate-50 dark:border-slate-800 pb-1 last:border-0">
              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">{key}:</span>
              <span className="text-slate-600 dark:text-slate-400 break-all">
                {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return details;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Carregando logs do sistema...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <History className="w-6 h-6" />
            </div>
            Logs do Sistema
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Rastreabilidade completa de todas as ações realizadas na plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            className="p-2.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/20"
            title="Atualizar"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou detalhe..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/40 outline-none dark:text-white min-w-[150px]"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Todos os Cargos</option>
            <option value="administrador">Administrador</option>
            <option value="medico">Médico</option>
            <option value="enfermeira">Enfermeira</option>
            <option value="recepcao">Recepção</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Data e Hora</th>
                <th className="p-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Usuário</th>
                <th className="p-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Ação</th>
                <th className="p-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Detalhes</th>
                <th className="p-5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider text-center">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-primary" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{log.user_name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter ${getRoleBadge(log.user_role)}`}>
                        {log.user_role}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{log.action}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm text-slate-500 dark:text-slate-500 italic max-w-md block truncate" title={log.details}>
                      {log.details || '—'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Nenhum registro encontrado para os filtros aplicados.</p>
                      <button 
                        onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
                        className="text-primary text-sm font-bold hover:underline"
                      >
                        Limpar todos os filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[110] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Detalhes do Log</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{selectedLog.action}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data e Hora</label>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Usuário</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedLog.user_name}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${getRoleBadge(selectedLog.user_role)}`}>
                      {selectedLog.user_role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Content */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 border-l-4 border-primary pl-3">Conteúdo da Ação</label>
                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-inner">
                  {renderDetails(selectedLog.details)}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
