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

  const signup = (apiUser) => {
    const userProfile = {
      id: apiUser.id,             
      firstName: apiUser.first_name || (apiUser.name ? apiUser.name.split(' ')[0] : ""),
      lastName: apiUser.last_name || (apiUser.name ? apiUser.name.split(' ').slice(1).join(' ') : ""),
      email: apiUser.email,
      major: apiUser.major || "",
      minor: apiUser.minor || "",
      graduationYear: apiUser.graduation_year || "",
      graduationQuarter: apiUser.graduation_quarter || "",
      totalUnits: apiUser.total_units || 0,
      units: apiUser.total_units || apiUser.units || 0,
      gpa: apiUser.gpa || 0.0,
      darsConnected: apiUser.dars_connected || false,
    };

    localStorage.setItem("bruinplan_user", JSON.stringify(userProfile));
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
