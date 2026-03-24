import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, IndianRupee, Receipt, Map, Clock, Tags, Filter, ListFilter } from 'lucide-react';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function DashboardPage() {
  const { user, allUsers } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const trips = useQuery(api.trips.list) ?? [];
  const activeTrip = useQuery(api.trips.getActive);
  const allExpenses = useQuery(api.expenses.list) ?? [];
  const budgetStatus = useQuery(
    api.trips.getBudgetStatus,
    activeTrip ? { tripId: activeTrip._id } : "skip"
  );

  const pendingCount = allExpenses.filter(e => e.status === 'pending').length;
  const flaggedCount = allExpenses.filter(e => e.status === 'flagged').length;
  const recentExpenses = activeTrip
    ? allExpenses.filter(e => e.tripId === activeTrip._id).slice(-5).reverse()
    : [];

  const getUserName = (id: string) => {
    const u = allUsers.find(u => u._id === id);
    return u?.name ?? 'Unknown';
  };

  const activeTripExpenses = activeTrip ? allExpenses.filter(e => e.tripId === activeTrip._id) : [];
  const categories = ['All', ...Array.from(new Set(activeTripExpenses.map(e => e.category)))];
  const filteredExpenses = selectedCategory === 'All' 
    ? activeTripExpenses 
    : activeTripExpenses.filter(e => e.category === selectedCategory);

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Active Trip Banner */}
      {activeTrip && (
        <div className="animate-fade-up bg-primary rounded-2xl p-5 mb-5 shadow-lg shadow-primary/20 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate(`/trips/${activeTrip._id}`)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-primary-foreground/70" />
              <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">Active Trip</span>
            </div>
            <span className="text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground rounded-full px-2 py-0.5">{activeTrip.status}</span>
          </div>
          <h2 className="text-lg font-bold text-primary-foreground mb-1">{activeTrip.name}</h2>
          <p className="text-xs text-primary-foreground/60">{activeTrip.startDate} → {activeTrip.endDate}</p>

          {budgetStatus && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-primary-foreground/80 mb-1.5">
                <span>Spent: {formatCurrency(budgetStatus.spent)}</span>
                <span>{budgetStatus.percentage.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(budgetStatus.percentage, 100)}%`,
                    backgroundColor: budgetStatus.percentage > 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm font-semibold text-primary-foreground">{formatCurrency(budgetStatus.remaining)} left</span>
                <span className="text-xs text-primary-foreground/60">of {formatCurrency(budgetStatus.budget)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {activeTrip && (
        <div className="flex bg-card rounded-xl p-1 mb-5 border border-border shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'expenses' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            All Expenses
          </button>
        </div>
      )}

      {activeTab === 'overview' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-accent' },
              { label: 'Flagged', value: flaggedCount, icon: AlertTriangle, color: 'text-destructive' },
              { label: 'Total Trips', value: trips.length, icon: Map, color: 'text-primary' },
              { label: 'Expenses', value: allExpenses.length, icon: Receipt, color: 'text-muted-foreground' },
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

          {/* Recent Expenses */}
          <div className="animate-fade-up stagger-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Expenses</h3>
            <div className="space-y-2">
              {recentExpenses.map(exp => (
                <div key={exp._id} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.category} • {getUserName(exp.createdBy)}</p>
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
              ))}
              {recentExpenses.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No expenses yet</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="animate-fade-up space-y-4">
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                {cat === 'All' ? <ListFilter className="w-3 h-3" /> : <Tags className="w-3 h-3" />}
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2 pb-4">
            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center bg-card border border-border rounded-2xl border-dashed">
                <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm font-semibold">No expenses found for this category.</p>
              </div>
            ) : (
              [...filteredExpenses].reverse().map(exp => (
                <div key={exp._id} className="flex flex-col gap-2 bg-card p-3.5 rounded-xl border border-border hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{exp.description}</p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Map className="w-3 h-3" /> {new Date(exp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[15px] font-black text-foreground tabular-nums">{formatCurrency(exp.amount)}</p>
                      <span className={`mt-1 inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        exp.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                        exp.status === 'pending' ? 'bg-accent/10 text-accent border-accent/20' :
                        exp.status === 'flagged' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>{exp.status}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      <Tags className="w-3 h-3" /> {exp.category} {exp.subCategory ? `• ${exp.subCategory}` : ''}
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      By {getUserName(exp.createdBy)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
