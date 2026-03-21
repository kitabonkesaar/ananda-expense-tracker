import { demoTrips, getTripBudgetStatus, getUserById } from '@/lib/demo-data';
import { useNavigate } from 'react-router-dom';
import { Map, Users, Calendar, IndianRupee } from 'lucide-react';
import { TripStatus } from '@/lib/types';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const statusStyles: Record<TripStatus, string> = {
  active: 'bg-success/10 text-success',
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-secondary text-secondary-foreground',
};

export default function TripsPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Trips</h2>
        <button className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg active:scale-95 transition-transform">
          + New Trip
        </button>
      </div>

      <div className="space-y-3">
        {demoTrips.map((trip, i) => {
          const budget = getTripBudgetStatus(trip.id);
          return (
            <div
              key={trip.id}
              onClick={() => navigate(`/trips/${trip.id}`)}
              className={`animate-fade-up stagger-${i + 1} bg-card rounded-xl p-4 border border-border shadow-sm cursor-pointer active:scale-[0.98] transition-transform`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Map className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{trip.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {trip.startDate} → {trip.endDate}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[trip.status]}`}>
                  {trip.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {trip.team.length} members
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {formatCurrency(trip.totalBudget)}
                </div>
              </div>

              {budget && (
                <div className="mt-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.percentage > 70 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)} spent
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
