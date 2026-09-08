import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { clearClientStorage } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // SECURITY: the JWT lives ONLY inside an httpOnly cookie set by the backend
  // (JavaScript can never read it, so XSS cannot exfiltrate it). No token is
  // stored in localStorage anymore. Session presence is detected by asking
  // /auth/me on every app load; the browser attaches the cookie automatically.
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      const schoolData = response.data.school;

      setUser(userData);
      setUserRole(userData?.role);

      if (schoolData) {
        setSchool(schoolData);
      }
    } catch (error) {
      // No valid session cookie (or expired) -> stay logged out silently and
      // wipe any stale session data from localStorage/sessionStorage.
      clearClientStorage();
      setUser(null);
      setUserRole(null);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, school } = response.data;

      // The session cookie was set by the server response itself.
      setUser(user);
      setUserRole(user?.role);
      if (school) setSchool(school);

      toast.success('Login successful!');

      // Return the role so we can redirect properly
      return { success: true, user, school, role: user?.role };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Invalidate the session cookie server-side as well.
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore network errors; local state is cleared regardless.
    }
    // Clear ALL client-side session data: the server already cleared the
    // httpOnly cookie; localStorage and sessionStorage are wiped here.
    clearClientStorage();
    setUser(null);
    setUserRole(null);
    setSchool(null);
    toast.success('Logged out successfully');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(response.data?.message || 'Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to change password';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Get the appropriate dashboard path based on role
  const getDashboardPath = () => {
    if (!userRole) return '/dashboard';
    if (userRole === 'OWNER') return '/dashboard';
    if (userRole === 'SCHOOL_ADMIN') return '/admin/dashboard';
    if (userRole === 'SCHOOL_STAFF') return '/staff/dashboard';
    return '/dashboard';
  };

  const value = {
    user,
    school,
    loading,
    userRole,
    login,
    logout,
    changePassword,
    getDashboardPath,
    isAuthenticated: !!user,
    isOwner: userRole === 'OWNER',
    isSchoolAdmin: userRole === 'SCHOOL_ADMIN',
    isSchoolStaff: userRole === 'SCHOOL_STAFF',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
