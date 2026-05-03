import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { 
  X, Pill, ClipboardList, Plus, Trash2, Clock, 
  AlertCircle, Loader2, Calendar, Play, Square, User, Activity, 
  Stethoscope, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

export default function ClinicalRecordModal({ isOpen, onClose, patientId, patientName }) {
  const [medications, setMedications] = useState([]);
  const [observations, setObservations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medications');
  
  // Extrair role do localStorage para restrição de abas
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isMedicoOrAdmin = user.role === 'medico' || user.role === 'administrador';

  // Form states
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '' });
  const [newObs, setNewObs] = useState('');
  const [newReport, setNewReport] = useState({ description: '', status: '' });
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMedForm, setShowMedForm] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Tick every second for timers
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await api.getClinicalRecord(patientId);
      setMedications(data.medications || []);
      setObservations(data.observations || []);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Erro ao buscar prontuário:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchData();
      setActiveTab(isMedicoOrAdmin ? 'reports' : 'medications');
      setShowMedForm(false);
      setShowObsForm(false);
      setShowReportForm(false);
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
        frequency_hours: newMed.frequency ? parseInt(newMed.frequency) : null
      });
      setNewMed({ name: '', dosage: '', frequency: '' });
      setShowMedForm(false);
      fetchData();
    } catch (err) {
      alert('Erro ao adicionar medicamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      await api.deleteMedication(id);
      fetchData();
    } catch (err) {
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
      setShowObsForm(false);
      fetchData();
    } catch (err) {
      alert('Erro ao adicionar observação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteObservation = async (id) => {
    try {
      await api.deleteObservation(id);
      fetchData();
    } catch (err) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newReport.description.trim() || !newReport.status) return;
    setSubmitting(true);
    try {
      await api.addMedicalReport({ 
        patient_id: patientId, 
        description: newReport.description, 
        status: newReport.status 
      });
      setNewReport({ description: '', status: '' });
      setShowReportForm(false);
      fetchData();
    } catch (err) {
      alert('Erro ao adicionar evolução');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await api.deleteMedicalReport(id);
      fetchData();
    } catch (err) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  if (!isOpen || user.role === 'recepcao') return null;

  return createPortal(
    /* z-[9999] garante ficar ACIMA de tudo (navbar z-40, etc) */
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center z-[9999] animate-fade-in pt-16 pb-4 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-80px)] flex flex-col animate-scale-in overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Prontuário de Enfermagem</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">{patientName}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 shrink-0 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('medications')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === 'medications'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Pill className="w-4 h-4" />
            Medicamentos
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'medications' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {medications.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('observations')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === 'observations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Observações
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'observations' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {observations.length}
            </span>
          </button>
          
          {isMedicoOrAdmin && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === 'reports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Evolução Médica
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'reports' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {reports.length}
              </span>
            </button>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 animate-fade-in">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
              <p className="text-sm">Carregando prontuário...</p>
            </div>
          ) : (
            <>
              {/* ── TAB: MEDICATIONS ── */}
              {activeTab === 'medications' && (
                <div className="p-5 space-y-4 animate-fade-in">
                  
                  {/* Add button toggle */}
                  {isMedicoOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowMedForm(!showMedForm)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${
                        showMedForm
                          ? 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
                          : 'border-primary/30 text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20'
                      }`}
                    >
                      <Plus className={`w-4 h-4 transition-transform ${showMedForm ? 'rotate-45' : ''}`} />
                      {showMedForm ? 'Cancelar' : 'Adicionar Medicamento'}
                    </button>
                  )}

                  {/* Form */}
                  {showMedForm && (
                    <form onSubmit={handleAddMedication} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-slide-down">
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Nome do Medicamento *"
                          className="col-span-2 input-modern dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm py-2"
                          value={newMed.name}
                          onChange={e => setNewMed({...newMed, name: e.target.value})}
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="Dosagem (ex: 500mg)"
                          className="input-modern dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm py-2"
                          value={newMed.dosage}
                          onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                        />
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">Frequência (a cada quantas horas)</label>
                          <input
                            type="number"
                            placeholder="Ex: 6 (a cada 6h)"
                            className="input-modern dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm py-2 w-full"
                            value={newMed.frequency}
                            onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                            min="1"
                          />
                        </div>
                      </div>
                      <button
                        disabled={submitting || !newMed.name}
                        className="w-full bg-primary hover:bg-[#4a8074] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Salvar Medicamento
                      </button>
                    </form>
                  )}

                  {/* Medications List */}
                  <div className="space-y-2.5">
                    {medications.map(med => {
                      let isOverdue = false;
                      let percentage = 0;
                      let timeString = '--:--:--';

                      if (med.frequency_hours && med.is_timer_running) {
                        const start = new Date(med.timer_started_at);
                        const end = new Date(start.getTime() + med.frequency_hours * 60 * 60 * 1000);
                        const diff = end - currentTime;
                        isOverdue = diff <= 0;
                        if (!isOverdue) {
                          const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
                          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                          const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
                          timeString = `${h}:${m}:${s}`;
                          percentage = diff / (med.frequency_hours * 60 * 60 * 1000);
                        }
                      }

                      const radius = 18;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (percentage * circumference);

                      return (
                        <div
                          key={med.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            med.is_timer_running && !isOverdue
                              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/30'
                              : isOverdue
                              ? 'border-red-400 bg-red-50/40 dark:bg-red-900/30'
                              : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {/* Circular timer */}
                          {med.frequency_hours ? (
                            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                <circle
                                  cx="24" cy="24" r={radius}
                                  stroke="currentColor" strokeWidth="3" fill="transparent"
                                  className={isOverdue ? 'text-red-400' : 'text-emerald-400'}
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                              </svg>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); api.toggleMedicationTimer(med.id, 'start').then(() => fetchData()); }}
                                className={`z-10 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 ${
                                  isOverdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                }`}
                                title="Reiniciar contagem"
                              >
                                <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                              <Pill className="w-5 h-5 text-slate-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{med.name}</p>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(med.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{[med.dosage, med.frequency ? `${med.frequency}h` : ''].filter(Boolean).join(' • ')}</p>
                            {med.frequency_hours && med.is_timer_running && (
                              <p className={`text-xs font-bold font-mono mt-0.5 ${isOverdue ? 'text-red-600' : 'text-emerald-600'}`}>
                                {isOverdue ? '⚠ ATRASADO!' : `⏱ ${timeString}`}
                              </p>
                            )}
                            {med.frequency_hours && !med.is_timer_running && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Cronômetro pausado</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {med.is_timer_running && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); api.toggleMedicationTimer(med.id, 'stop').then(() => fetchData()); }}
                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                title="Pausar"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                            {isMedicoOrAdmin && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteMedication(med.id); }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {medications.length === 0 && !showMedForm && (
                      <div className="py-10 text-center text-slate-400 dark:text-slate-500 animate-fade-in">
                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum medicamento prescrito ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB: OBSERVATIONS ── */}
              {activeTab === 'observations' && (
                <div className="p-5 space-y-4 animate-fade-in">

                  {/* Add button toggle */}
                  <button
                    type="button"
                    onClick={() => setShowObsForm(!showObsForm)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${
                      showObsForm
                        ? 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
                        : 'border-blue-300/60 text-blue-600 bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/50'
                    }`}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showObsForm ? 'rotate-45' : ''}`} />
                    {showObsForm ? 'Cancelar' : 'Nova Observação'}
                  </button>

                  {/* Form */}
                  {showObsForm && (
                    <form onSubmit={handleAddObservation} className="space-y-3 animate-slide-down">
                      <textarea
                        placeholder="Descreva a evolução do paciente, sinais vitais, intercorrências..."
                        className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm min-h-[100px] resize-none py-3"
                        value={newObs}
                        onChange={e => setNewObs(e.target.value)}
                        autoFocus
                      />
                      <button
                        disabled={submitting || !newObs.trim()}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Registrar Observação
                      </button>
                    </form>
                  )}

                  {/* Observations list */}
                  <div className="space-y-3">
                    {observations.map((obs, i) => (
                      <div
                        key={obs.id}
                        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 group animate-slide-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {new Date(obs.created_at).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteObservation(obs.id); }}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{obs.content}</p>
                      </div>
                    ))}

                    {observations.length === 0 && !showObsForm && (
                      <div className="py-10 text-center text-slate-400 dark:text-slate-500 animate-fade-in">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sem observações registradas.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB: REPORTS ── */}
              {activeTab === 'reports' && isMedicoOrAdmin && (
                <div className="p-5 space-y-4 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(!showReportForm)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${
                      showReportForm
                        ? 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
                        : 'border-purple-300/60 text-purple-600 bg-purple-50/50 dark:bg-purple-900/30 hover:bg-purple-50 dark:hover:bg-purple-900/50'
                    }`}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${showReportForm ? 'rotate-45' : ''}`} />
                    {showReportForm ? 'Cancelar' : 'Novo Relatório de Evolução'}
                  </button>

                  {/* Form */}
                  {showReportForm && (
                    <form onSubmit={handleAddReport} className="space-y-3 animate-slide-down">
                      <textarea
                        placeholder="Descreva a evolução do paciente..."
                        className="input-modern dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm min-h-[100px] resize-none py-3"
                        value={newReport.description}
                        onChange={e => setNewReport({...newReport, description: e.target.value})}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewReport({...newReport, status: 'melhorou'})}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            newReport.status === 'melhorou' 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <ArrowUpCircle className="w-5 h-5" /> Melhorou
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewReport({...newReport, status: 'piorou'})}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            newReport.status === 'piorou' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          <ArrowDownCircle className="w-5 h-5" /> Piorou
                        </button>
                      </div>
                      <button
                        disabled={submitting || !newReport.description.trim() || !newReport.status}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Salvar Relatório
                      </button>
                    </form>
                  )}

                  {/* Reports list */}
                  <div className="space-y-3">
                    {reports.map((report, i) => (
                      <div
                        key={report.id}
                        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 group animate-slide-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {report.status === 'melhorou' ? (
                              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1 rounded-full">
                                <ArrowUpCircle className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-full">
                                <ArrowDownCircle className="w-4 h-4" />
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.created_at).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                      </div>
                    ))}

                    {reports.length === 0 && !showReportForm && (
                      <div className="py-10 text-center text-slate-400 dark:text-slate-500 animate-fade-in">
                        <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum relatório médico inserido.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {medications.length} medicamento{medications.length !== 1 ? 's' : ''} · {observations.length} observaç{observations.length !== 1 ? 'ões' : 'ão'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
