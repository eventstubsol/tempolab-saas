import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isImpersonating: boolean;
  originalUser: User | null;
  returnToTab?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  impersonateUser: (userToImpersonate: User) => Promise<void>;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: User[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'admin@eventhub.com',
    role: 'admin',
    isSuperAdmin: true
  },
  {
    id: '2',
    name: 'Event Organizer',
    email: 'organizer@eventhub.com',
    role: 'organizer',
    organizationName: 'Tech Events Inc',
    organizationId: 'org-1'
  },
  {
    id: '3',
    name: 'John Attendee',
    email: 'attendee@eventhub.com',
    role: 'attendee'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [returnToTab, setReturnToTab] = useState<string | undefined>();
  const { showToast } = useToast();

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const demoUser = DEMO_USERS.find(u => u.email === email);
      if (!demoUser) {
        throw new Error('Invalid credentials');
      }
      setUser(demoUser);
      showToast('success', `Welcome back, ${demoUser.name}!`);
    } catch (error) {
      showToast('error', 'Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role
      };
      setUser(newUser);
      showToast('success', 'Account created successfully!');
    } catch (error) {
      showToast('error', 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(() => {
    setUser(null);
    setIsImpersonating(false);
    setOriginalUser(null);
    setReturnToTab(undefined);
    showToast('success', 'Logged out successfully');
  }, [showToast]);

  const impersonateUser = useCallback(async (userToImpersonate: User) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      if (!user.isSuperAdmin) {
        throw new Error('Insufficient permissions');
      }

      if (userToImpersonate.id === user.id) {
        throw new Error('Cannot impersonate yourself');
      }

      setOriginalUser(user);
      setUser(userToImpersonate);
      setIsImpersonating(true);
      showToast('success', `Now impersonating ${userToImpersonate.name}`);
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to impersonate user');
      throw error;
    }
  }, [user, showToast]);

  const stopImpersonation = useCallback(() => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      setIsImpersonating(false);
      setReturnToTab('tenants');
      showToast('success', 'Returned to original user');
    }
  }, [originalUser, showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isImpersonating,
        originalUser,
        returnToTab,
        login,
        register,
        logout,
        impersonateUser,
        stopImpersonation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}