// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (authToken, userData) => {
    try {
      // Save to state
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  // Update user profile
  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Get user's full name
  const getUserName = () => {
    return user?.name || user?.username || 'User';
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    getUserName
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;