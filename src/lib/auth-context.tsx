import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, UserRole } from '@/lib/types';
import { Id } from '../../convex/_generated/dataModel';

interface AuthContextType {
  user: User | null;
  login: (phone: string) => boolean;
  setGoogleUser: (id: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<Id<"users"> | null>(
    (localStorage.getItem('budgetGuardUserId') as Id<"users">) || null
  );
  
  const allUsersRaw = useQuery(api.users.list) ?? [];

  // Cast to our User type
  const allUsers = allUsersRaw as unknown as User[];

  // Current logged-in user
  const user = userId ? allUsers.find(u => u._id === userId) ?? null : null;

  const setUserId = useCallback((id: Id<"users"> | null) => {
    setUserIdState(id);
    if (id) {
      localStorage.setItem('budgetGuardUserId', id);
    } else {
      localStorage.removeItem('budgetGuardUserId');
    }
  }, []);

  const login = useCallback((phone: string) => {
    // Match any user or default to admin
    const found = allUsers.find(u => u.phone?.includes(phone)) || allUsers.find(u => u.role === 'admin') || allUsers[0];
    if (found) {
      setUserId(found._id);
      return true;
    }
    return false;
  }, [allUsers, setUserId]);

  const setGoogleUser = useCallback((id: string) => {
    setUserId(id as Id<"users">);
  }, [setUserId]);

  const logout = useCallback(() => setUserId(null), [setUserId]);

  const switchRole = useCallback((role: UserRole) => {
    const found = allUsers.find(u => u.role === role);
    if (found) setUserId(found._id);
  }, [allUsers, setUserId]);

  return (
    <AuthContext.Provider value={{ user, login, setGoogleUser, logout, switchRole, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
