import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('bruinplan_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const signup = (userData) => {
    const userProfile = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      major: userData.major || '',
      minor: userData.minor || '',
      graduationYear: userData.graduationYear || '',
      graduationQuarter: userData.graduationQuarter || '',
      units: userData.units || 0,
      gpa: userData.gpa || 0.0,
      darsConnected: userData.darsConnected || false
    };

    localStorage.setItem('bruinplan_user', JSON.stringify(userProfile));
    setUser(userProfile);
    setIsAuthenticated(true);
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('bruinplan_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('bruinplan_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    signup,
    updateProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
