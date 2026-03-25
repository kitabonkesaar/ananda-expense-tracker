import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/lib/auth-context';
import { FileText, UserCircle, ArrowRight } from 'lucide-react';

const actionLabels: Record<string, { label: string; color: string }> = {
  expense_created: { label: 'Expense Created', color: 'bg-primary/10 text-primary' },
  expense_updated: { label: 'Expense Updated', color: 'bg-indigo-100 text-indigo-600' },
  expense_approved: { label: 'Expense Approved', color: 'bg-success/10 text-success' },
  expense_rejected: { label: 'Expense Rejected', color: 'bg-destructive/10 text-destructive' },
  expense_flagged: { label: 'Expense Flagged', color: 'bg-warning/10 text-warning' },
  trip_created: { label: 'Trip Created', color: 'bg-primary/10 text-primary' },
  trip_status_changed: { label: 'Trip Status Changed', color: 'bg-accent/10 text-accent' },
  team_assigned: { label: 'Team Assigned', color: 'bg-secondary text-secondary-foreground' },
  user_login: { label: 'User Login', color: 'bg-secondary text-secondary-foreground' },
};

export default function AuditLogsPage() {
  const { allUsers } = useAuth();
  const auditLogs = useQuery(api.auditLogs.list) ?? [];

  const getUserName = (id: string) => {
    const u = allUsers.find(u => u._id === id);
    return u?.name ?? 'Unknown';
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-5 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">Audit Logs</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5" />
          {auditLogs.length} entries
        </div>
      </div>

      <div className="space-y-2 animate-fade-up stagger-1">
        {auditLogs.map(log => {
          const actorName = getUserName(log.userId);
          const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-muted text-muted-foreground' };
          const metadata = log.metadata as Record<string, unknown>;
          const metaStr = Object.entries(metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ');

          return (
            <div key={log._id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <UserCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{actorName}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actionInfo.color}`}>
                      {actionInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">{metaStr}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
        {auditLogs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No audit logs yet</p>
        )}
      </div>
    </div>
  );
}
