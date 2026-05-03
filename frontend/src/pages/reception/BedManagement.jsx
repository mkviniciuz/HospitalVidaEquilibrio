import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  BedDouble, User, CheckCircle2, XCircle, Info, Search, 
  Filter, UserPlus, LogOut, ArrowRight, X, ClipboardList
} from 'lucide-react';
import ClinicalRecordModal from '../nurse/ClinicalRecordModal';

export default function BedManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, free, occupied
  
  // Modal selection state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [error, setError] = useState('');

  // Clinical Record State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordPatient, setRecordPatient] = useState({ id: null, name: '' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  const incomingPatientId = location.state?.patientId;
  const incomingPatientName = location.state?.patientName;

  const fetchData = async () => {
    try {
      const [bedsData, patientsData] = await Promise.all([
        api.getBeds(),
        api.getPatients()
      ]);
      setBeds(bedsData);
      setPatients(patientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (bed) => {
    // Se viemos do cadastro, verificar se o gênero bate com o leito
    const patientObj = patients.find(p => p.id === incomingPatientId);
    
    if (patientObj && patientObj.gender !== bed.type) {
      alert(`Este paciente é do gênero ${patientObj.gender.toUpperCase()} e não pode ser internado na ala ${bed.type.toUpperCase()}.`);
      return;
    }

    setSelectedBed(bed);
    if (patientObj && patientObj.gender === bed.type) {
      setSelectedPatientId(incomingPatientId.toString());
    } else {
      setSelectedPatientId('');
    }
    setPatientSearch('');
    setError('');
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedPatientId) {
      setError('Selecione um paciente para continuar.');
      return;
    }
    try {
      await api.assignBed(selectedBed.id, selectedPatientId);
      setIsModalOpen(false);
      // Limpar o state da navegação
      window.history.replaceState({}, document.title);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRelease = async (bed) => {
    if (window.confirm(`Deseja realmente dar alta para o paciente ${bed.patient_name} e liberar o leito ${bed.number}?`)) {
      try {
        await api.releaseBed(bed.id);
        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const clearIncomingFlow = () => {
    window.history.replaceState({}, document.title);
    navigate(location.pathname, { replace: true });
  };

  // Filtragem de leitos
  const filteredBeds = beds.filter(b => {
    if (filter === 'free') return !b.is_occupied;
    if (filter === 'occupied') return b.is_occupied;
    return true;
  });

  const maleBeds = filteredBeds.filter(b => b.type === 'masculino');
  const femaleBeds = filteredBeds.filter(b => b.type === 'feminino');

  const groupBedsByRoom = (bedsList) => {
    return bedsList.reduce((acc, bed) => {
      if (!acc[bed.room]) acc[bed.room] = [];
      acc[bed.room].push(bed);
      return acc;
    }, {});
  };

  const maleRooms = groupBedsByRoom(maleBeds);
  const femaleRooms = groupBedsByRoom(femaleBeds);

  const openClinicalRecord = (bed) => {
    setRecordPatient({ id: bed.patient_id, name: bed.patient_name });
    setIsRecordOpen(true);
  };

  // Filtragem de pacientes para o modal
  const filteredPatientsForModal = patients
    .filter(p => p.gender === selectedBed?.type && !beds.some(b => b.patient_id === p.id))
    .filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.cpf.includes(patientSearch)
    );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Carregando mapa de leitos...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* MODO INTERNAÇÃO - HEADER FLUTUANTE */}
      {incomingPatientName && (
        <div className="bg-primary text-white p-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-between animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-full">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Internação em andamento</p>
              <h3 className="text-lg font-bold">Escolha um leito para {incomingPatientName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs bg-white/10 px-3 py-1 rounded-full">
              Leitos compatíveis destacados abaixo
            </span>
            <button 
              onClick={clearIncomingFlow}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Cancelar internação"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <BedDouble className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Mapa de Leitos</h2>
            <p className="text-slate-500 text-sm">Visão geral da ocupação em tempo real.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
            label="Todos" 
            count={beds.length} 
          />
          <FilterButton 
            active={filter === 'free'} 
            onClick={() => setFilter('free')}
            label="Livres" 
            count={beds.filter(b => !b.is_occupied).length} 
            color="emerald"
          />
          <FilterButton 
            active={filter === 'occupied'} 
            onClick={() => setFilter('occupied')}
            label="Ocupados" 
            count={beds.filter(b => b.is_occupied).length} 
            color="rose"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ALA FEMININA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-pink-700 flex items-center gap-2">
              <span className="w-2 h-6 bg-pink-400 rounded-full"></span>
              Ala Feminina
            </h3>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              {femaleBeds.filter(b => b.is_occupied).length} / {femaleBeds.length} OCUPADOS
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(femaleRooms).map(([roomName, roomBeds]) => (
              <RoomCard 
                key={roomName} 
                name={roomName} 
                beds={roomBeds} 
                incomingGender="feminino"
                isIncomingMode={!!incomingPatientId}
                onAssign={openAssignModal}
                onRelease={handleRelease}
                onOpenRecord={openClinicalRecord}
              />
            ))}
          </div>
        </div>

        {/* ALA MASCULINA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-400 rounded-full"></span>
              Ala Masculina
            </h3>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {maleBeds.filter(b => b.is_occupied).length} / {maleBeds.length} OCUPADOS
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(maleRooms).map(([roomName, roomBeds]) => (
              <RoomCard 
                key={roomName} 
                name={roomName} 
                beds={roomBeds} 
                incomingGender="masculino"
                isIncomingMode={!!incomingPatientId}
                onAssign={openAssignModal}
                onRelease={handleRelease}
                onOpenRecord={openClinicalRecord}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE PRONTUÁRIO (ENFERMAGEM) */}
      <ClinicalRecordModal 
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        patientId={recordPatient.id}
        patientName={recordPatient.name}
      />

      {/* MODAL DE INTERNAÇÃO / ALOCAÇÃO */}
      {isModalOpen && selectedBed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Internar Paciente</h3>
                  <p className="text-slate-500 text-sm">Leito {selectedBed.number} - {selectedBed.room} ({selectedBed.type})</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {incomingPatientId && selectedBed.type === (patients.find(p => p.id === incomingPatientId)?.gender) ? (
                // MODO RÁPIDO PARA NOVO PACIENTE
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Confirmar Internação Direta?</h4>
                  <p className="text-sm text-slate-600 mb-6">
                    Deseja alocar <strong className="text-primary">{incomingPatientName}</strong> neste leito?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleAssign}
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-[#4a8074] transition-all flex items-center justify-center gap-2"
                    >
                      Sim, Confirmar Internação <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        window.history.replaceState({}, document.title);
                        setPatientSearch('');
                      }}
                      className="text-slate-400 text-xs hover:underline mt-2"
                    >
                      Escolher outro paciente da lista
                    </button>
                  </div>
                </div>
              ) : (
                // BUSCA NORMAL
                <>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou CPF..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredPatientsForModal.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id.toString())}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPatientId === p.id.toString() ? 'border-primary bg-primary/5' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                      >
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">CPF: {p.cpf}</p>
                        </div>
                        {selectedPatientId === p.id.toString() && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                    {filteredPatientsForModal.length === 0 && (
                      <div className="py-8 text-center text-slate-400">
                        <p className="text-sm">Nenhum paciente disponível para esta ala.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAssign}
                    className="w-full py-4 bg-primary hover:bg-[#4a8074] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 mt-4"
                    disabled={!selectedPatientId}
                  >
                    Vincular ao Leito
                  </button>
                </>
              )}
            </div>
            
            {error && <div className="mx-6 mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-medium">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, label, count, color = 'primary' }) {
  const colors = {
    primary: active ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    emerald: active ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    rose: active ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${active ? 'scale-105' : 'shadow-transparent' } ${colors[color]}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

function RoomCard({ name, beds, incomingGender, isIncomingMode, onAssign, onRelease, onOpenRecord }) {
  const isCompatible = isIncomingMode && incomingGender === beds[0]?.type;

  return (
    <div className={`bg-white rounded-2xl p-4 border transition-all ${isCompatible ? 'ring-2 ring-primary ring-offset-2 border-primary/50 shadow-lg shadow-primary/10' : 'border-slate-100 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
        {isCompatible && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full animate-pulse">Recomendado</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {beds.map(bed => (
          <BedItem 
            key={bed.id} 
            bed={bed} 
            onAssign={() => onAssign(bed)}
            onRelease={() => onRelease(bed)}
            onOpenRecord={() => onOpenRecord(bed)}
          />
        ))}
      </div>
    </div>
  );
}

function BedItem({ bed, onAssign, onRelease, onOpenRecord }) {
  const isOccupied = !!bed.is_occupied;
  
  return (
    <div 
      className={`group relative rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all h-24 border-2 ${
        isOccupied 
          ? 'bg-rose-50 border-rose-100 hover:border-rose-300 cursor-pointer' 
          : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 cursor-pointer'
      }`}
      onClick={isOccupied ? onOpenRecord : onAssign}
    >
      <span className={`text-[10px] font-bold mb-1 ${isOccupied ? 'text-rose-400' : 'text-emerald-400'}`}>
        #{bed.number}
      </span>
      
      {isOccupied ? (
        <>
          <User className="w-5 h-5 text-rose-500 mb-1" />
          <span className="text-[10px] font-bold text-rose-800 leading-tight line-clamp-1" title={bed.patient_name}>
            {bed.patient_name?.split(' ')[0] || 'Paciente'}
          </span>
          
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenRecord(); }}
              className="p-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-all"
              title="Prontuário"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onRelease(); }}
              className="p-2 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all"
              title="Dar Alta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-8 h-8 bg-emerald-200/50 rounded-full flex items-center justify-center mb-1 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <UserPlus className="w-4 h-4 text-emerald-600 group-hover:text-white" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600">LIVRE</span>
        </>
      )}
    </div>
  );
}
