/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Receipt, Tags, IndianRupee, Filter, ListFilter, Search,
  Wallet, Smartphone, CreditCard, Check, X, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  approved: { label: 'Approved', classes: 'bg-success/10 text-success border-success/20' },
  pending:  { label: 'Pending',  classes: 'bg-accent/10 text-accent border-accent/20' },
  flagged:  { label: 'Flagged',  classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  rejected: { label: 'Rejected', classes: 'bg-muted text-muted-foreground border-border' },
};

const paymentIcons: Record<string, any> = {
  Cash: Wallet,
  UPI: Smartphone,
  Card: CreditCard,
};

export default function ExpensesPage() {
  const { user, allUsers } = useAuth();
  const allExpenses = useQuery(api.expenses.list) ?? [];
  const allTrips = useQuery(api.trips.list) ?? [];
  const updateStatus = useMutation(api.expenses.updateStatus);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTrip, setSelectedTrip] = useState('All');

  const getUserName = (id: string) => allUsers.find(u => u._id === id)?.name ?? 'Unknown';
  const getTripName = (id: string) => allTrips.find(t => t._id === id)?.name ?? 'Unknown Trip';

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allExpenses.map(e => e.category)));
    return ['All', ...cats];
  }, [allExpenses]);

  const filtered = useMemo(() => {
    return [...allExpenses]
      .reverse()
      .filter(e => {
        if (selectedTrip !== 'All' && e.tripId !== selectedTrip) return false;
        if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            getUserName(e.createdBy).toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [allExpenses, selectedTrip, selectedCategory, searchQuery]);

  const totalShown = filtered.reduce((s, e) => s + (e.status !== 'rejected' ? e.amount : 0), 0);

  const handleStatusChange = async (expense: any, newStatus: string) => {
    try {
      await updateStatus({ id: expense._id, status: newStatus as any, userId: user!._id });
      toast.success(`Expense ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="pb-24 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 animate-fade-up">
        <div>
          <h2 className="text-lg font-bold text-foreground">Expenses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} entries · {formatCurrency(totalShown)} total</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border shadow-sm mb-4 animate-fade-up stagger-1">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="space-y-2 mb-4 animate-fade-up stagger-2">
        {/* Trip Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {['All', ...allTrips.map(t => t._id)].map(tid => (
            <button
              key={tid}
              onClick={() => setSelectedTrip(tid)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedTrip === tid
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              {tid === 'All' ? 'All Trips' : getTripName(tid)}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <ListFilter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              <Tags className="w-3 h-3" /> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-2 animate-fade-up stagger-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-card border border-dashed border-border rounded-2xl">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-semibold text-sm">No expenses found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filtered.map(exp => {
            const PayIcon = paymentIcons[exp.paymentMethod] || IndianRupee;
            const statusCfg = statusConfig[exp.status] || statusConfig.rejected;
            return (
              <div key={exp._id} className="bg-card rounded-xl border border-border p-3.5 space-y-3 hover:border-primary/20 transition-all shadow-sm">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground leading-tight truncate">{exp.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {getTripName(exp.tripId)} · {new Date(exp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-foreground tabular-nums">{formatCurrency(exp.amount)}</p>
                    <span className={`mt-0.5 inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      <Tags className="w-3 h-3" /> {exp.category}{exp.subCategory ? ` · ${exp.subCategory}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      <PayIcon className="w-3 h-3" /> {exp.paymentMethod}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">By {getUserName(exp.createdBy)}</span>
                </div>

                {/* Admin Actions */}
                {user?.role === 'admin' && exp.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleStatusChange(exp, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(exp, 'flagged')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors active:scale-95"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Flag
                    </button>
                    <button
                      onClick={() => handleStatusChange(exp, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {user?.role === 'admin' && exp.status === 'flagged' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleStatusChange(exp, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(exp, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {exp.status === 'pending' && exp.createdBy === user?._id && (
                  <div className="flex items-center gap-1.5 text-[10px] text-accent font-semibold">
                    <Clock className="w-3 h-3" /> Awaiting admin approval
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
