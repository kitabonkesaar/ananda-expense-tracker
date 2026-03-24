/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth-context';
import { Users as UsersIcon, Flame, ChevronDown, Map, ShieldAlert, Activity, CheckCircle2, Clock, Tags, BarChart3, TrendingUp, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#f59e0b'];

export default function AdminAnalytics() {
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const { allUsers } = useAuth();
  const allTripsRaw = useQuery(api.trips.list) ?? [];
  const allExpensesRaw = useQuery(api.expenses.list) ?? [];
  const demoDiscipline = useQuery(api.disciplineScores.list) ?? [];

  const getUserById = (id: string) => allUsers.find(u => u._id === id);

  const { activeTrips, activeExpenses, dailyData, availableCategories, highValueExpenses, approvalData, rejectionRate, categoryBreakdown, teamDisciplineData, burnTrajectory, fraudData, staffLoadData, timingData, subcatsData, bracketData, dailyVolumeData, tripVariances } = useMemo(() => {
    const dynamicExpenses = allExpensesRaw;
    const trips = selectedTripId === 'all' ? allTripsRaw : allTripsRaw.filter(t => t._id === selectedTripId);
    const expenses = selectedTripId === 'all' ? dynamicExpenses : dynamicExpenses.filter(e => e.tripId === selectedTripId);

    // Rejection Rate
    const rejectedCount = expenses.filter(e => e.status === 'rejected').length;
    const approvedCount = expenses.filter(e => e.status === 'approved').length;
    const pendingCount = expenses.filter(e => e.status === 'pending' || e.status === 'flagged').length;
    const rejectionRateCalc = expenses.length > 0 ? ((rejectedCount / expenses.length) * 100) : 0;

    // Day-wise trend
    const availCats = Array.from(new Set(expenses.map(e => e.category)));
    const dailyMap = expenses.reduce((acc, exp) => {
      const d = new Date(exp.createdAt).toISOString().split('T')[0];
      if (!acc[d]) { acc[d] = { date: d }; availCats.forEach(c => acc[d][c] = 0); }
      acc[d][exp.category] = (acc[d][exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, any>);
    
    const dData = Object.values(dailyMap)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({ ...item, date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }));

    const highValue = [...expenses].sort((a,b) => b.amount - a.amount).slice(0, 4).map(e => ({
       name: e.category,
       desc: e.description,
       price: '₹' + e.amount.toLocaleString('en-IN'),
       image: `https://api.dicebear.com/7.x/shapes/svg?seed=${e._id}&backgroundColor=f1f5f9`
    }));

    const approvalDataInner = [
      { name: 'Approved', value: approvedCount, fill: '#10b981' }, // success
      { name: 'Pending', value: pendingCount, fill: '#f59e0b' },   // warning
      { name: 'Rejected', value: rejectedCount, fill: '#ef4444' }, // destructive
    ];

    // 4 New Charts Data
    const categoryBreakdown = availCats.map((c, i) => {
       const amt = expenses.filter(e => e.category === c && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
       return { name: c, value: amt, color: COLORS[i % COLORS.length] };
    }).filter(c => c.value > 0);

    const teamDisciplineData = demoDiscipline.map(d => ({
       name: getUserById(d.userId)?.name.split(' ')[0] || 'Unknown',
       OnTime: d.onTime,
       Late: d.late,
       Rejected: d.rejected
    }));

    const sortedExpenses = [...expenses].filter(e => e.status !== 'rejected').sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const burnTrajectory = sortedExpenses.reduce((acc, exp, i) => {
       const lastTotal = i > 0 ? acc[i-1].total : 0;
       acc.push({ name: `Trx ${i+1}`, total: lastTotal + exp.amount });
       return acc;
    }, [] as any[]);

    const fraudData = [
       { name: 'Standard', value: expenses.filter(e => e.category !== 'Misc' && e.status !== 'flagged').length, color: '#10b981' },
       { name: 'Misc/Flagged', value: expenses.filter(e => e.category === 'Misc' || e.status === 'flagged').length, color: '#ef4444' }
    ];

    const staffVolumeMap = expenses.reduce((acc, exp) => {
       const u = getUserById(exp.createdBy)?.name.split(' ')[0] || 'Unknown';
       acc[u] = (acc[u] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
    const staffLoadData = Object.entries(staffVolumeMap).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));

    const onTimeTot = demoDiscipline.reduce((s,d) => s + d.onTime, 0);
    const lateTot = demoDiscipline.reduce((s,d) => s + d.late, 0);
    const timingData = [
       { name: 'On Time', value: onTimeTot, fill: '#10b981' },
       { name: 'Late Subs', value: lateTot, fill: '#f59e0b' }
    ];

    const subMap: Record<string, number> = {};
    expenses.forEach(e => {
       if (e.subCategory) {
          const l = `${e.category} • ${e.subCategory}`;
          subMap[l] = (subMap[l] || 0) + e.amount;
       }
    });
    const subcatsData = Object.entries(subMap)
       .map(([name, value]) => ({ name, value }))
       .sort((a,b) => b.value - a.value)
       .slice(0, 5)
       .map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }));

    const bracketCounts = { '<1k': 0, '1k-5k': 0, '5k-10k': 0, '>10k': 0 };
    expenses.forEach(e => {
        if(e.amount < 1000) bracketCounts['<1k']++;
        else if(e.amount <= 5000) bracketCounts['1k-5k']++;
        else if(e.amount <= 10000) bracketCounts['5k-10k']++;
        else bracketCounts['>10k']++;
    });
    const bracketData = Object.entries(bracketCounts).map(([name, count], i) => ({ name, count, fill: COLORS[i % COLORS.length] }));

    const dailyLogMap = expenses.reduce((acc, exp) => {
       const d = new Date(exp.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
       acc[d] = (acc[d] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
    const dailyVolumeData = Object.keys(dailyLogMap)
       .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
       .map(d => ({ date: d, count: dailyLogMap[d] }));

    const tripVariances = trips.map(t => {
       const totalSpent = allExpensesRaw.filter(e => e.tripId === t._id && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
       return { name: t.name, Budget: t.totalBudget, Spent: totalSpent };
    });

    return { 
      activeTrips: trips, activeExpenses: expenses, dailyData: dData, 
      availableCategories: availCats, highValueExpenses: highValue, 
      approvalData: approvalDataInner, rejectionRate: rejectionRateCalc,
      categoryBreakdown, teamDisciplineData, burnTrajectory, fraudData,
      staffLoadData, timingData, subcatsData, bracketData, dailyVolumeData, tripVariances
    };
  }, [selectedTripId, allTripsRaw, allExpensesRaw, demoDiscipline]);

  return (
    <div className="space-y-6">
      
      {/* Trip Selector Header */}
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-orange-500" /> Trip Analytics
         </h2>
         <div className="relative">
            <select
               value={selectedTripId}
               onChange={(e) => setSelectedTripId(e.target.value)}
               className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold py-2 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer"
            >
               <option value="all">All Trips Portfolio</option>
               {allTripsRaw.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
               ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
         </div>
      </div>

      {/* Current Active Trip Card */}
      {(() => {
        const activeTrip = allTripsRaw.find(t => t.status === 'active');
        if (!activeTrip) return (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-sm">No active trip found.</p>
          </div>
        );

        const tripExpenses = activeExpenses.filter(e => e.tripId === activeTrip._id);
        const totalSpent = tripExpenses.filter(e => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
        const budgetPct = activeTrip.totalBudget > 0 ? (totalSpent / activeTrip.totalBudget) * 100 : 0;
        const remaining = activeTrip.totalBudget - totalSpent;
        const pending = tripExpenses.filter(e => e.status === 'pending').length;
        const approved = tripExpenses.filter(e => e.status === 'approved').length;
        const flagged = tripExpenses.filter(e => e.status === 'flagged').length;
        const teamDays = (new Date(activeTrip.endDate).getTime() - new Date(activeTrip.startDate).getTime()) / (1000 * 3600 * 24);
        const dailyBurn = teamDays > 0 ? totalSpent / teamDays : 0;
        const cpp = activeTrip.team.length > 0 ? totalSpent / activeTrip.team.length : 0;

        return (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Trip Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Active</span>
                    <span className="text-[10px] font-bold text-slate-400">{activeTrip.startDate} → {activeTrip.endDate}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">{activeTrip.name}</h3>
                  
                  {/* Team Avatars */}
                  <div className="flex items-center gap-1">
                    {activeTrip.team.map(uid => {
                      const u = getUserById(uid);
                      return u ? (
                        <div key={uid} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white overflow-hidden -ml-1 first:ml-0" title={u.name}>
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.name}`} alt={u.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                    <span className="text-[11px] font-bold text-slate-500 ml-2">{activeTrip.team.length} members</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    { label: 'Daily Burn', value: `₹${Math.round(dailyBurn).toLocaleString('en-IN')}`, icon: Flame, color: 'bg-orange-50 text-orange-500' },
                    { label: 'Cost/Head', value: `₹${Math.round(cpp).toLocaleString('en-IN')}`, icon: UsersIcon, color: 'bg-blue-50 text-blue-500' },
                    { label: 'Pending', value: pending.toString(), icon: Clock, color: 'bg-amber-50 text-amber-500' },
                    { label: 'Flagged', value: flagged.toString(), icon: ShieldAlert, color: 'bg-rose-50 text-rose-500' },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm min-w-[100px]">
                      <div className={`w-7 h-7 rounded-lg ${m.color} flex items-center justify-center mb-2`}>
                        <m.icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-black text-slate-800 tracking-tight leading-tight">{m.value}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Bar */}
            <div className="px-6 pb-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Budget Usage</span>
                <span className={`${budgetPct > 80 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  ₹{totalSpent.toLocaleString('en-IN')} / ₹{activeTrip.totalBudget.toLocaleString('en-IN')}
                  <span className="text-slate-400 mx-1">•</span>
                  {budgetPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(budgetPct, 100)}%`,
                    background: budgetPct > 80 ? 'linear-gradient(90deg, #ef4444, #f97316)' : budgetPct > 60 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #10b981, #3b82f6)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {approved} Approved</span>
                <span className={`${remaining < 0 ? 'text-rose-500' : 'text-slate-500'}`}>₹{remaining.toLocaleString('en-IN')} remaining</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Day-wise Expense Trend (Spans 6 cols) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800">Day-wise Expense Trend</h3>
               <button onClick={() => toast.info('Advanced filtering coming soon')} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  Duration <ChevronDown className="w-3 h-3" />
               </button>
            </div>
            <div className="flex flex-wrap gap-4 mb-3 border-b border-slate-100 pb-4">
               {availableCategories.map((cat, idx) => (
                  <div key={cat} className="flex items-center gap-2 text-[13px] text-slate-600 font-bold mb-1">
                     <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span> 
                     {cat}
                  </div>
               ))}
            </div>
          </div>
          <div className="h-[230px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                {availableCategories.map((category, index) => (
                  <Bar 
                     key={category} 
                     dataKey={category} 
                     stackId="a" 
                     fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rejection Rate Semi-circle (Spans 3 cols) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-3 flex flex-col items-center">
          <div className="flex justify-between items-start mb-6 w-full">
             <h3 className="text-lg font-bold text-slate-800 leading-tight">Rejection<br/>Rate</h3>
             <button onClick={() => toast.info('Rejection filters coming soon')} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Status <ChevronDown className="w-3 h-3" />
             </button>
          </div>
          <div className="mb-auto w-full">
             <p className="text-xs font-bold text-slate-500 mb-1">Overall Rejected</p>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-rose-500 tracking-tight">{rejectionRate.toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400 mb-1.5 flex items-center">Avg</span>
             </div>
          </div>
          
          <div className="w-full relative flex flex-col items-center justify-end h-[160px] overflow-hidden mt-6">
             <div className="w-[180px] h-[90px] absolute bottom-6">
                <ResponsiveContainer width="100%" height="200%">
                  <PieChart>
                    <Pie
                      data={approvalData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius="75%"
                      outerRadius="100%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {approvalData.map(entry => (
                         <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="absolute bottom-2 text-center w-full">
                <span className="text-xl font-black text-slate-800 tracking-tight">Status</span>
             </div>
          </div>
        </div>

        {/* High-Value Expenses (Spans 3 cols) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-3 flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-slate-800">High-Value</h3>
             <button onClick={() => toast.info('Sorting options coming soon')} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Top <ChevronDown className="w-3 h-3" />
             </button>
          </div>
          <div className="flex-1 flex flex-col gap-5">
             {highValueExpenses.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer w-full">
                   <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-[42px] h-[42px] rounded-lg bg-orange-50 border border-orange-100 overflow-hidden shrink-0">
                         <img src={item.image} alt="Icon" className="w-full h-full object-cover mix-blend-multiply p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="text-[13px] font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">{item.name}</p>
                         <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">{item.desc}</p>
                      </div>
                   </div>
                   <div className="text-right shrink-0 bg-slate-50 px-2 py-1 rounded">
                      <p className="text-[13px] font-black text-slate-800 leading-tight">{item.price}</p>
                   </div>
                </div>
             ))}
             {highValueExpenses.length === 0 && (
                <div className="text-center py-6 text-sm text-slate-400 font-semibold">No expenses found.</div>
             )}
          </div>
        </div>
      </div>

      {/* Third Row: 4 New Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
         
         {/* 1. Category Dist */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0"><Map className="w-3.5 h-3.5" /></span>
               Cost Distribution
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                        {categoryBreakdown.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 2. Team Discipline */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /></span>
               Team Discipline
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamDisciplineData} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} width={30} />
                     <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Bar dataKey="OnTime" stackId="a" fill="#10b981" barSize={14} radius={[0, 0, 4, 4]} />
                     <Bar dataKey="Late" stackId="a" fill="#f59e0b" barSize={14} />
                     <Bar dataKey="Rejected" stackId="a" fill="#ef4444" barSize={14} radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 3. Budget Consumption Rate */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5" /></span>
               Budget Burn Rate
            </h3>
            <div className="flex-1 min-h-[160px] relative -mx-2 -mb-2 mt-2">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burnTrajectory}>
                     <defs>
                       <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                       </linearGradient>
                     </defs>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBurn)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 4. Fraud / Suspicious */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center shrink-0"><ShieldAlert className="w-3.5 h-3.5" /></span>
               Suspicious Ratio
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={fraudData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="0%" outerRadius="75%" paddingAngle={0} stroke="none">
                        {fraudData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

      {/* Fourth Row: 6 New KPIs (Grid of 3, rendering 2 logical rows) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
         
         {/* 1. Staff Expense Load */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-500 flex items-center justify-center shrink-0"><UsersIcon className="w-3.5 h-3.5" /></span>
               Staff Expense Volume
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={staffLoadData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="0%" outerRadius="80%" paddingAngle={0} stroke="none">
                        {staffLoadData.map((entry: any) => <Cell key={entry.name} fill={entry.fill} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 2. Timing Accuracy */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Clock className="w-3.5 h-3.5" /></span>
               Entry Timing Accuracy
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={timingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" paddingAngle={2} stroke="none">
                        {timingData.map((entry: any) => <Cell key={entry.name} fill={entry.fill} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 3. Subcategory Focus */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><Tags className="w-3.5 h-3.5" /></span>
               Top 5 Subcategories
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subcatsData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }} width={80} />
                     <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 4. Value Brackets */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-500 flex items-center justify-center shrink-0"><BarChart3 className="w-3.5 h-3.5" /></span>
               Transaction Clusters
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bracketData} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} width={30} />
                     <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Bar dataKey="count" stackId="a" fill="#14b8a6" barSize={20} radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 5. Daily Logger Activity */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-sky-50 text-sky-500 flex items-center justify-center shrink-0"><TrendingUp className="w-3.5 h-3.5" /></span>
               Logging Activity (Volume)
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyVolumeData} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
                     <defs>
                       <linearGradient id="colorLog" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                         <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} width={30} />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorLog)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 6. Trip Variances */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col hover:border-slate-200 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center shrink-0"><IndianRupee className="w-3.5 h-3.5" /></span>
               P&L Trip Variances
            </h3>
            <div className="flex-1 min-h-[160px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tripVariances} margin={{ top: 10, right: 0, bottom: 0, left: -10 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={5} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} width={35} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                     <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} />
                     <Bar dataKey="Budget" fill="#cbd5e1" barSize={10} radius={[2, 2, 0, 0]} />
                     <Bar dataKey="Spent" fill="#f43f5e" barSize={10} radius={[2, 2, 0, 0]} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>

    </div>
  );
}
