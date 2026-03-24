/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ArrowLeft, IndianRupee, Users, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const COLORS = [
  'hsl(168, 60%, 36%)',
  'hsl(36, 90%, 54%)',
  'hsl(220, 70%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 60%, 55%)',
  'hsl(152, 60%, 40%)',
];

export default function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { allUsers } = useAuth();

  const trip = useQuery(
    api.trips.getById,
    tripId ? { id: tripId as Id<"trips"> } : "skip"
  );
  const budgetStatus = useQuery(
    api.trips.getBudgetStatus,
    tripId ? { tripId: tripId as Id<"trips"> } : "skip"
  );
  const expenses = useQuery(
    api.expenses.getByTrip,
    tripId ? { tripId: tripId as Id<"trips"> } : "skip"
  ) ?? [];
  const breakdown = useQuery(
    api.trips.getCategoryBreakdown,
    tripId ? { tripId: tripId as Id<"trips"> } : "skip"
  ) ?? [];

  const getUserName = (id: string) => {
    const u = allUsers.find(u => u._id === id);
    return u?.name ?? 'Unknown';
  };

  if (!trip) return <div className="p-6 text-center text-muted-foreground">Loading trip...</div>;

  return (
    <div className="pb-24 px-4 pt-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 active:scale-95 transition-transform">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-fade-up">
        <h2 className="text-xl font-bold text-foreground mb-1">{trip.name}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{trip.startDate} → {trip.endDate}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{trip.team.length} members</span>
        </div>
      </div>

      {/* Budget Card */}
      {budgetStatus && (
        <div className="animate-fade-up stagger-1 bg-card rounded-xl p-5 border border-border shadow-sm mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Budget Overview</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(budgetStatus.budget)}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(budgetStatus.spent)}</p>
              <p className="text-[10px] text-muted-foreground">Spent</p>
            </div>
            <div>
              <p className={`text-lg font-bold tabular-nums ${budgetStatus.remaining < 0 ? 'text-destructive' : 'text-success'}`}>{formatCurrency(budgetStatus.remaining)}</p>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
            </div>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(budgetStatus.percentage, 100)}%`,
                backgroundColor: budgetStatus.percentage > 80 ? 'hsl(var(--destructive))' : budgetStatus.percentage > 60 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
              }}
            />
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {breakdown.length > 0 && (
        <div className="animate-fade-up stagger-2 bg-card rounded-xl p-5 border border-border shadow-sm mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Category Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={3} strokeWidth={0}>
                    {breakdown.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {breakdown.map((item: any, idx: number) => (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-foreground">{item.category}</span>
                  </div>
                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      <div className="animate-fade-up stagger-3 bg-card rounded-xl p-5 border border-border shadow-sm mb-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Team</h3>
        <div className="flex flex-wrap gap-2">
          {trip.team.map((uid: string) => {
            const name = getUserName(uid);
            return (
              <div key={uid} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <span className="text-xs text-foreground">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      <div className="animate-fade-up stagger-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Expenses ({expenses.length})</h3>
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp._id} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                <p className="text-[10px] text-muted-foreground">{exp.category} • {getUserName(exp.createdBy)} • {new Date(exp.createdAt).toLocaleDateString()}</p>
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
        </div>
      </div>
    </div>
  );
}
