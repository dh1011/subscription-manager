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

export type NotificationService = 'ntfy' | 'gotify';

export interface NtfySettings {
  service: NotificationService;
  topic: string;
  domain?: string;
  gotifyUrl?: string;
  gotifyToken?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
