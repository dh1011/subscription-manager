export interface UserConfiguration {
  currency: string;
  showCurrencySymbol: boolean;
}

export interface Subscription {
  id?: number;
  name: string;
  amount: number;
  dueDate: string;
  due_date?: string;
  endDate?: string | null;
  end_date?: string | null;
  paidCycleDueDate?: string | null;
  paid_cycle_due_date?: string | null;
  paidAt?: string | null;
  paid_at?: string | null;
  icon?: string;
  color?: string;
  account?: string;
  autopay: boolean;
  intervalValue: number;
  intervalUnit: string;
  interval_value?: number;
  interval_unit?: 'days' | 'weeks' | 'months' | 'years';
  notify: boolean;
  currency: string;
  included?: boolean;
  tags?: string[];
}

export interface NtfySettings {
  topic: string;
  domain?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
