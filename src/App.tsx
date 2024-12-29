import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import OrganizerDashboard from './components/OrganizerDashboard';
import { SuperAdminDashboard } from './components/admin';
import LoadingSpinner from './components/shared/layouts/LoadingSpinner';
import FormBuilderPage from './components/form-builder/FormBuilderPage';

export default function App() {
  const { user, loading, isImpersonating } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/forms/create" element={<FormBuilderPage />} />
        <Route 
          path="/*" 
          element={
            isImpersonating ? (
              <OrganizerDashboard />
            ) : user.role === 'admin' || user.isSuperAdmin ? (
              <SuperAdminDashboard />
            ) : (
              <OrganizerDashboard />
            )
          } 
        />
      </Routes>
    </Router>
  );
}