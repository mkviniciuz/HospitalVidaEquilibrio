import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota padrão redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rotas Privadas */}
        <Route element={<ProtectedRoute allowedRoles={['medico', 'enfermeira', 'administrador', 'recepcao']} />}>
          {/* Rota genérica de dashboard para demonstração. O componente lerá o parametro da URL e mostrará a role */}
          <Route path="/dashboard/:role" element={<Dashboard />} />
        </Route>

        {/* Exemplos de rotas com controle restrito:
        <Route element={<ProtectedRoute allowedRoles={['medico']} />}>
          <Route path="/prontuarios" element={<ProntuariosMedicos />} />
        </Route>
        */}
        
        {/* Rota de fallback para 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
