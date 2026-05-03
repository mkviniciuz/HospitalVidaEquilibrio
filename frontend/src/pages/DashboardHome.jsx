import { useParams, Link } from 'react-router-dom';
import { Users, BedDouble, LayoutDashboard, Settings, Stethoscope, ClipboardList, ArrowRight } from 'lucide-react';

const QUICK_ACCESS = {
  administrador: [
    {
      icon: Users,
      title: 'Gestão de Usuários',
      desc: 'Gerencie os funcionários cadastrados no sistema.',
      to: '/dashboard/administrador/users',
      color: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-200',
      link: '/dashboard/administrador/users',
    },
    {
      icon: Users,
      title: 'Pacientes',
      desc: 'Gerencie o cadastro de pacientes da clínica.',
      to: '/dashboard/administrador/patients',
      color: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200',
    },
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Controle a ocupação e liberação dos leitos.',
      to: '/dashboard/administrador/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
  ],
  recepcao: [
    {
      icon: Users,
      title: 'Pacientes',
      desc: 'Gerencie o cadastro de pacientes da clínica.',
      to: '/dashboard/recepcao/patients',
      color: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200',
    },
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Controle a ocupação e liberação dos leitos.',
      to: '/dashboard/recepcao/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
  ],
  enfermeira: [
    {
      icon: BedDouble,
      title: 'Mapa de Leitos',
      desc: 'Veja os pacientes internados e acesse prontuários.',
      to: '/dashboard/enfermeira/beds',
      color: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
    {
      icon: ClipboardList,
      title: 'Prontuários',
      desc: 'Registre medicações e observações clínicas.',
      to: '/dashboard/enfermeira/beds',
      color: 'bg-teal-50 text-teal-600',
      border: 'hover:border-teal-200',
    },
  ],
  medico: [
    {
      icon: Stethoscope,
      title: 'Pacientes',
      desc: 'Consulte o status dos pacientes internados.',
      to: '/dashboard/medico/patients',
      color: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200',
    },
  ],
};

const greetings = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export default function DashboardHome() {
  const { role } = useParams();

  const roleLabel = {
    medico: 'Médico', enfermeira: 'Enfermeira',
    administrador: 'Administrador', recepcao: 'Recepção',
  }[role] || role;

  const cards = QUICK_ACCESS[role] || [];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="mb-10 animate-slide-up">
        <p className="text-sm text-slate-500 font-medium mb-1">{greetings()}, bem-vindo(a) 👋</p>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Painel de <span className="text-primary">{roleLabel}</span></h1>
        <p className="text-slate-500 text-sm">
          Selecione uma área abaixo para começar.
        </p>
      </div>

      {/* Quick Access Cards */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {cards.map((card, i) => (
            <Link
              key={i}
              to={card.to}
              className={`group bg-white rounded-2xl p-6 border-2 border-slate-100 ${card.border} transition-all duration-200 hover-lift flex flex-col gap-4 animate-slide-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-base mb-1">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                Acessar <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats row placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-slide-up delay-300">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <BedDouble className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Visão Geral</p>
            <p className="font-bold text-slate-800 text-lg">Sistema Ativo</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Atividade</p>
            <p className="font-bold text-slate-800 text-lg">Resumo do Dia</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Configurações</p>
            <p className="font-bold text-slate-800 text-lg">Preferências</p>
          </div>
        </div>
      </div>
    </div>
  );
}
