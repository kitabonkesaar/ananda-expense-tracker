import { useAuth } from '@/lib/auth-context';
import { User, Phone, Shield, LogOut, Bell, Moon, HelpCircle, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary',
  manager: 'bg-accent/10 text-accent',
  staff: 'bg-secondary text-secondary-foreground',
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const menuGroups = [
    {
      label: 'Management',
      items: [
        { icon: Users, label: 'Team Members', to: '/team', roles: ['admin', 'manager'] },
        { icon: FileText, label: 'Audit Logs', to: '/audit-logs', roles: ['admin'] },
        { icon: Bell, label: 'Alerts', to: '/alerts', roles: ['admin', 'manager'] },
      ],
    },
    {
      label: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Moon, label: 'Dark Mode', action: () => {} },
        { icon: HelpCircle, label: 'Help & Support', action: () => {} },
      ],
    },
  ];

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Profile Card */}
      <div className="animate-fade-up bg-card rounded-2xl p-5 border border-border shadow-sm mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[user.role]}`}>
                {user.role}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {user.phone}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Groups */}
      {menuGroups.map((group, gi) => (
        <div key={group.label} className={`animate-fade-up stagger-${gi + 1} mb-5`}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.label}</h3>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {group.items
              .filter(item => !('roles' in item) || !item.roles || item.roles.includes(user.role))
              .map((item, i, arr) => (
                <button
                  key={item.label}
                  onClick={() => 'to' in item && item.to ? navigate(item.to) : item.action?.()}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary transition-colors ${
                    i < arr.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1">{item.label}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </button>
              ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="animate-fade-up stagger-3">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">AREM v1.0 • Demo Mode</p>
    </div>
  );
}
