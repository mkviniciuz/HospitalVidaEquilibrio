import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardHome from './pages/DashboardHome';
import UserManagement from './pages/admin/UserManagement';
import LogManagement from './pages/admin/LogManagement';
import AppSettings from './pages/admin/AppSettings';

import PatientManagement from './pages/reception/PatientManagement';
import PatientForm from './pages/reception/PatientForm';
import BedManagement from './pages/reception/BedManagement';
import Preferences from './pages/Preferences';
import { PreferencesProvider } from './contexts/PreferencesContext';

function App() {
  return (
    <PreferencesProvider>
      <Router>
      <Routes>
        {/* Rota padrão redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rotas Privadas Genéricas */}
        <Route element={<ProtectedRoute allowedRoles={['medico', 'enfermeira', 'administrador', 'recepcao']} />}>
          <Route path="/dashboard/:role" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="preferences" element={<Preferences />} />
            
            {/* Sub-rota protegida exclusiva para administrador */}
            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="logs" element={<LogManagement />} />
              <Route path="app-settings" element={<AppSettings />} />
            </Route>

            {/* Sub-rotas protegidas para recepção e administrador */}
            <Route element={<ProtectedRoute allowedRoles={['administrador', 'recepcao']} />}>
              <Route path="patients" element={<PatientManagement />} />
              <Route path="patients/new" element={<PatientForm />} />
              <Route path="patients/edit/:id" element={<PatientForm />} />
            </Route>

            {/* Rota de leitos, agora acessível ao médico também */}
            <Route element={<ProtectedRoute allowedRoles={['administrador', 'recepcao', 'enfermeira', 'medico']} />}>
              <Route path="beds" element={<BedManagement />} />
            </Route>
          </Route>
        </Route>
        
        {/* Rota de fallback para 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </PreferencesProvider>
  );
}

export default App;
