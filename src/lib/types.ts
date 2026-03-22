export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type TripStatus = 'draft' | 'active' | 'completed';

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  createdBy: string;
  team: string[];
  status: TripStatus;
  createdAt: string;
}

export type ExpenseCategory = 'Fuel' | 'Food' | 'Toll' | 'Hotel' | 'Transport' | 'Misc';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  imageUrl: string;
  createdBy: string;
  location: { lat: number; lng: number };
  status: ExpenseStatus;
  rejectionReason?: string;
  createdAt: string;
}

export type AlertType = 'budget' | 'inactivity' | 'suspicious';
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface Alert {
  id: string;
  tripId: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DisciplineScore {
  userId: string;
  onTime: number;
  late: number;
  rejected: number;
  score: number;
}
