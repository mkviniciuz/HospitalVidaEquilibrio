import { useParams, Link } from 'react-router-dom';
import { Users, BedDouble, LayoutDashboard, Settings, Stethoscope, ClipboardList, ArrowRight, History } from 'lucide-react';

const QUICK_ACCESS = {
  administrador: [
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      desc: 'Visualize, cadastre e edite informações dos pacientes.',
      to: '/dashboard/administrador/patients',
      color: 'bg-blue-100 text-blue-600',
      border: 'hover:border-blue-200',
    },
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Controle a ocupação e liberação dos leitos.',
      to: '/dashboard/administrador/beds',
      color: 'bg-emerald-100 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
    {
      icon: History,
      title: 'Logs do Sistema',
      desc: 'Histórico de todas as ações realizadas no sistema.',
      to: '/dashboard/administrador/logs',
      color: 'bg-orange-100 text-orange-600',
      border: 'hover:border-orange-200',
    },
  ],
  recepcao: [
    {
      icon: Users,
      title: 'Cadastro de Pacientes',
      desc: 'Gerencie o banco de dados de pacientes.',
      to: '/dashboard/recepcao/patients',
      color: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200',
    },
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Visualize a disponibilidade e vincule pacientes.',
      to: '/dashboard/recepcao/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
  ],
  enfermeira: [
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Acompanhe seus pacientes e administre medicamentos.',
      to: '/dashboard/enfermeira/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
  ],
  medico: [
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Visualize prontuários e prescreva tratamentos.',
      to: '/dashboard/medico/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    }
  ]
};

export default function DashboardHome() {
  const { role } = useParams();
  const cards = QUICK_ACCESS[role] || [];

  const roleLabels = {
    administrador: 'Administração',
    recepcao: 'Recepção',
    enfermeira: 'Enfermagem',
    medico: 'Médico'
  };

  const roleLabel = roleLabels[role] || role;

  const greetings = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Welcome Header */}
      <div className="mb-10 animate-slide-up">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{greetings()}, bem-vindo(a) 👋</p>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1">Painel de <span className="text-primary">{roleLabel}</span></h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Selecione uma área abaixo para começar a trabalhar.
        </p>
      </div>

      {/* Quick Access Cards */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((card, idx) => (
            <Link
              key={idx}
              to={card.to}
              className={`group relative p-8 rounded-[2.5rem] glass-card border transition-all hover-lift ${card.border}`}
            >
              <div className={`w-16 h-16 ${card.color} dark:bg-opacity-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 shadow-sm`}>
                <card.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{card.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{card.desc}</p>
              <div className="flex items-center text-primary font-bold text-sm">
                Acessar agora
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up delay-300">
        <div className="glass-card rounded-[2rem] p-6 flex items-center gap-4 transition-all">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Status Geral</p>
            <p className="font-black text-slate-800 dark:text-white text-lg">Monitoramento Ativo</p>
          </div>
        </div>
        
        <div className="glass-card rounded-[2rem] p-6 flex items-center gap-4 transition-all">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-2xl text-blue-600 dark:text-blue-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Equipe</p>
            <p className="font-black text-slate-800 dark:text-white text-lg">Plantão em Dia</p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6 flex items-center gap-4 transition-all">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-2xl text-purple-600 dark:text-purple-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Segurança</p>
            <p className="font-black text-slate-800 dark:text-white text-lg">Logs Auditados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
