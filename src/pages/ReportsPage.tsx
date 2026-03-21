import { demoTrips, getCategoryBreakdown, getTripBudgetStatus, getTripExpenses, getUserById, demoDiscipline } from '@/lib/demo-data';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, User } from 'lucide-react';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const COLORS = ['hsl(168, 60%, 36%)', 'hsl(36, 90%, 54%)', 'hsl(220, 70%, 55%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 55%)', 'hsl(152, 60%, 40%)'];

export default function ReportsPage() {
  const [tripId, setTripId] = useState(demoTrips[0]?.id || '');
  const [tab, setTab] = useState<'spending' | 'discipline'>('spending');

  const breakdown = getCategoryBreakdown(tripId);
  const expenses = getTripExpenses(tripId);

  // Daily aggregation
  const dailyMap: Record<string, number> = {};
  expenses.forEach(e => {
    const day = new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dailyMap[day] = (dailyMap[day] || 0) + e.amount;
  });
  const dailyData = Object.entries(dailyMap).map(([day, amount]) => ({ day, amount }));

  // Staff spending
  const staffMap: Record<string, number> = {};
  expenses.forEach(e => {
    const name = getUserById(e.createdBy)?.name || 'Unknown';
    staffMap[name] = (staffMap[name] || 0) + e.amount;
  });
  const staffData = Object.entries(staffMap).map(([name, amount]) => ({ name: name.split(' ')[0], amount }));

  const sortedDiscipline = [...demoDiscipline].sort((a, b) => b.score - a.score);

  return (
    <div className="pb-24 px-4 pt-4">
      <h2 className="text-lg font-bold text-foreground mb-4 animate-fade-up">Reports</h2>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4 animate-fade-up stagger-1">
        <button onClick={() => setTab('spending')} className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 ${tab === 'spending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Spending
        </button>
        <button onClick={() => setTab('discipline')} className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 ${tab === 'discipline' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Discipline
        </button>
      </div>

      {tab === 'spending' ? (
        <>
          {/* Trip selector */}
          <select value={tripId} onChange={e => setTripId(e.target.value)} className="w-full text-sm bg-card border border-border rounded-xl px-3 py-2.5 mb-5 text-foreground outline-none">
            {demoTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {/* Category pie */}
          <div className="animate-fade-up stagger-2 bg-card rounded-xl p-5 border border-border shadow-sm mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Category Breakdown</h3>
            <div className="h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                    {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {breakdown.map((item, i) => (
                <div key={item.category} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-foreground">{item.category}: {formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily trend */}
          <div className="animate-fade-up stagger-3 bg-card rounded-xl p-5 border border-border shadow-sm mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Daily Spending</h3>
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="hsl(168, 60%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff spending */}
          <div className="animate-fade-up stagger-4 bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Staff-wise Spending</h3>
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={staffData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(220, 25%, 10%)' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="hsl(36, 90%, 54%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* Discipline Leaderboard */
        <div className="space-y-3 animate-fade-up stagger-2">
          <p className="text-xs text-muted-foreground mb-2">Score = (OnTime × 2) - (Late × 3) - (Rejected × 5)</p>
          {sortedDiscipline.map((d, i) => {
            const u = getUserById(d.userId);
            return (
              <div key={d.userId} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{u?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    ✓ {d.onTime} on-time · ⏰ {d.late} late · ✗ {d.rejected} rejected
                  </p>
                </div>
                <div className={`text-lg font-bold tabular-nums ${d.score >= 20 ? 'text-success' : d.score >= 0 ? 'text-warning' : 'text-destructive'}`}>
                  {d.score}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
