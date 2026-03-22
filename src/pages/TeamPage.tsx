import { demoUsers, demoDiscipline } from '@/lib/demo-data';
import { useAuth } from '@/lib/auth-context';
import { Users, Phone, UserCheck, UserX } from 'lucide-react';
import { UserRole } from '@/lib/types';

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary',
  staff: 'bg-secondary text-secondary-foreground',
};

export default function TeamPage() {
  return (
    <div className="pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-5 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">Team</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {demoUsers.length} members
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-up stagger-1">
        {[
          { label: 'Active', value: demoUsers.filter(u => u.isActive).length, icon: UserCheck, color: 'text-success' },
          { label: 'Inactive', value: demoUsers.filter(u => !u.isActive).length, icon: UserX, color: 'text-destructive' },
          { label: 'Total', value: demoUsers.length, icon: Users, color: 'text-primary' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl p-3 border border-border shadow-sm text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
            <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 animate-fade-up stagger-2">
        {demoUsers.map(member => {
          const discipline = demoDiscipline.find(d => d.userId === member.id);
          return (
            <div key={member.id} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                member.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                  {!member.isActive && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${roleBadge[member.role]}`}>
                    {member.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5" /> {member.phone}
                  </span>
                </div>
              </div>
              {discipline && (
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${discipline.score >= 20 ? 'text-success' : discipline.score >= 0 ? 'text-warning' : 'text-destructive'}`}>
                    {discipline.score}
                  </p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
