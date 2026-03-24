import { useAuth } from '@/lib/auth-context';
import { User, Phone, LogOut, Bell, Moon, HelpCircle, Shield, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary',
  staff: 'bg-secondary text-secondary-foreground',
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const isAdmin = user.role === 'admin';

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

      {/* Admin Panel Link */}
      {isAdmin && (
        <div className="animate-fade-up stagger-1 mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Administration
          </h3>
          <div className="bg-gradient-to-br from-primary to-accent p-0.5 rounded-2xl shadow-lg">
            <div className="bg-card rounded-2xl p-5 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-1">Admin Dashboard</h4>
              <p className="text-xs text-muted-foreground mb-4">View analytics, manage team, review expenses, and monitor alerts.</p>
              <button
                onClick={() => navigate('/admin')}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md active:scale-95 transition-transform"
              >
                Open Admin Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="animate-fade-up stagger-2 mb-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Preferences</h3>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {[
            { icon: Bell, label: 'Notifications' },
            { icon: Moon, label: 'Dark Mode' },
            { icon: HelpCircle, label: 'Help & Support' },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={() => toast.info('Coming soon')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary transition-colors ${
                i < arr.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{item.label}</span>
              <span className="text-muted-foreground text-xs">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="animate-fade-up stagger-3">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">AREM v2.0 • Connected to Convex</p>
    </div>
  );
}
