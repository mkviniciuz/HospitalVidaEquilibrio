import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { api } from '../../services/api';
import { User, Phone, MapPin, HeartPulse, CreditCard, ShieldCheck, ChevronLeft, Save, Loader2 } from 'lucide-react';

export default function PatientForm() {
  const { id, role } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(null);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [serverError, setServerError] = useState('');

  const isEdit = !!id;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      gender: 'masculino',
      service_type: 'Particular',
      lgpd_consent: false
    }
  });

  const dob = watch('dob');

  // Calcular idade automaticamente
  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? calculatedAge : null);
    }
  }, [dob]);

  // Carregar dados se for edição
  useEffect(() => {
    if (isEdit) {
      const fetchPatient = async () => {
        try {
          const patients = await api.getPatients();
          const patient = patients.find(p => p.id === parseInt(id));
          if (patient) {
            Object.keys(patient).forEach(key => {
              setValue(key, patient[key] === null ? '' : patient[key]);
            });
            // LGPD consent is stored as 0/1 in SQLite
            setValue('lgpd_consent', !!patient.lgpd_consent);
          }
        } catch (err) {
          setServerError('Erro ao carregar dados do paciente.');
        }
      };
      fetchPatient();
    }
  }, [id, isEdit, setValue]);

  // Busca de CEP (ViaCEP)
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue('address', data.logradouro);
          setValue('city', data.localidade);
          setValue('state', data.uf);
        }
      } catch (err) {
        console.error('Erro ao buscar CEP');
      } finally {
        setFetchingCep(false);
      }
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      let response;
      if (isEdit) {
        await api.updatePatient(id, data);
        alert('Paciente atualizado com sucesso!');
        navigate(`/dashboard/${role}/patients`);
      } else {
        response = await api.createPatient(data);
        alert('Paciente cadastrado com sucesso!');
        // Redirecionar para seleção de leito com o ID do paciente
        navigate(`/dashboard/${role}/beds`, { 
          state: { 
            patientId: response.id, 
            patientName: data.name 
          } 
        });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {isEdit ? 'Editar Cadastro' : 'Novo Cadastro de Paciente'}
        </h2>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
            {serverError}
          </div>
        )}

        {/* SEÇÃO: DADOS PESSOAIS */}
        <Section title="Dados Pessoais" icon={<User className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Nome Completo *</Label>
              <Input {...register('name', { required: 'Nome é obrigatório' })} error={errors.name} />
            </div>
            <div>
              <Label>Nome Social</Label>
              <Input {...register('social_name')} />
            </div>
            <div>
              <Label>CPF *</Label>
              <ControllerInput 
                mask="999.999.999-99" 
                {...register('cpf', { required: 'CPF é obrigatório' })} 
                error={errors.cpf} 
              />
            </div>
            <div>
              <Label>RG *</Label>
              <Input {...register('rg', { required: 'RG é obrigatório' })} error={errors.rg} />
            </div>
            <div>
              <Label>Data de Nascimento *</Label>
              <div className="relative">
                <Input type="date" {...register('dob', { required: 'Obrigatório' })} error={errors.dob} />
                {age !== null && (
                  <span className="absolute right-3 top-2.5 text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {age} anos
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>Sexo / Gênero *</Label>
              <Select {...register('gender')}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
          </div>
        </Section>

        {/* SEÇÃO: CONTATO E ENDEREÇO */}
        <Section title="Contato e Endereço" icon={<MapPin className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>WhatsApp / Celular *</Label>
              <ControllerInput 
                mask="(99) 99999-9999" 
                {...register('whatsapp', { required: 'Celular é obrigatório' })} 
                error={errors.whatsapp} 
              />
            </div>
            <div className="md:col-span-2">
              <Label>E-mail</Label>
              <Input type="email" {...register('email')} />
            </div>
            <div>
              <Label>CEP</Label>
              <div className="relative">
                <ControllerInput 
                  mask="99999-999" 
                  {...register('cep')} 
                  onBlur={handleCepBlur} 
                />
                {fetchingCep && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-primary" />}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Logradouro / Endereço</Label>
              <Input {...register('address')} />
            </div>
            <div>
              <Label>Número</Label>
              <Input {...register('address_number')} />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input {...register('address_complement')} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input {...register('city')} />
            </div>
            <div>
              <Label>Estado (UF)</Label>
              <Input {...register('state')} maxLength={2} />
            </div>
          </div>
        </Section>

        {/* SEÇÃO: SAÚDE E EMERGÊNCIA */}
        <Section title="Saúde e Emergência" icon={<HeartPulse className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Contato Emergência (Nome)</Label>
              <Input {...register('emergency_name')} />
            </div>
            <div>
              <Label>Telefone Emergência</Label>
              <ControllerInput mask="(99) 99999-9999" {...register('emergency_phone')} />
            </div>
            <div>
              <Label>Tipo Sanguíneo</Label>
              <Select {...register('blood_type')}>
                <option value="">Selecione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Alergias Conhecidas</Label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all min-h-[80px]"
                {...register('allergies')}
                placeholder="Descreva alergias a medicamentos, alimentos ou materiais..."
              />
            </div>
          </div>
        </Section>

        {/* SEÇÃO: FINANCEIRO */}
        <Section title="Financeiro / Plano de Saúde" icon={<CreditCard className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Atendimento</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="Particular" {...register('service_type')} className="w-4 h-4 accent-primary" />
                  <span className="text-slate-700 dark:text-slate-200">Particular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="Convênio" {...register('service_type')} className="w-4 h-4 accent-primary" />
                  <span className="text-slate-700 dark:text-slate-200">Convênio</span>
                </label>
              </div>
            </div>
            {watch('service_type') === 'Convênio' && (
              <>
                <div>
                  <Label>Nome do Plano / Convênio</Label>
                  <Input {...register('plan_name')} />
                </div>
                <div>
                  <Label>Número da Carteirinha</Label>
                  <Input {...register('card_number')} />
                </div>
                <div>
                  <Label>Validade do Cartão</Label>
                  <ControllerInput mask="99/99/9999" {...register('card_validity')} placeholder="DD/MM/AAAA" />
                </div>
              </>
            )}
          </div>
        </Section>

        {/* SEÇÃO: LGPD */}
        <Section title="Termos e Consentimento (LGPD)" icon={<ShieldCheck className="w-5 h-5" />}>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                {...register('lgpd_consent', { required: 'O consentimento é obrigatório' })} 
                className="mt-1 w-5 h-5 accent-primary rounded" 
              />
              <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Autorizo a **Clínica Vida Equilíbrio** a realizar o tratamento dos meus dados pessoais e sensíveis para fins de atendimento médico, diagnósticos e comunicações relacionadas à saúde, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
              </span>
            </label>
            {errors.lgpd_consent && <p className="text-red-500 text-xs mt-2">{errors.lgpd_consent.message}</p>}
          </div>
        </Section>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-[#4a8074] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEdit ? 'Salvar Alterações' : 'Finalizar Cadastro e Internar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Sub-componentes auxiliares
function Section({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-800 dark:text-white">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{children}</label>;
}

const Input = React.forwardRef(({ error, ...props }, ref) => (
  <div>
    <input
      ref={ref}
      className={`w-full px-4 py-2 border ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/20'} rounded-lg focus:ring-4 focus:border-primary outline-none transition-all dark:bg-slate-800 dark:text-white`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
  </div>
));

const ControllerInput = React.forwardRef(({ error, mask, ...props }, ref) => (
  <div>
    <input
      {...props}
      ref={ref}
      className={`w-full px-4 py-2 border ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/20'} rounded-lg focus:ring-4 focus:border-primary outline-none transition-all dark:bg-slate-800 dark:text-white`}
      placeholder={props.placeholder || mask.replace(/9/g, '_')}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
  </div>
));

const Select = React.forwardRef(({ error, children, ...props }, ref) => {
  return (
    <div>
      <select
        ref={ref}
        className={`w-full px-4 py-2 border ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/20'} rounded-lg focus:ring-4 focus:border-primary outline-none transition-all bg-white dark:bg-slate-800 dark:text-white`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
});
