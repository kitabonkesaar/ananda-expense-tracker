import { useState } from 'react';
import { demoExpenses, getUserById } from '@/lib/demo-data';
import { Check, X, Flag, IndianRupee } from 'lucide-react';
import { ExpenseStatus } from '@/lib/types';
import { toast } from 'sonner';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function ApprovalsPage() {
  const [filter, setFilter] = useState<'pending' | 'flagged' | 'all'>('pending');
  const [statuses, setStatuses] = useState<Record<string, ExpenseStatus>>({});

  const filtered = demoExpenses.filter(e => {
    const currentStatus = statuses[e.id] || e.status;
    if (filter === 'all') return true;
    return currentStatus === filter;
  });

  const handleAction = (id: string, action: ExpenseStatus) => {
    setStatuses(prev => ({ ...prev, [id]: action }));
    toast.success(`Expense ${action}`);
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <h2 className="text-lg font-bold text-foreground mb-4 animate-fade-up">Approvals</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 animate-fade-up stagger-1">
        {(['pending', 'flagged', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 capitalize ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f} ({demoExpenses.filter(e => {
              const s = statuses[e.id] || e.status;
              return f === 'all' ? true : s === f;
            }).length})
          </button>
        ))}
      </div>

      <div className="space-y-3 animate-fade-up stagger-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No expenses to review</div>
        )}
        {filtered.map(exp => {
          const creator = getUserById(exp.createdBy);
          const currentStatus = statuses[exp.id] || exp.status;
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

              {currentStatus === 'pending' || currentStatus === 'flagged' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(exp.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success text-success-foreground py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(exp.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  {currentStatus !== 'flagged' && (
                    <button
                      onClick={() => handleAction(exp.id, 'flagged')}
                      className="flex items-center justify-center gap-1.5 bg-warning text-warning-foreground px-3 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  currentStatus === 'approved' ? 'bg-success/10 text-success' :
                  currentStatus === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>{currentStatus}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
