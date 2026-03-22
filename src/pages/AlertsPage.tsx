import { useState } from 'react';
import { demoAlerts, getUserById } from '@/lib/demo-data';
import { AlertTriangle, Bell, Shield, Clock, Filter } from 'lucide-react';
import { AlertSeverity, AlertType } from '@/lib/types';

const severityStyles: Record<AlertSeverity, string> = {
  high: 'bg-destructive/10 border-destructive/20 text-destructive',
  medium: 'bg-warning/10 border-warning/20 text-warning',
  low: 'bg-secondary border-border text-muted-foreground',
};

const severityIcon: Record<AlertSeverity, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

const typeLabels: Record<AlertType, { label: string; icon: typeof AlertTriangle }> = {
  budget: { label: 'Budget', icon: Shield },
  inactivity: { label: 'Inactivity', icon: Clock },
  suspicious: { label: 'Suspicious', icon: AlertTriangle },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');

  const filtered = demoAlerts.filter(a => filter === 'all' || a.severity === filter);

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">Alerts</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Bell className="w-3.5 h-3.5" />
          {demoAlerts.length} total
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 animate-fade-up stagger-1">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95 capitalize ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3 animate-fade-up stagger-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No alerts</div>
        )}
        {filtered.map(alert => {
          const TypeIcon = typeLabels[alert.type].icon;
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border ${severityStyles[alert.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.severity === 'high' ? 'bg-destructive/15' :
                  alert.severity === 'medium' ? 'bg-warning/15' : 'bg-muted'
                }`}>
                  <TypeIcon className={`w-4 h-4 ${severityIcon[alert.severity]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${severityStyles[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {typeLabels[alert.type].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
