import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ExploreCourses from './pages/ExploreCourses';
import Plan from './pages/Plan';
import DegreeProgress from './pages/DegreeProgress';
import './App.css';
import OnboardingWizard from "./pages/OnboardingWizard";
import AuthCallback from "./pages/AuthCallback";



function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/signup" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/onboarding" /> : <SignUp />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/onboarding" /> : <Login />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/onboarding" : "/signup"} />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ExploreCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <Plan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <DegreeProgress />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/profile" : "/signup"} />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />

    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
