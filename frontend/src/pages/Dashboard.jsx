import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, Link } from 'react-router-dom';
import { HeartPulse, LogOut, Bell, ChevronDown, User } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Shadow header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (role === 'enfermeira' || role === 'administrador') {
      const checkTimers = async () => {
        try {
          const activeTimers = await api.getActiveTimers();
          const now = new Date();
          const overdue = activeTimers.filter(t => {
            if (!t.frequency_hours) return false;
            const start = new Date(t.timer_started_at);
            const end = new Date(start.getTime() + t.frequency_hours * 60 * 60 * 1000);
            return end <= now;
          });
          setTimers(overdue);
          setOverdueCount(overdue.length);
        } catch (err) {
          console.error('Erro ao buscar timers', err);
        }
      };
      checkTimers();
      const interval = setInterval(checkTimers, 30000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const roleConfig = {
    medico:       { label: 'Médico',         color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
    enfermeira:   { label: 'Enfermeira',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    administrador:{ label: 'Administrador',   color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    recepcao:     { label: 'Recepção',        color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  };
  const rc = roleConfig[role] || { label: role, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-3 flex justify-between items-center transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm border-b border-slate-100'}`}>
        <Link
          to={`/dashboard/${role}`}
          className="flex items-center gap-2.5 text-primary font-bold text-lg hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <HeartPulse className="w-5 h-5 text-primary" />
          </div>
          Clínica Vida Equilíbrio
        </Link>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${rc.color}`}>
            <span className={`w-2 h-2 rounded-full ${rc.dot}`}></span>
            {rc.label}
          </div>

          {/* Notification bell — enfermeiras e admins */}
          {(role === 'enfermeira' || role === 'administrador') && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
                {overdueCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="animate-slide-down absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      Notificações de Medicação
                    </h4>
                    {overdueCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {timers.length > 0 ? (
                      timers.map((t, i) => (
                        <div key={t.id} className={`p-4 hover:bg-slate-50 transition-colors animate-slide-right delay-${i * 75}`}>
                          <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
                              <Bell className="w-3.5 h-3.5 text-red-500" />
                            </div>
                            <div>
                              <p className="text-xs text-red-500 font-bold mb-0.5">⏰ Medicação Atrasada</p>
                              <p className="text-sm font-bold text-slate-800">{t.patient_name}</p>
                              <p className="text-xs text-slate-500">Leito {t.room} - {t.bed_number}</p>
                              <p className="text-sm mt-1 text-emerald-700 font-semibold">{t.name} <span className="font-normal text-xs text-slate-500">({t.dosage})</span></p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        <div className="text-3xl mb-2">✅</div>
                        Nenhuma medicação atrasada.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all px-3 py-2 rounded-xl text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
