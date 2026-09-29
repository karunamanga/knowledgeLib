import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RoleName, PermissionCode } from '../types';
import { authApi, usersApi } from '../api/endpoints';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../api/client';
import { supabase, isSupabaseConfigured } from '../api/supabase';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  designation?: string;
  department?: string;
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  removeAvatar: () => Promise<User>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: PermissionCode | string) => boolean;
  hasRole: (role: RoleName | string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const response = await authApi.getMe();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
        clearTokens();
      }
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            setTokens(data.session.access_token, data.session.refresh_token || '');
          }
        } catch (e) {
          console.warn('Error fetching Supabase session:', e);
        }
      }
      await fetchProfile();
    };

    initAuth();

    // Supabase auth state listener
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.access_token) {
          setTokens(session.access_token, session.refresh_token || '');
          await fetchProfile();
        } else if (_event === 'SIGNED_OUT') {
          clearTokens();
          setUser(null);
        }
      });
      authSubscription = data.subscription;
    }

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      authSubscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (!error && data.session) {
            setTokens(data.session.access_token, data.session.refresh_token || '');
            await fetchProfile();
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase signin attempt:', supabaseErr);
        }
      }

      // Backend API login fallback
      const response = await authApi.login({ email: email.trim(), password });
      const { access_token, refresh_token } = response.data.data;
      setTokens(access_token, refresh_token);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      let authUserId: string | undefined = undefined;

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email.trim(),
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
                designation: data.designation,
                department: data.department,
                employee_id: data.employeeId,
              },
            },
          });

          if (!error && authData?.user) {
            authUserId = authData.user.id;
            if (authData.session?.access_token) {
              setTokens(authData.session.access_token, authData.session.refresh_token || '');
              await fetchProfile();
              return;
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase signup attempt:', supabaseErr);
        }
      }

      // Backend self-registration API (creates user and returns direct session JWT)
      const res = await authApi.register({
        email: data.email.trim(),
        password: data.password,
        full_name: data.fullName,
        designation: data.designation,
        department: data.department,
        employee_id: data.employeeId,
        auth_user_id: authUserId,
      });

      if (res.data.success && res.data.data) {
        const { access_token, refresh_token } = res.data.data;
        setTokens(access_token, refresh_token);
        await fetchProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Continue cleanup
    }

    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Continue clearing even if server logout fails
      }
    }
    clearTokens();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    const res = await usersApi.updateMe(data);
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data.message || 'Failed to update profile');
  };

  const uploadAvatar = async (file: File): Promise<User> => {
    const res = await usersApi.uploadAvatar(file);
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data.message || 'Failed to upload avatar');
  };

  const removeAvatar = async (): Promise<User> => {
    const res = await usersApi.removeAvatar();
    if (res.data.success && res.data.data) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data.message || 'Failed to remove avatar');
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const hasRole = (role: RoleName | string): boolean => {
    if (!user) return false;
    const roleNames = user.roles ? user.roles.map((r) => r.name) : [];
    return roleNames.includes('ADMIN') || roleNames.includes(role);
  };

  const hasPermission = (permission: PermissionCode | string): boolean => {
    if (!user) return false;
    if (hasRole('ADMIN')) return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        refreshProfile,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
