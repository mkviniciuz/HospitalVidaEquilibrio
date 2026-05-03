import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  X, Pill, ClipboardList, Plus, Trash2, Clock, 
  AlertCircle, CheckCircle2, Loader2, Calendar, Play, Square, AlertTriangle
} from 'lucide-react';

export default function ClinicalRecordModal({ isOpen, onClose, patientId, patientName }) {
  const [medications, setMedications] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', frequency_hours: '' });
  const [newObs, setNewObs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizador de tempo real
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await api.getClinicalRecord(patientId);
      setMedications(data.medications);
      setObservations(data.observations);
    } catch (err) {
      console.error('Erro ao buscar prontuário:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchData();
    }
  }, [isOpen, patientId]);

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMed.name) return;
    setSubmitting(true);
    try {
      await api.addMedication({ 
        ...newMed, 
        patient_id: patientId,
        frequency_hours: newMed.frequency_hours ? parseInt(newMed.frequency_hours) : null
      });
      setNewMed({ name: '', dosage: '', frequency: '', frequency_hours: '' });
      fetchData();
    } catch (err) {
      alert('Erro ao adicionar medicamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTimer = async (id, currentIsRunning) => {
    try {
      const action = currentIsRunning ? 'stop' : 'start';
      await api.toggleMedicationTimer(id, action);
      fetchData();
    } catch (err) {
      alert('Erro ao alterar cronômetro: ' + err.message);
    }
  };

  const handleDeleteMedication = async (id) => {
    console.log('CHAMANDO API PARA EXCLUIR MEDICAMENTO:', id);
    try {
      const result = await api.deleteMedication(id);
      console.log('RESULTADO DA API:', result);
      fetchData();
    } catch (err) {
      console.error('ERRO FATAL NA EXCLUSÃO:', err);
      alert('Erro ao remover: ' + err.message);
    }
  };

  const handleAddObservation = async (e) => {
    e.preventDefault();
    if (!newObs.trim()) return;
    setSubmitting(true);
    try {
      await api.addObservation({ patient_id: patientId, content: newObs });
      setNewObs('');
      fetchData();
    } catch (err) {
      alert('Erro ao adicionar observação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteObservation = async (id) => {
    console.log('CHAMANDO API PARA EXCLUIR OBSERVAÇÃO:', id);
    try {
      const result = await api.deleteObservation(id);
      console.log('RESULTADO DA API:', result);
      fetchData();
    } catch (err) {
      console.error('ERRO FATAL NA EXCLUSÃO:', err);
      alert('Erro ao remover: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Prontuário de Enfermagem</h2>
              <p className="text-sm text-slate-500">Paciente: <span className="font-bold text-slate-700">{patientName}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Carregando registros...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* COLUNA: MEDICAMENTOS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-500" />
                    Medicamentos
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                    {medications.length} Ativos
                  </span>
                </div>

                {/* Formulário Novo Med */}
                <form onSubmit={handleAddMedication} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        placeholder="Nome do Medicamento"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={newMed.name}
                        onChange={e => setNewMed({...newMed, name: e.target.value})}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Dosagem (ex: 500mg)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={newMed.dosage}
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Descrição (ex: 6/6h)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={newMed.frequency}
                      onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="Horas Exatas (ex: 6)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={newMed.frequency_hours}
                      onChange={e => setNewMed({...newMed, frequency_hours: e.target.value})}
                      min="1"
                    />
                  </div>
                  <button 
                    disabled={submitting || !newMed.name}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Adicionar Medicamento
                  </button>
                </form>

                {/* Lista de Meds */}
                <div className="space-y-3">
                  {medications.map(med => {
                    let isOverdue = false;
                    let diff = 0;
                    let percentage = 0;
                    let timeString = '00:00:00';

                    if (med.frequency_hours && med.is_timer_running) {
                      const start = new Date(med.timer_started_at);
                      const end = new Date(start.getTime() + med.frequency_hours * 60 * 60 * 1000);
                      diff = end - currentTime;
                      isOverdue = diff <= 0;
                      
                      if (!isOverdue) {
                        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
                        timeString = `${h}:${m}:${s}`;
                        const totalMs = med.frequency_hours * 60 * 60 * 1000;
                        percentage = diff / totalMs;
                      }
                    }

                    const radius = 22;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage * circumference);

                    return (
                      <div key={med.id} className={`bg-white p-3 rounded-2xl border-2 ${med.is_timer_running && !isOverdue ? 'border-emerald-500' : isOverdue ? 'border-red-500' : 'border-slate-200'} shadow-sm flex items-center justify-between group transition-all`}>
                        <div className="flex items-center gap-4">
                          
                          {/* Visual Timer Left Side */}
                          {med.frequency_hours ? (
                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                <circle 
                                  cx="32" 
                                  cy="32" 
                                  r={radius} 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="transparent" 
                                  className={isOverdue ? 'text-red-500' : 'text-emerald-500'} 
                                  strokeDasharray={circumference} 
                                  strokeDashoffset={strokeDashoffset} 
                                  strokeLinecap="round" 
                                  style={{ transition: 'stroke-dashoffset 1s linear' }} 
                                />
                              </svg>
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  // Sempre força o reinício (start)
                                  api.toggleMedicationTimer(med.id, 'start').then(() => fetchData());
                                }} 
                                className={`z-10 hover:opacity-70 transition-opacity flex items-center justify-center w-8 h-8 rounded-full ${isOverdue ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}
                                title="Recomeçar Contagem"
                              >
                                <Play className="w-5 h-5 ml-1 fill-current" />
                              </button>
                            </div>
                          ) : (
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                              <Pill className="w-8 h-8" />
                            </div>
                          )}

                          {/* Medication Info */}
                          <div>
                            <p className="font-bold text-slate-800 text-base leading-tight">{med.name}</p>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                {med.dosage} • {med.frequency}
                              </span>
                              
                              {med.frequency_hours && med.is_timer_running && (
                                <span className={`text-sm font-bold font-mono ${isOverdue ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {isOverdue ? 'ATRASADO!' : timeString}
                                </span>
                              )}
                              
                              {med.frequency_hours && !med.is_timer_running && (
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pausado</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          {med.is_timer_running && (
                             <button 
                               type="button"
                               onClick={(e) => { e.stopPropagation(); api.toggleMedicationTimer(med.id, 'stop').then(() => fetchData()); }}
                               className="p-1.5 text-slate-400 hover:text-orange-500 transition-all rounded-md hover:bg-orange-50"
                               title="Pausar Cronômetro"
                             >
                               <Square className="w-4 h-4 fill-current" />
                             </button>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteMedication(med.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50"
                            title="Remover medicamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {medications.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8 italic">Nenhum medicamento prescrito.</p>
                  )}
                </div>
              </div>

              {/* COLUNA: OBSERVAÇÕES */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  Observações Clínicas
                </h3>

                {/* Formulário Novo Obs */}
                <form onSubmit={handleAddObservation} className="space-y-3">
                  <textarea 
                    placeholder="Descreva a evolução do paciente, sinais vitais, etc..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 outline-none focus:ring-2 focus:ring-primary text-sm min-h-[120px]"
                    value={newObs}
                    onChange={e => setNewObs(e.target.value)}
                  />
                  <button 
                    disabled={submitting || !newObs.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Registrar Observação
                  </button>
                </form>

                {/* Lista de Obs */}
                <div className="space-y-4">
                  {observations.map(obs => (
                    <div key={obs.id} className="relative bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(obs.created_at).toLocaleString('pt-BR')}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteObservation(obs.id); }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-all z-30"
                          title="Remover observação"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {obs.content}
                      </p>
                    </div>
                  ))}
                  {observations.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8 italic">Sem observações registradas.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
