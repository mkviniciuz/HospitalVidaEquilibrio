import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { HeartPulse, LogOut, Bell, User, Home, BedDouble, Users, Settings, ShieldCheck, Menu, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { api } from '../services/api';
import { usePreferences } from '../contexts/PreferencesContext';

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { layout, reloadPreferences, appSettings } = usePreferences();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', newState);
  };

  const getNavLinks = (currentRole) => {
    const links = [{ to: `/dashboard/${currentRole}`, label: 'Início', icon: Home }];
    if (['administrador', 'recepcao', 'enfermeira', 'medico'].includes(currentRole)) {
      links.push({ to: `/dashboard/${currentRole}/beds`, label: 'Mapa de Leitos', icon: BedDouble });
    }

    if (['administrador', 'recepcao'].includes(currentRole)) {
      links.push({ to: `/dashboard/${currentRole}/patients`, label: 'Pacientes', icon: Users });
    }
    
    if (currentRole === 'administrador') {
      links.push({ to: `/dashboard/${currentRole}/users`, label: 'Usuários', icon: ShieldCheck });
      links.push({ to: `/dashboard/${currentRole}/logs`, label: 'Logs do Sistema', icon: History });
      links.push({ to: `/dashboard/${currentRole}/app-settings`, label: 'Configurações do App', icon: Settings });
    }
    
    links.push({ to: `/dashboard/${currentRole}/preferences`, label: 'Minhas Preferências', icon: User });
    
    return links;
  };

  const navLinks = getNavLinks(role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (['enfermeira', 'administrador', 'medico'].includes(role)) {
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
    reloadPreferences();
    navigate('/login');
  };

  const roleConfig = {
    medico:       { label: 'Médico',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',    dot: 'bg-blue-500' },
    enfermeira:   { label: 'Enfermeira',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    administrador:{ label: 'Administrador',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
    recepcao:     { label: 'Recepção',        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  dot: 'bg-amber-500' },
  };
  const rc = roleConfig[role] || { label: role, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };

  const NotificationsPanel = () => (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all outline-none"
      >
        <Bell className="w-5 h-5" />
        {overdueCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
            {overdueCount > 9 ? '9+' : overdueCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className={`animate-slide-down absolute mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100] ${layout === 'sidebar' ? 'left-0 sm:left-full sm:ml-2' : 'right-0'}`}>
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notificações de Medicação
            </h4>
            {overdueCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
            {timers.length > 0 ? (
              timers.map((t, i) => (
                <div key={t.id} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors animate-slide-right delay-${i * 75}`}>
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg mt-0.5 flex-shrink-0">
                      <Bell className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-red-500 dark:text-red-400 font-bold mb-0.5">⏰ Medicação Atrasada</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.patient_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Leito {t.room} - {t.bed_number}</p>
                      <p className="text-sm mt-1 text-emerald-700 dark:text-emerald-400 font-semibold">{t.name} <span className="font-normal text-xs text-slate-500 dark:text-slate-400">({t.dosage})</span></p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                <div className="text-3xl mb-2">✅</div>
                Nenhuma medicação atrasada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (layout === 'sidebar') {
    return (
      <div className="min-h-screen flex transition-all duration-300">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} glass-sidebar flex flex-col transition-all duration-300 z-40 relative shrink-0`}>
          <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center justify-between w-full">
              <Link to={`/dashboard/${role}`} className="flex items-center gap-2.5 text-primary font-bold text-lg hover:opacity-80 transition-opacity">
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg shrink-0 overflow-hidden w-8 h-8 flex items-center justify-center">
                  {appSettings?.app_logo ? (
                    <img src={appSettings.app_logo.startsWith('http') ? appSettings.app_logo : `http://localhost:3000${appSettings.app_logo}`} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <HeartPulse className="w-5 h-5 text-primary" />
                  )}
                </div>
                {!isSidebarCollapsed && <span className="leading-tight whitespace-nowrap overflow-hidden">{appSettings?.app_name || 'Vida Equilíbrio'}</span>}
              </Link>
              {!isSidebarCollapsed && ['enfermeira', 'administrador', 'medico'].includes(role) && <NotificationsPanel />}
            </div>
            {isSidebarCollapsed && ['enfermeira', 'administrador', 'medico'].includes(role) && <NotificationsPanel />}
          </div>
          
          <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl mb-4 transition-all shadow-sm ${rc.color} ${isSidebarCollapsed ? 'justify-center p-2 mx-auto' : 'justify-center px-3 py-2'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${rc.dot}`}></span>
              {!isSidebarCollapsed && <span className="whitespace-nowrap font-bold tracking-wide">{rc.label}</span>}
            </div>
            
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  title={isSidebarCollapsed ? link.label : ''}
                  className={`flex items-center gap-3 rounded-xl font-medium transition-all group ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shadow-[0_0_15px_rgba(93,158,144,0.15)]' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button 
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center gap-2 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all p-2 rounded-xl"
              title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {!isSidebarCollapsed && <span className="text-sm font-medium">Recolher Menu</span>}
            </button>

            <button onClick={handleLogout} className={`flex w-full items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-2 rounded-xl text-sm font-medium ${isSidebarCollapsed ? 'justify-center' : 'px-3'}`}>
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">Sair</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto h-screen animate-fade-in relative">
          <Outlet />
        </main>
      </div>
    );
  }

  // Top layout
  return (
    <div className="min-h-screen flex flex-col transition-colors">
      {/* Header */}
      <header className={`sticky top-0 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-6 py-3 flex justify-between items-center transition-all duration-300 ${scrolled ? 'shadow-lg border-transparent' : 'border-b border-white/20 dark:border-white/5'}`}>
        <div className="flex items-center gap-6">
          <Link
            to={`/dashboard/${role}`}
            className="flex items-center gap-2.5 text-primary font-bold text-lg hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center overflow-hidden">
              {appSettings?.app_logo ? (
                <img src={appSettings.app_logo.startsWith('http') ? appSettings.app_logo : `http://localhost:3000${appSettings.app_logo}`} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <HeartPulse className="w-5 h-5 text-primary" />
              )}
            </div>
            {appSettings?.app_name || 'Vida Equilíbrio'}
          </Link>

          {/* Nav links in horizontal layout */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${rc.color}`}>
            <span className={`w-2 h-2 rounded-full ${rc.dot}`}></span>
            {rc.label}
          </div>

          {['enfermeira', 'administrador', 'medico'].includes(role) && <NotificationsPanel />}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all px-3 py-2 rounded-xl text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
