import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Plus, ClipboardCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/trips', icon: Map, label: 'Trips' },
  { to: '/add-expense', icon: Plus, label: 'Add', highlight: true },
  { to: '/approvals', icon: ClipboardCheck, label: 'Approve', roles: ['admin', 'manager'] as string[] },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const filtered = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {filtered.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-0"
            >
              {item.highlight ? (
                <span className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </span>
              ) : (
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-[10px] font-medium transition-colors ${item.highlight ? 'text-primary' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
