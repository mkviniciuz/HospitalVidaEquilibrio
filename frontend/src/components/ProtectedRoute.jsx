import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  // Retrieve user from localStorage (or state management like Context/Redux)
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Se não houver usuário logado, redireciona para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se as roles permitidas foram fornecidas e o usuário não possui a role necessária
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Se tudo estiver OK, renderiza os componentes filhos
  return <Outlet />;
}
