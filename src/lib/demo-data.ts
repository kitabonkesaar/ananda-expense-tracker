import { User, Trip, Expense, Alert, DisciplineScore, AuditLog } from './types';

export const demoUsers: User[] = [
  { id: 'u1', name: 'Rajesh Kumar', phone: '+91 98765 43210', role: 'admin', isActive: true, createdAt: '2024-01-01' },
  { id: 'u2', name: 'Priya Sharma', phone: '+91 87654 32109', role: 'admin', isActive: true, createdAt: '2024-01-05' },
  { id: 'u3', name: 'Amit Patel', phone: '+91 76543 21098', role: 'staff', isActive: true, createdAt: '2024-02-10' },
  { id: 'u4', name: 'Sunita Devi', phone: '+91 65432 10987', role: 'staff', isActive: true, createdAt: '2024-02-15' },
  { id: 'u5', name: 'Vikram Singh', phone: '+91 54321 09876', role: 'staff', isActive: true, createdAt: '2024-03-01' },
  { id: 'u6', name: 'Meena Kumari', phone: '+91 43210 98765', role: 'staff', isActive: false, createdAt: '2024-03-10' },
];

export const demoTrips: Trip[] = [
  {
    id: 't1', name: 'Char Dham Yatra - March', startDate: '2026-03-15', endDate: '2026-03-28',
    totalBudget: 250000, createdBy: 'u1', team: ['u2', 'u3', 'u4', 'u5'],
    status: 'active', createdAt: '2026-03-10',
  },
  {
    id: 't2', name: 'Vaishno Devi Group', startDate: '2026-04-05', endDate: '2026-04-12',
    totalBudget: 180000, createdBy: 'u1', team: ['u2', 'u3'],
    status: 'draft', createdAt: '2026-03-18',
  },
  {
    id: 't3', name: 'Tirupati Balaji Feb', startDate: '2026-02-01', endDate: '2026-02-08',
    totalBudget: 120000, createdBy: 'u1', team: ['u2', 'u4', 'u5'],
    status: 'completed', createdAt: '2026-01-20',
  },
];

export const demoExpenses: Expense[] = [
  { id: 'e1', tripId: 't1', amount: 4500, category: 'Fuel', description: 'Diesel at Haridwar pump', imageUrl: '/placeholder.svg', createdBy: 'u3', location: { lat: 29.9457, lng: 78.1642 }, status: 'approved', createdAt: '2026-03-15T08:30:00' },
  { id: 'e2', tripId: 't1', amount: 2800, category: 'Food', description: 'Lunch for 12 passengers', imageUrl: '/placeholder.svg', createdBy: 'u4', location: { lat: 30.0869, lng: 78.2676 }, status: 'approved', createdAt: '2026-03-15T13:15:00' },
  { id: 'e3', tripId: 't1', amount: 8500, category: 'Hotel', description: 'Night halt at Rishikesh dharamshala', imageUrl: '/placeholder.svg', createdBy: 'u3', location: { lat: 30.0869, lng: 78.2676 }, status: 'pending', createdAt: '2026-03-15T20:00:00' },
  { id: 'e4', tripId: 't1', amount: 350, category: 'Toll', description: 'NH toll booth Roorkee', imageUrl: '/placeholder.svg', createdBy: 'u5', location: { lat: 29.8543, lng: 77.8880 }, status: 'approved', createdAt: '2026-03-16T06:45:00' },
  { id: 'e5', tripId: 't1', amount: 6200, category: 'Fuel', description: 'Diesel refill Devprayag', imageUrl: '/placeholder.svg', createdBy: 'u3', location: { lat: 30.1466, lng: 78.5963 }, status: 'pending', createdAt: '2026-03-16T10:20:00' },
  { id: 'e6', tripId: 't1', amount: 15000, category: 'Misc', description: 'Emergency vehicle repair', imageUrl: '/placeholder.svg', createdBy: 'u3', location: { lat: 30.7352, lng: 79.0669 }, status: 'flagged', createdAt: '2026-03-16T15:30:00' },
  { id: 'e7', tripId: 't1', amount: 1200, category: 'Food', description: 'Tea and snacks Joshimath', imageUrl: '/placeholder.svg', createdBy: 'u4', location: { lat: 30.5550, lng: 79.5650 }, status: 'approved', createdAt: '2026-03-17T07:00:00' },
  { id: 'e8', tripId: 't1', amount: 3500, category: 'Food', description: 'Dinner for group at Badrinath', imageUrl: '/placeholder.svg', createdBy: 'u4', location: { lat: 30.7449, lng: 79.4937 }, status: 'pending', createdAt: '2026-03-17T19:30:00' },
  { id: 'e9', tripId: 't1', amount: 500, category: 'Misc', description: 'Parking charges', imageUrl: '/placeholder.svg', createdBy: 'u5', location: { lat: 30.7449, lng: 79.4937 }, status: 'rejected', rejectionReason: 'No valid receipt', createdAt: '2026-03-17T10:00:00' },
  { id: 'e10', tripId: 't3', amount: 3200, category: 'Fuel', description: 'Diesel on way to Tirupati', imageUrl: '/placeholder.svg', createdBy: 'u4', location: { lat: 13.6288, lng: 79.4192 }, status: 'approved', createdAt: '2026-02-01T07:00:00' },
  { id: 'e11', tripId: 't3', amount: 9500, category: 'Hotel', description: 'Guest house booking', imageUrl: '/placeholder.svg', createdBy: 'u5', location: { lat: 13.6288, lng: 79.4192 }, status: 'approved', createdAt: '2026-02-01T18:00:00' },
  { id: 'e12', tripId: 't3', amount: 4100, category: 'Food', description: 'Meals for 2 days', imageUrl: '/placeholder.svg', createdBy: 'u4', location: { lat: 13.6288, lng: 79.4192 }, status: 'approved', createdAt: '2026-02-02T12:00:00' },
];

