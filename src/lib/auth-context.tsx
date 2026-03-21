import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { demoUsers } from '@/lib/demo-data';

interface AuthContextType {
  user: User | null;
  login: (phone: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (phone: string) => {
    // Demo: match any user or default to admin
    const found = demoUsers.find(u => u.phone.includes(phone)) || demoUsers[0];
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  const switchRole = (role: UserRole) => {
    const found = demoUsers.find(u => u.role === role);
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
