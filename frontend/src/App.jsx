import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardHome from './pages/DashboardHome';
import UserManagement from './pages/admin/UserManagement';

import PatientManagement from './pages/reception/PatientManagement';
import PatientForm from './pages/reception/PatientForm';
import BedManagement from './pages/reception/BedManagement';

function App() {
  return (
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
            
            {/* Sub-rota protegida exclusiva para administrador */}
            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Sub-rotas protegidas para recepção, enfermaria e administrador */}
            <Route element={<ProtectedRoute allowedRoles={['administrador', 'recepcao', 'enfermeira']} />}>
              <Route path="patients" element={<PatientManagement />} />
              <Route path="patients/new" element={<PatientForm />} />
              <Route path="patients/edit/:id" element={<PatientForm />} />
              <Route path="beds" element={<BedManagement />} />
            </Route>
          </Route>
        </Route>
        
        {/* Rota de fallback para 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
