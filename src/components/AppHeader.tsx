import { useAuth } from '@/lib/auth-context';
import { LogOut } from 'lucide-react';
import { UserRole } from '@/lib/types';

export default function AppHeader() {
  const { user, logout, switchRole } = useAuth();
  if (!user) return null;

  const roleBadgeColor: Record<UserRole, string> = {
    admin: 'bg-primary text-primary-foreground',
    staff: 'bg-secondary text-secondary-foreground',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{user.name}</h1>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleBadgeColor[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={logout} className="p-2 rounded-lg hover:bg-secondary active:scale-95 transition-all">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
