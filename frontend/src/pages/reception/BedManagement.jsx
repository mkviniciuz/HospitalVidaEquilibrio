import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  BedDouble, User, CheckCircle2, Search, 
  UserPlus, LogOut, ArrowRight, X, ClipboardList,
  Users, LayoutGrid
} from 'lucide-react';
import ClinicalRecordModal from '../nurse/ClinicalRecordModal';

export default function BedManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [error, setError] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordPatient, setRecordPatient] = useState({ id: null, name: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role;

  // Apenas médicos e administradores podem dar alta e liberar leitos
  const canRelease = userRole === 'medico' || userRole === 'administrador';
  
  // Recepcionistas não podem ver o prontuário
  const canViewRecord = userRole !== 'recepcao';

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

  useEffect(() => { fetchData(); }, []);

  const openAssignModal = (bed) => {
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
    if (!selectedPatientId) { setError('Selecione um paciente para continuar.'); return; }
    try {
      await api.assignBed(selectedBed.id, selectedPatientId);
      setIsModalOpen(false);
      window.history.replaceState({}, document.title);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRelease = async (bed) => {
    if (!canRelease) return;
    if (window.confirm(`Deseja dar alta para ${bed.patient_name} e liberar o leito ${bed.number}?`)) {
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

  const filteredBeds = beds.filter(b => {
    if (filter === 'free') return !b.is_occupied;
    if (filter === 'occupied') return b.is_occupied;
    return true;
  }).filter(b => {
    if (!globalSearch) return true;
    if (!b.is_occupied) return false;
    
    const patient = patients.find(p => p.id === b.patient_id);
    const searchLower = globalSearch.toLowerCase();
    
    return b.patient_name?.toLowerCase().includes(searchLower) || patient?.cpf?.includes(globalSearch);
  });

  const maleBeds = filteredBeds.filter(b => b.type === 'masculino');
  const femaleBeds = filteredBeds.filter(b => b.type === 'feminino');

  const groupBedsByRoom = (bedsList) =>
    bedsList.reduce((acc, bed) => {
      if (!acc[bed.room]) acc[bed.room] = [];
      acc[bed.room].push(bed);
      return acc;
    }, {});

  const maleRooms = groupBedsByRoom(maleBeds);
  const femaleRooms = groupBedsByRoom(femaleBeds);

  const openClinicalRecord = (bed) => {
    setRecordPatient({ id: bed.patient_id, name: bed.patient_name });
    setIsRecordOpen(true);
  };

  const filteredPatientsForModal = patients
    .filter(p => p.gender === selectedBed?.type && !beds.some(b => b.patient_id === p.id))
    .filter(p =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.cpf.includes(patientSearch)
    );

  const totalOccupied = beds.filter(b => b.is_occupied).length;
  const totalFree = beds.filter(b => !b.is_occupied).length;
  const occupancyPct = beds.length > 0 ? Math.round((totalOccupied / beds.length) * 100) : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 animate-fade-in">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-sm">Carregando mapa de leitos...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16 animate-fade-in">

      {/* MODO INTERNAÇÃO */}
      {incomingPatientName && (
        <div className="bg-gradient-to-r from-primary to-[#4a8074] text-white p-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Internação em andamento</p>
              <h3 className="text-base font-bold">Escolha um leito para {incomingPatientName}</h3>
            </div>
          </div>
          <button onClick={clearIncomingFlow} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER + STATS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <BedDouble className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mapa de Leitos</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs">Ocupação em tempo real</p>
            </div>
          </div>

          {/* Busca de Paciente */}
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente internado (Nome/CPF)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* Stats inline */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{totalFree} livres</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{totalOccupied} ocupados</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-xl border border-primary/10 dark:border-primary/20">
              <span className="text-xs font-bold text-primary">{occupancyPct}% ocupação</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Todos', count: beds.length },
              { key: 'free', label: 'Livres', count: totalFree },
              { key: 'occupied', label: 'Ocupados', count: totalOccupied },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  filter === f.key
                    ? 'bg-primary text-white shadow shadow-primary/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === f.key ? 'bg-white/25' : 'bg-white text-slate-500'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-primary transition-all duration-700"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ALAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ALA FEMININA */}
        <WingSection
          title="Ala Feminina"
          icon="♀"
          rooms={femaleRooms}
          beds={femaleBeds}
          incomingGender="feminino"
          isIncomingMode={!!incomingPatientId}
          onAssign={openAssignModal}
          onRelease={handleRelease}
          onOpenRecord={openClinicalRecord}
          canRelease={canRelease}
          canViewRecord={canViewRecord}
        />

        {/* ALA MASCULINA */}
        <WingSection
          title="Ala Masculina"
          icon="♂"
          rooms={maleRooms}
          beds={maleBeds}
          incomingGender="masculino"
          isIncomingMode={!!incomingPatientId}
          onAssign={openAssignModal}
          onRelease={handleRelease}
          onOpenRecord={openClinicalRecord}
          canRelease={canRelease}
          canViewRecord={canViewRecord}
        />
      </div>

      {/* MODAL PRONTUÁRIO */}
      <ClinicalRecordModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        patientId={recordPatient.id}
        patientName={recordPatient.name}
      />

      {/* MODAL INTERNAÇÃO */}
      {isModalOpen && selectedBed && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Internar Paciente</h3>
                <p className="text-slate-400 text-xs mt-0.5">Leito {selectedBed.number} — {selectedBed.room} ({selectedBed.type})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {incomingPatientId && selectedBed.type === (patients.find(p => p.id === incomingPatientId)?.gender) ? (
                <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">Confirmar Internação?</h4>
                  <p className="text-sm text-slate-500 mb-5">
                    Alocar <strong className="text-primary">{incomingPatientName}</strong> neste leito?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button onClick={handleAssign} className="w-full bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-[#4a8074] transition-all flex items-center justify-center gap-2">
                      Confirmar Internação <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.history.replaceState({}, document.title)} className="text-slate-400 text-xs hover:underline mt-1">
                      Escolher outro paciente
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou CPF..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-white"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredPatientsForModal.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id.toString())}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                          selectedPatientId === p.id.toString()
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</p>
                          <p className="text-xs text-slate-400">CPF: {p.cpf}</p>
                        </div>
                        {selectedPatientId === p.id.toString() && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                    {filteredPatientsForModal.length === 0 && (
                      <div className="py-8 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum paciente disponível para esta ala.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAssign}
                    className="w-full py-3 bg-primary hover:bg-[#4a8074] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-40"
                    disabled={!selectedPatientId}
                  >
                    Vincular ao Leito
                  </button>
                </>
              )}

              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-medium">{error}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   WING SECTION
===================================================== */
function WingSection({ title, icon, rooms, beds, incomingGender, isIncomingMode, onAssign, onRelease, onOpenRecord, canRelease, canViewRecord }) {
  const occupied = beds.filter(b => b.is_occupied).length;

  return (
    <div className="h-full flex flex-col glass-card border-none rounded-none shadow-none">
      <div className="p-4 border-b border-slate-100/30 dark:border-slate-800/30 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] text-slate-500 font-medium">Controle de ocupação {icon}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-bold">
            <span className="text-rose-500">{occupied}</span>/{beds.length}
          </span>
          <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(93,158,144,0.6)]"
              style={{ width: beds.length > 0 ? `${(occupied / beds.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Rooms grid */}
      <div className="p-4 space-y-4">
        {Object.entries(rooms).map(([roomName, roomBeds]) => (
          <RoomCard
            key={roomName}
            name={roomName}
            beds={roomBeds}
            incomingGender={incomingGender}
            isIncomingMode={isIncomingMode}
            onAssign={onAssign}
            onRelease={onRelease}
            onOpenRecord={onOpenRecord}
            canRelease={canRelease}
            canViewRecord={canViewRecord}
          />
        ))}
        {Object.keys(rooms).length === 0 && (
          <div className="py-10 text-center text-slate-300">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs">Nenhum leito encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   ROOM CARD
===================================================== */
function RoomCard({ name, beds, incomingGender, isIncomingMode, onAssign, onRelease, onOpenRecord, canRelease, canViewRecord }) {
  const isCompatible = isIncomingMode && incomingGender === beds[0]?.type;

  return (
    <div className={`rounded-2xl border transition-all ${isCompatible ? 'ring-2 ring-primary/40 border-primary/30 bg-primary/5 shadow-lg shadow-primary/10' : 'border-white/10 glass-card p-0 overflow-hidden'}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/80 dark:border-slate-700/80">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{name}</span>
        {isCompatible && (
          <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold animate-pulse">Compatível</span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3">
        {beds.map(bed => (
          <BedItem
            key={bed.id}
            bed={bed}
            onAssign={() => onAssign(bed)}
            onRelease={() => onRelease(bed)}
            onOpenRecord={() => onOpenRecord(bed)}
            canRelease={canRelease}
            canViewRecord={canViewRecord}
          />
        ))}
      </div>
    </div>
  );
}

/* =====================================================
   BED ITEM — cor única (primary/slate)
===================================================== */
function BedItem({ bed, onAssign, onRelease, onOpenRecord, canRelease, canViewRecord }) {
  const isOccupied = !!bed.is_occupied;

  return (
    <div
      className={`group relative rounded-xl p-2.5 flex flex-col items-center justify-center text-center transition-all select-none border-2 min-h-[80px] ${
        isOccupied
          ? `bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${canViewRecord ? 'hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer' : 'cursor-default'}`
          : 'bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer'
      }`}
      onClick={() => {
        if (!isOccupied) onAssign();
        else if (canViewRecord) onOpenRecord();
      }}
    >
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wider">#{bed.number}</span>

      {isOccupied ? (
        <>
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center mb-1">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight line-clamp-1 max-w-full px-1" title={bed.patient_name}>
            {bed.patient_name?.split(' ')[0] || 'Paciente'}
          </span>

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 z-20">
            {canViewRecord && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenRecord(); }}
                className="p-1.5 bg-primary text-white rounded-lg shadow hover:bg-[#4a8074] transition-all hover:scale-110"
                title="Prontuário"
              >
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
            )}
            {canRelease && (
              <button
                onClick={(e) => { e.stopPropagation(); onRelease(); }}
                className="p-1.5 bg-slate-600 text-white rounded-lg shadow hover:bg-slate-700 transition-all hover:scale-110"
                title="Dar Alta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-1 group-hover:border-primary group-hover:bg-primary/10 transition-all">
            <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 group-hover:text-primary transition-colors">LIVRE</span>
        </>
      )}
    </div>
  );
}
