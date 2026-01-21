import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ExploreCourses from "./pages/ExploreCourses";
import Plan from "./pages/Plan";
import DegreeProgress from "./pages/DegreeProgress";
import OnboardingWizard from "./pages/OnboardingWizard";
import AuthCallback from "./pages/AuthCallback";
import WelcomePage from "./components/ProfileSetup/WelcomePage";

import "./App.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/Signup" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<SignUp />} />
      {/* OAuth callback must be public */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Auth pages */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/onboarding" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/onboarding" replace /> : <SignUp />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* Main app */}
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

      {/* Default */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/onboarding" : "/login"} replace />} />

      {/* Catch-all (optional but recommended) */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
