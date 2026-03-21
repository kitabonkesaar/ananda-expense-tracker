import { useAuth } from '@/lib/auth-context';
import { demoTrips, demoExpenses, demoAlerts, getTripBudgetStatus, getUserById } from '@/lib/demo-data';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, IndianRupee, Receipt, Map, Clock } from 'lucide-react';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeTrip = demoTrips.find(t => t.status === 'active');
  const budget = activeTrip ? getTripBudgetStatus(activeTrip.id) : null;

  const pendingCount = demoExpenses.filter(e => e.status === 'pending').length;
  const flaggedCount = demoExpenses.filter(e => e.status === 'flagged').length;
  const recentExpenses = demoExpenses.filter(e => activeTrip && e.tripId === activeTrip.id).slice(-5).reverse();

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Active Trip Banner */}
      {activeTrip && (
        <div className="animate-fade-up bg-primary rounded-2xl p-5 mb-5 shadow-lg shadow-primary/20 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate(`/trips/${activeTrip.id}`)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-primary-foreground/70" />
              <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">Active Trip</span>
            </div>
            <span className="text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground rounded-full px-2 py-0.5">{activeTrip.status}</span>
          </div>
          <h2 className="text-lg font-bold text-primary-foreground mb-1">{activeTrip.name}</h2>
          <p className="text-xs text-primary-foreground/60">{activeTrip.startDate} → {activeTrip.endDate}</p>

          {budget && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-primary-foreground/80 mb-1.5">
                <span>Spent: {formatCurrency(budget.spent)}</span>
                <span>{budget.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(budget.percentage, 100)}%`,
                    backgroundColor: budget.percentage > 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm font-semibold text-primary-foreground">{formatCurrency(budget.remaining)} left</span>
                <span className="text-xs text-primary-foreground/60">of {formatCurrency(budget.budget)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-accent' },
          { label: 'Flagged', value: flaggedCount, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Total Trips', value: demoTrips.length, icon: Map, color: 'text-primary' },
          { label: 'Expenses', value: demoExpenses.length, icon: Receipt, color: 'text-muted-foreground' },
        ].map((stat, i) => (
          <div key={stat.label} className={`animate-fade-up stagger-${i + 1} bg-card rounded-xl p-4 border border-border shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(user?.role === 'admin' || user?.role === 'manager') && demoAlerts.length > 0 && (
        <div className="mb-5 animate-fade-up stagger-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Alerts</h3>
          <div className="space-y-2">
            {demoAlerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                alert.severity === 'high' ? 'bg-destructive/5 border-destructive/20' :
                alert.severity === 'medium' ? 'bg-warning/5 border-warning/20' :
                'bg-secondary border-border'
              }`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  alert.severity === 'high' ? 'text-destructive' :
                  alert.severity === 'medium' ? 'text-warning' :
                  'text-muted-foreground'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="animate-fade-up stagger-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Expenses</h3>
        <div className="space-y-2">
          {recentExpenses.map(exp => {
            const creator = getUserById(exp.createdBy);
            return (
              <div key={exp.id} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.category} • {creator?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(exp.amount)}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    exp.status === 'approved' ? 'bg-success/10 text-success' :
                    exp.status === 'pending' ? 'bg-accent/10 text-accent' :
                    exp.status === 'flagged' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>{exp.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
