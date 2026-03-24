/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@/lib/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { Map, Users, Calendar, IndianRupee } from 'lucide-react';
import { TripStatus } from '@/lib/types';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const trips = useQuery(api.trips.list) ?? [];

  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Trips</h2>
        {user?.role === 'admin' && (
           <button 
             onClick={() => toast.info('Trip creation coming soon in next update')}
             className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-lg active:scale-95 transition-transform"
           >
             + New Trip
           </button>
        )}
      </div>

      <div className="space-y-3">
        {trips.map((trip, i) => {
          return (
            <TripCard key={trip._id} trip={trip} index={i} navigate={navigate} />
          );
        })}
        {trips.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No trips found</p>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, index, navigate }: { trip: any; index: number; navigate: any }) {
  const budgetStatus = useQuery(api.trips.getBudgetStatus, { tripId: trip._id });

  return (
    <div
      onClick={() => navigate(`/trips/${trip._id}`)}
      className={`animate-fade-up stagger-${index + 1} bg-card rounded-xl p-4 border border-border shadow-sm cursor-pointer active:scale-[0.98] transition-transform`}
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
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[trip.status as TripStatus]}`}>
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

      {budgetStatus && (
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(budgetStatus.percentage, 100)}%`,
                backgroundColor: budgetStatus.percentage > 70 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            {formatCurrency(budgetStatus.spent)} / {formatCurrency(budgetStatus.budget)} spent
          </p>
        </div>
      )}
    </div>
  );
}
