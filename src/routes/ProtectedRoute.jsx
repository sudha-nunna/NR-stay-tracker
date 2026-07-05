import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BiLoaderAlt } from 'react-icons/bi';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <BiLoaderAlt className="animate-spin text-blue-600 text-4xl" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};