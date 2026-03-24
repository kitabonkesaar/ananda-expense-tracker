/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/lib/auth-context';
import { TripStatus } from '@/lib/types';
import { Plus, Map, Calendar, Users, IndianRupee, ChevronDown, ChevronUp, X, Check, Layers, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const statusStyles: Record<TripStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminTrips() {
  const { user, allUsers } = useAuth();
  const trips = useQuery(api.trips.list) ?? [];
  const allExpenses = useQuery(api.expenses.list) ?? [];
  const categoriesRaw = useQuery(api.categories.list) ?? [];
  const createTrip = useMutation(api.trips.create);
  const removeTrip = useMutation(api.trips.remove);
  const updateTrip = useMutation(api.trips.update);

  const [showForm, setShowForm] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [editingTripId, setEditingTripId] = useState<Id<"trips"> | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [status, setStatus] = useState<TripStatus>('draft');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  const categories = categoriesRaw.map(c => c.name);
  const staffUsers = allUsers.filter(u => u.isActive);

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setTotalBudget('');
    setSelectedTeam([]);
    setStatus('draft');
    setCategoryBudgets({});
    setShowForm(false);
    setEditingTripId(null);
  };

  const parseBudgetVal = (val: string | number | undefined): number => {
    if (val === undefined || val === '') return 0;
    const n = Number(String(val).trim());
    return isNaN(n) ? 0 : n;
  };

  // Only sum up categories that are currently in the active 'categories' list
  const allocatedTotal = categories.reduce((sum, cat) => {
    return sum + parseBudgetVal(categoryBudgets[cat]);
  }, 0);
  
  const budgetNum = parseBudgetVal(totalBudget);
  const unallocated = budgetNum - allocatedTotal;

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Trip name is required'); return; }
    if (!startDate) { toast.error('Start date is required'); return; }
    if (!endDate) { toast.error('End date is required'); return; }
    if (!totalBudget || budgetNum <= 0) { toast.error('Enter a valid total budget'); return; }
    if (new Date(endDate) <= new Date(startDate)) { toast.error('End date must be after start date'); return; }
    if (allocatedTotal > budgetNum) { toast.error('Category budgets exceed total budget!'); return; }

    const catBudgets: Record<string, number> = {};
    Object.entries(categoryBudgets).forEach(([cat, val]) => {
      const n = Number(val);
      if (n > 0) catBudgets[cat] = n;
    });

    if (editingTripId) {
      await updateTrip({
        id: editingTripId,
        name: name.trim(),
        startDate,
        endDate,
        totalBudget: budgetNum,
        categoryBudgets: Object.keys(catBudgets).length > 0 ? catBudgets : undefined,
        team: selectedTeam as any[],
        status,
      });
      toast.success(`Trip "${name}" updated successfully!`);
    } else {
      await createTrip({
        name: name.trim(),
        startDate,
        endDate,
        totalBudget: budgetNum,
        categoryBudgets: Object.keys(catBudgets).length > 0 ? catBudgets : undefined,
        createdBy: user!._id,
        team: selectedTeam as any[],
        status,
      });
      toast.success(`Trip "${name}" created successfully!`);
    }

    resetForm();
  };

  const handleEdit = (trip: any) => {
    setName(trip.name);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTotalBudget(trip.totalBudget.toString());
    setStatus(trip.status);
    setSelectedTeam(trip.team || []);
    const catB: Record<string, string> = {};
    if (trip.categoryBudgets) {
      Object.entries(trip.categoryBudgets).forEach(([k, v]) => {
        catB[k] = String(v);
      });
    }
    setCategoryBudgets(catB);
    setEditingTripId(trip._id);
    setShowForm(true);
    // Scroll to top where form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTeamMember = (id: string) => {
    setSelectedTeam(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Trip Management</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Create & manage trips with total and category-wise budgets.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm ${
            showForm 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Trip</>}
        </button>
      </div>

      {/* Create Trip Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Map className="w-5 h-5 text-orange-500" /> {editingTripId ? 'Edit Trip' : 'Create New Trip'}
            </h3>
          </div>
          
          <div className="p-6 space-y-5">
            {/* Trip Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trip Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Kedarnath Yatra - April"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all"
                />
              </div>
            </div>

            {/* Total Budget */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                <IndianRupee className="w-3 h-3 inline mr-1" />Total Trip Budget *
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4">
                <IndianRupee className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={totalBudget}
                  onChange={e => setTotalBudget(e.target.value)}
                  placeholder="250000"
                  className="flex-1 py-3 bg-transparent text-lg font-bold text-slate-800 outline-none placeholder:text-slate-300 tabular-nums"
                />
              </div>
            </div>

            {/* Category-wise Budget Allocation */}
            {budgetNum > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-[12px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-400" /> Category-wise Budget (Optional)
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="text-slate-500">Allocated: <span className="text-orange-600">{formatCurrency(allocatedTotal)}</span></span>
                    <span className={`${unallocated >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {unallocated >= 0 ? `Remaining: ${formatCurrency(unallocated)}` : `Over by: ${formatCurrency(Math.abs(unallocated))}`}
                    </span>
                  </div>
                </div>

                {/* Budget bar */}
                <div className="px-5 pt-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((allocatedTotal / budgetNum) * 100, 100)}%`,
                        backgroundColor: allocatedTotal > budgetNum ? '#ef4444' : allocatedTotal > budgetNum * 0.8 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 text-right">{((allocatedTotal / budgetNum) * 100).toFixed(0)}% allocated</p>
                </div>

                <div className="p-5 grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 bg-slate-50/70 border border-slate-100 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-bold text-slate-600 w-20 shrink-0">{cat}</span>
                      <div className="flex items-center flex-1 gap-1">
                        <span className="text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          value={categoryBudgets[cat] || ''}
                          onChange={e => setCategoryBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                          placeholder="0"
                          className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none tabular-nums placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trip Status</label>
              <div className="flex gap-2">
                {(['draft', 'active'] as TripStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 border ${
                      status === s
                        ? s === 'active' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                <Users className="w-3 h-3 inline mr-1" />Assign Team Members
              </label>
              <div className="flex flex-wrap gap-2">
                {staffUsers.map(u => {
                  const isSelected = selectedTeam.includes(u._id);
                  return (
                    <button
                      key={u._id}
                      onClick={() => toggleTeamMember(u._id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isSelected ? <Check className="w-3 h-3" /> : u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {u.name}
                      <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{u.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] shadow-sm shadow-orange-200"
            >
              {editingTripId ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </div>
      )}

      {/* Trips List */}
      <div className="space-y-3">
        {trips.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100 shadow-sm">
            <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg text-slate-800 font-bold mb-1">No Trips Yet</p>
            <p className="text-sm text-slate-500 font-semibold">Create your first trip to get started.</p>
          </div>
        ) : (
          trips.map(trip => {
            const tripExps = allExpenses.filter(e => e.tripId === trip._id);
            const totalSpent = tripExps.filter(e => e.status !== 'rejected').reduce((s, e) => s + e.amount, 0);
            const budget = { budget: trip.totalBudget, spent: totalSpent, remaining: trip.totalBudget - totalSpent, percentage: trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0 };
            const expenses = tripExps;
            const isExpanded = expandedTrip === trip._id;

            return (
              <div key={trip._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Trip Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedTrip(isExpanded ? null : trip._id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Map className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-800 truncate">{trip.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.startDate} → {trip.endDate}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.team.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-black text-slate-800 tabular-nums">{formatCurrency(trip.totalBudget)}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusStyles[trip.status]}`}>
                      {trip.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(trip);
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="Edit Trip"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${trip.name}"? This action will permanently delete all associated expenses and alerts.`)) {
                          removeTrip({ id: trip._id }).then(() => {
                             toast.success('Trip deleted successfully');
                             if (expandedTrip === trip._id) setExpandedTrip(null);
                          }).catch(() => toast.error('Failed to delete trip'));
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4 bg-slate-50/30">
                    {/* Budget Progress */}
                    {budget && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Budget</p>
                          <p className="text-lg font-black text-slate-800 tabular-nums">{formatCurrency(budget.budget)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
                          <p className="text-lg font-black text-orange-600 tabular-nums">{formatCurrency(budget.spent)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
                          <p className={`text-lg font-black tabular-nums ${budget.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(budget.remaining)}</p>
                        </div>
                      </div>
                    )}

                    {/* Category Budget Breakdown */}
                    {trip.categoryBudgets && Object.keys(trip.categoryBudgets).length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-orange-400" /> Category Budget Allocation
                          </h4>
                        </div>
                        <div className="p-4 space-y-2.5">
                          {Object.entries(trip.categoryBudgets).map(([cat, catBudgetVal]) => {
                            const catBudget = Number(catBudgetVal);
                            const catExpenses = expenses.filter(e => e.category === cat && e.status !== 'rejected');
                            const catSpent = catExpenses.reduce((s, e) => s + e.amount, 0);
                            const catPercent = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;

                            return (
                              <div key={cat} className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-slate-600 w-20 shrink-0">{cat}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400">{formatCurrency(catSpent)} / {formatCurrency(catBudget)}</span>
                                    <span className={`text-[10px] font-black ${catPercent > 90 ? 'text-rose-500' : catPercent > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{catPercent.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(catPercent, 100)}%`,
                                        backgroundColor: catPercent > 90 ? '#ef4444' : catPercent > 70 ? '#f59e0b' : '#10b981',
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Team */}
                    {trip.team.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Team Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {trip.team.map((uid: string) => {
                            const u = allUsers.find(us => us._id === uid);
                            return u ? (
                              <div key={uid} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-100 text-xs font-bold text-slate-600">
                                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[8px] font-black text-orange-600 overflow-hidden">
                                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.name}`} alt="" className="w-full h-full" />
                                </div>
                                {u.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                      <span>Total Expenses: {expenses.length}</span>
                      <span>Pending: {expenses.filter(e => e.status === 'pending').length}</span>
                      <span>Created: {new Date(trip.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
