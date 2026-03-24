 
import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth-context';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText, FileSpreadsheet, Calendar, Filter, TrendingUp, IndianRupee, Users, Map, Layers, CreditCard, Wallet, Smartphone, AlertTriangle, Check } from 'lucide-react';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const COLORS = ['#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b', '#14b8a6', '#ec4899'];

type ReportType = 'trip-summary' | 'category' | 'staff' | 'payment' | 'daily';

const reportTabs: { id: ReportType; label: string; icon: typeof TrendingUp }[] = [
  { id: 'trip-summary', label: 'Trip Summary', icon: Map },
  { id: 'category', label: 'Category Wise', icon: Layers },
  { id: 'staff', label: 'Staff Wise', icon: Users },
  { id: 'payment', label: 'Payment Mode', icon: CreditCard },
  { id: 'daily', label: 'Daily Trend', icon: TrendingUp },
];

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState<ReportType>('trip-summary');
  const [selectedTrip, setSelectedTrip] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { allUsers } = useAuth();

  const allTrips = useQuery(api.trips.list) ?? [];
  const allExpenses = useQuery(api.expenses.list) ?? [];

  const getUserById = (id: string) => allUsers.find(u => u._id === id);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let exps = allExpenses;
    if (selectedTrip !== 'all') {
      exps = exps.filter(e => e.tripId === selectedTrip);
    }
    if (dateFrom) {
      exps = exps.filter(e => new Date(e.createdAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      exps = exps.filter(e => new Date(e.createdAt) <= to);
    }
    return exps;
  }, [allExpenses, selectedTrip, dateFrom, dateTo]);

  // ===================== Report Data =====================

  // 1. Trip Summary
  const tripSummary = useMemo(() => {
    return allTrips.map(trip => {
      const tripExps = filteredExpenses.filter(e => e.tripId === trip._id);
      const totalSpent = tripExps.filter(e => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
      const pending = tripExps.filter(e => e.status === 'pending').length;
      const approved = tripExps.filter(e => e.status === 'approved').length;
      const rejected = tripExps.filter(e => e.status === 'rejected').length;
      return {
        name: trip.name,
        budget: trip.totalBudget,
        spent: totalSpent,
        remaining: trip.totalBudget - totalSpent,
        utilization: trip.totalBudget > 0 ? ((totalSpent / trip.totalBudget) * 100) : 0,
        expenses: tripExps.length,
        pending,
        approved,
        rejected,
        status: trip.status,
        team: trip.team.length,
        dates: `${trip.startDate} → ${trip.endDate}`,
      };
    }).filter(t => selectedTrip === 'all' || allTrips.find(tr => tr.name === t.name)?._id === selectedTrip);
  }, [allTrips, filteredExpenses, selectedTrip]);

  // 2. Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.filter(e => e.status !== 'rejected').forEach(e => {
      if (!map[e.category]) map[e.category] = { amount: 0, count: 0 };
      map[e.category].amount += e.amount;
      map[e.category].count++;
    });
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0);
    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? ((data.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // 3. Staff breakdown
  const staffData = useMemo(() => {
    const map: Record<string, { amount: number; count: number; pending: number; approved: number }> = {};
    filteredExpenses.forEach(e => {
      if (!map[e.createdBy]) map[e.createdBy] = { amount: 0, count: 0, pending: 0, approved: 0 };
      map[e.createdBy].count++;
      if (e.status !== 'rejected') map[e.createdBy].amount += e.amount;
      if (e.status === 'pending') map[e.createdBy].pending++;
      if (e.status === 'approved') map[e.createdBy].approved++;
    });
    return Object.entries(map)
      .map(([userId, data]) => {
        const user = getUserById(userId);
        return { name: user?.name || 'Unknown', ...data };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // 4. Payment method breakdown
  const paymentData = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.filter(e => e.status !== 'rejected').forEach(e => {
      const method = e.paymentMethod || 'Cash';
      if (!map[method]) map[method] = { amount: 0, count: 0 };
      map[method].amount += e.amount;
      map[method].count++;
    });
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0);
    return Object.entries(map)
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? ((data.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // 5. Daily trend
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.filter(e => e.status !== 'rejected').forEach(e => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      map[d] = (map[d] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amount,
      }));
  }, [filteredExpenses]);

  // ===================== Summary KPIs =====================
  const totalSpent = filteredExpenses.filter(e => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
  const totalBudget = (selectedTrip === 'all' ? allTrips : allTrips.filter(t => t._id === selectedTrip)).reduce((s, t) => s + t.totalBudget, 0);
  const totalEntries = filteredExpenses.length;
  const avgPerEntry = totalEntries > 0 ? totalSpent / totalEntries : 0;

  // ===================== Export =====================
  const handleExportCSV = () => {
    let csv = '';
    const ts = new Date().toISOString().split('T')[0];

    if (activeReport === 'trip-summary') {
      csv = 'Trip,Budget,Spent,Remaining,Utilization%,Expenses,Pending,Approved,Rejected,Status,Team,Dates\n';
      tripSummary.forEach(t => {
        csv += `"${t.name}",${t.budget},${t.spent},${t.remaining},${t.utilization.toFixed(1)},${t.expenses},${t.pending},${t.approved},${t.rejected},${t.status},${t.team},"${t.dates}"\n`;
      });
    } else if (activeReport === 'category') {
      csv = 'Category,Amount,Count,Percentage\n';
      categoryData.forEach(c => {
        csv += `${c.category},${c.amount},${c.count},${c.percentage.toFixed(1)}\n`;
      });
    } else if (activeReport === 'staff') {
      csv = 'Staff,Total Amount,Entries,Pending,Approved\n';
      staffData.forEach(s => {
        csv += `"${s.name}",${s.amount},${s.count},${s.pending},${s.approved}\n`;
      });
    } else if (activeReport === 'payment') {
      csv = 'Payment Method,Amount,Count,Percentage\n';
      paymentData.forEach(p => {
        csv += `${p.method},${p.amount},${p.count},${p.percentage.toFixed(1)}\n`;
      });
    } else if (activeReport === 'daily') {
      csv = 'Date,Amount\n';
      dailyData.forEach(d => {
        csv += `${d.date},${d.amount}\n`;
      });
    }
    downloadFile(csv, `report_${activeReport}_${ts}.csv`, 'text/csv;charset=utf-8;');
  };

  // ===================== Render =====================
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports & Insights</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Generate detailed financial reports with trip / category / staff breakdowns.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95 shadow-sm shadow-orange-200"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Trip</label>
          <select
            value={selectedTrip}
            onChange={e => setSelectedTrip(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
          >
            <option value="all">All Trips</option>
            {allTrips.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        {(selectedTrip !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setSelectedTrip('all'); setDateFrom(''); setDateTo(''); }}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(totalBudget), icon: IndianRupee, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Total Spent', value: formatCurrency(totalSpent), icon: TrendingUp, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Total Entries', value: totalEntries.toString(), icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Avg / Entry', value: formatCurrency(Math.round(avgPerEntry)), icon: AlertTriangle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-800 tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeReport === tab.id
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================== REPORT CONTENT =================== */}

      {/* 1. Trip Summary */}
      {activeReport === 'trip-summary' && (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Budget vs Actual Spending</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <BarChart data={tripSummary} barGap={8}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="spent" fill="#f97316" name="Spent" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trip Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">#</th>
                    <th className="py-3 px-5">Trip</th>
                    <th className="py-3 px-5">Budget</th>
                    <th className="py-3 px-5">Spent</th>
                    <th className="py-3 px-5">Remaining</th>
                    <th className="py-3 px-5">Utilization</th>
                    <th className="py-3 px-5">Entries</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tripSummary.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-5 text-[11px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-3 px-5 text-[13px] font-bold text-slate-800">{t.name}</td>
                      <td className="py-3 px-5 text-[13px] font-bold text-slate-600 tabular-nums">{formatCurrency(t.budget)}</td>
                      <td className="py-3 px-5 text-[13px] font-black text-orange-600 tabular-nums">{formatCurrency(t.spent)}</td>
                      <td className="py-3 px-5">
                        <span className={`text-[13px] font-black tabular-nums ${t.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(t.remaining)}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(t.utilization, 100)}%`, backgroundColor: t.utilization > 90 ? '#ef4444' : t.utilization > 70 ? '#f59e0b' : '#10b981' }} />
                          </div>
                          <span className="text-[11px] font-black text-slate-500">{t.utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-[12px] font-bold text-slate-500">{t.expenses}</td>
                      <td className="py-3 px-5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${t.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : t.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Category Report */}
      {activeReport === 'category' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Spending by Category</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                    {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">#</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Count</th>
                  <th className="py-3 px-5">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryData.map((c, i) => (
                  <tr key={c.category} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 text-[11px] font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[13px] font-bold text-slate-800">{c.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-[13px] font-black text-slate-800 tabular-nums">{formatCurrency(c.amount)}</td>
                    <td className="py-3 px-5 text-[12px] font-bold text-slate-500">{c.count}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="text-[11px] font-black text-slate-500">{c.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Staff Report */}
      {activeReport === 'staff' && (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Staff-wise Expenditure</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <BarChart data={staffData} layout="vertical" barSize={20}>
                  <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Bar dataKey="amount" fill="#8b5cf6" name="Amount" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5">#</th>
                    <th className="py-3 px-5">Staff Member</th>
                    <th className="py-3 px-5">Total Amount</th>
                    <th className="py-3 px-5">Entries</th>
                    <th className="py-3 px-5">Approved</th>
                    <th className="py-3 px-5">Pending</th>
                    <th className="py-3 px-5">Avg / Entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staffData.map((s, i) => (
                    <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-5 text-[11px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${s.name}`} alt="" className="w-full h-full" />
                          </div>
                          <span className="text-[13px] font-bold text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-[13px] font-black text-slate-800 tabular-nums">{formatCurrency(s.amount)}</td>
                      <td className="py-3 px-5 text-[12px] font-bold text-slate-500">{s.count}</td>
                      <td className="py-3 px-5">
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.approved}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{s.pending}</span>
                      </td>
                      <td className="py-3 px-5 text-[12px] font-bold text-slate-500 tabular-nums">
                        {s.count > 0 ? formatCurrency(Math.round(s.amount / s.count)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Mode Report */}
      {activeReport === 'payment' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Payment Method Distribution</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={paymentData} dataKey="amount" nameKey="method" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                    {paymentData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Cards */}
          <div className="space-y-3">
            {paymentData.map((p, i) => {
              const iconMap: Record<string, typeof Wallet> = { Cash: Wallet, UPI: Smartphone, Card: CreditCard };
              const colorMap: Record<string, string> = { Cash: 'text-amber-500 bg-amber-50 border-amber-100', UPI: 'text-indigo-500 bg-indigo-50 border-indigo-100', Card: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
              const Icon = iconMap[p.method] || IndianRupee;
              const color = colorMap[p.method] || 'text-slate-500 bg-slate-50 border-slate-100';

              return (
                <div key={p.method} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800">{p.method}</span>
                      <span className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(p.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">{p.count} transactions</span>
                      <span className="text-[11px] font-black text-slate-500">{p.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full rounded-full" style={{ width: `${p.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Daily Trend Report */}
      {activeReport === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Daily Spending Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                  <Bar dataKey="amount" fill="#10b981" name="Daily Spend" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">#</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Share of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyData.map((d, i) => (
                  <tr key={d.date} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 text-[11px] font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-5 text-[13px] font-bold text-slate-800">{d.date}</td>
                    <td className="py-3 px-5 text-[13px] font-black text-slate-800 tabular-nums">{formatCurrency(d.amount)}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalSpent > 0 ? (d.amount / totalSpent) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[11px] font-black text-slate-500">{totalSpent > 0 ? ((d.amount / totalSpent) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
