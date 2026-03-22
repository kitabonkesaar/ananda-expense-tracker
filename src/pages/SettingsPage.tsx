import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { demoUsers, demoExpenses, demoTrips, demoAlerts, getUserById } from '@/lib/demo-data';
import { User, Phone, LogOut, Bell, Moon, HelpCircle, FileText, Users, Shield, Check, X, Flag, IndianRupee, Plus, UserPlus, UserX, BarChart3, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ExpenseStatus } from '@/lib/types';
import { toast } from 'sonner';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary',
  staff: 'bg-secondary text-secondary-foreground',
};

type AdminTab = 'overview' | 'expenses' | 'team' | 'alerts';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [expenseStatuses, setExpenseStatuses] = useState<Record<string, ExpenseStatus>>({});

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleExpenseAction = (id: string, action: ExpenseStatus) => {
    setExpenseStatuses(prev => ({ ...prev, [id]: action }));
    toast.success(`Expense ${action}`);
  };

  const pendingExpenses = demoExpenses.filter(e => {
    const s = expenseStatuses[e.id] || e.status;
    return s === 'pending' || s === 'flagged';
  });

  const allExpenses = demoExpenses.map(e => ({
    ...e,
    status: expenseStatuses[e.id] || e.status,
  }));

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

      {/* Admin Panel */}
      {isAdmin && (
        <div className="animate-fade-up stagger-1 mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Admin Panel
          </h3>

          {/* Admin Tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {([
              { key: 'overview' as AdminTab, label: 'Overview', icon: BarChart3 },
              { key: 'expenses' as AdminTab, label: `Review (${pendingExpenses.length})`, icon: IndianRupee },
              { key: 'team' as AdminTab, label: 'Team', icon: Users },
              { key: 'alerts' as AdminTab, label: `Alerts (${demoAlerts.length})`, icon: AlertTriangle },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 whitespace-nowrap ${
                  adminTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {adminTab === 'overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Staff', value: demoUsers.filter(u => u.role === 'staff').length, color: 'text-primary' },
                  { label: 'Active Trips', value: demoTrips.filter(t => t.status === 'active').length, color: 'text-success' },
                  { label: 'Pending Review', value: pendingExpenses.length, color: 'text-accent' },
                  { label: 'Total Expenses', value: formatCurrency(demoExpenses.reduce((s, e) => s + e.amount, 0)), color: 'text-foreground' },
                ].map(stat => (
                  <div key={stat.label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                    <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {[
                  { icon: FileText, label: 'Audit Logs', to: '/audit-logs' },
                  { icon: BarChart3, label: 'Reports & Analytics', to: '/reports' },
                ].map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.to)}
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
          )}

          {/* Expense Review */}
          {adminTab === 'expenses' && (
            <div className="space-y-3">
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">All expenses reviewed ✓</div>
              ) : (
                pendingExpenses.map(exp => {
                  const creator = getUserById(exp.createdBy);
                  const currentStatus = expenseStatuses[exp.id] || exp.status;
                  return (
                    <div key={exp.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{exp.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{exp.category} • {creator?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(exp.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-lg font-bold text-foreground tabular-nums shrink-0 ml-3">{formatCurrency(exp.amount)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExpenseAction(exp.id, 'approved')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-success text-success-foreground py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleExpenseAction(exp.id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                        {currentStatus !== 'flagged' && (
                          <button
                            onClick={() => handleExpenseAction(exp.id, 'flagged')}
                            className="flex items-center justify-center gap-1.5 bg-warning text-warning-foreground px-3 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Team Management */}
          {adminTab === 'team' && (
            <div className="space-y-2">
              {demoUsers.map(member => (
                <div key={member.id} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    member.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                      {!member.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${roleBadge[member.role]}`}>
                        {member.role}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5" /> {member.phone}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info('Demo mode — toggle not persisted')}
                    className={`text-[10px] font-medium px-2 py-1 rounded-lg active:scale-95 transition-transform ${
                      member.isActive ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                    }`}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
              <button
                onClick={() => toast.info('Demo mode — cannot add members')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm font-medium active:scale-[0.98] transition-transform"
              >
                <UserPlus className="w-4 h-4" /> Add Team Member
              </button>
            </div>
          )}

          {/* Alerts */}
          {adminTab === 'alerts' && (
            <div className="space-y-3">
              {demoAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No alerts</div>
              ) : (
                demoAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      alert.severity === 'high' ? 'bg-destructive/5 border-destructive/20' :
                      alert.severity === 'medium' ? 'bg-warning/5 border-warning/20' :
                      'bg-secondary border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                        alert.severity === 'high' ? 'text-destructive' :
                        alert.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                            alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                            alert.severity === 'medium' ? 'bg-warning/10 text-warning' :
                            'bg-muted text-muted-foreground'
                          }`}>{alert.severity}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.info('Demo mode — alert not dismissed')}
                        className="text-muted-foreground active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Preferences (all roles) */}
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

      <p className="text-center text-[10px] text-muted-foreground mt-6">AREM v1.0 • Demo Mode</p>
    </div>
  );
}