export const demoAlerts: Alert[] = [
  { id: 'a1', tripId: 't1', type: 'budget', message: 'Trip spending has crossed 70% of budget', severity: 'medium', createdAt: '2026-03-17T12:00:00' },
  { id: 'a2', tripId: 't1', type: 'suspicious', message: 'Large misc expense ₹15,000 flagged for review', severity: 'high', createdAt: '2026-03-16T15:35:00' },
  { id: 'a3', tripId: 't1', type: 'inactivity', message: 'No expenses logged by Vikram Singh in 8 hours', severity: 'low', createdAt: '2026-03-17T14:00:00' },
  { id: 'a4', tripId: 't1', type: 'suspicious', message: 'Multiple "Misc" category entries by Amit Patel', severity: 'medium', createdAt: '2026-03-17T16:00:00' },
];

export const demoDiscipline: DisciplineScore[] = [
  { userId: 'u3', onTime: 18, late: 3, rejected: 1, score: 18 * 2 - 3 * 3 - 1 * 5 },
  { userId: 'u4', onTime: 22, late: 1, rejected: 0, score: 22 * 2 - 1 * 3 },
  { userId: 'u5', onTime: 12, late: 5, rejected: 2, score: 12 * 2 - 5 * 3 - 2 * 5 },
  { userId: 'u6', onTime: 8, late: 7, rejected: 4, score: 8 * 2 - 7 * 3 - 4 * 5 },
];

export const demoAuditLogs: AuditLog[] = [
  { id: 'l1', action: 'expense_created', userId: 'u3', metadata: { expenseId: 'e1', amount: 4500, category: 'Fuel' }, createdAt: '2026-03-15T08:30:00' },
  { id: 'l2', action: 'expense_approved', userId: 'u1', metadata: { expenseId: 'e1', approvedAmount: 4500 }, createdAt: '2026-03-15T09:00:00' },
  { id: 'l3', action: 'expense_created', userId: 'u4', metadata: { expenseId: 'e2', amount: 2800, category: 'Food' }, createdAt: '2026-03-15T13:15:00' },
  { id: 'l4', action: 'trip_created', userId: 'u1', metadata: { tripId: 't1', name: 'Char Dham Yatra - March' }, createdAt: '2026-03-10T10:00:00' },
  { id: 'l5', action: 'team_assigned', userId: 'u1', metadata: { tripId: 't1', members: 4 }, createdAt: '2026-03-10T10:05:00' },
  { id: 'l6', action: 'expense_flagged', userId: 'u2', metadata: { expenseId: 'e6', reason: 'Large misc expense' }, createdAt: '2026-03-16T15:35:00' },
  { id: 'l7', action: 'expense_rejected', userId: 'u1', metadata: { expenseId: 'e9', reason: 'No valid receipt' }, createdAt: '2026-03-17T11:00:00' },
  { id: 'l8', action: 'user_login', userId: 'u3', metadata: { device: 'Android', ip: '192.168.1.45' }, createdAt: '2026-03-15T08:00:00' },
  { id: 'l9', action: 'trip_status_changed', userId: 'u1', metadata: { tripId: 't3', from: 'active', to: 'completed' }, createdAt: '2026-02-08T18:00:00' },
  { id: 'l10', action: 'expense_created', userId: 'u5', metadata: { expenseId: 'e4', amount: 350, category: 'Toll' }, createdAt: '2026-03-16T06:45:00' },
];

export function getUserById(id: string) {
  return demoUsers.find(u => u.id === id);
}

export function getTripExpenses(tripId: string) {
  return demoExpenses.filter(e => e.tripId === tripId);
}

export function getTripBudgetStatus(tripId: string) {
  const trip = demoTrips.find(t => t.id === tripId);
  if (!trip) return null;
  const expenses = getTripExpenses(tripId);
  const totalSpent = expenses.filter(e => e.status !== 'rejected').reduce((sum, e) => sum + e.amount, 0);
  return { budget: trip.totalBudget, spent: totalSpent, remaining: trip.totalBudget - totalSpent, percentage: (totalSpent / trip.totalBudget) * 100 };
}

export function getCategoryBreakdown(tripId: string) {
  const expenses = getTripExpenses(tripId).filter(e => e.status !== 'rejected');
  const breakdown: Record<string, number> = {};
  expenses.forEach(e => { breakdown[e.category] = (breakdown[e.category] || 0) + e.amount; });
  return Object.entries(breakdown).map(([category, amount]) => ({ category, amount }));
}
