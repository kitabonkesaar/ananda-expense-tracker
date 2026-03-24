import { Id } from "../../convex/_generated/dataModel";

export type UserRole = 'admin' | 'staff';

export interface User {
  _id: Id<"users">;
  name: string;
  phone?: string;
  email?: string;
  picture?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type TripStatus = 'draft' | 'active' | 'completed';

export interface Trip {
  _id: Id<"trips">;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  categoryBudgets?: Record<string, number>;
  createdBy: Id<"users">;
  team: Id<"users">[];
  status: TripStatus;
  createdAt: string;
}

export type ExpenseCategory = string;

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export type ExpensePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';

export interface Expense {
  _id: Id<"expenses">;
  tripId: Id<"trips">;
  amount: number;
  category: string;
  subCategory?: string;
  description: string;
  imageUrl: string;
  createdBy: Id<"users">;
  location: { lat: number; lng: number };
  status: ExpenseStatus;
  paymentMethod: ExpensePaymentMethod;
  rejectionReason?: string;
  createdAt: string;
}

export type AlertType = 'budget' | 'inactivity' | 'suspicious';
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface Alert {
  _id: Id<"alerts">;
  tripId: Id<"trips">;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
}

export interface AuditLog {
  _id: Id<"audit_logs">;
  action: string;
  userId: Id<"users">;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DisciplineScore {
  _id: Id<"discipline_scores">;
  userId: Id<"users">;
  onTime: number;
  late: number;
  rejected: number;
  score: number;
}

export interface Category {
  _id: Id<"categories">;
  name: string;
  subCategories: string[];
}
