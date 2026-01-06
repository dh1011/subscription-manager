import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, subMonths, startOfMonth, isAfter, isBefore, subDays, subWeeks, subYears, parseISO } from 'date-fns';
import { Subscription } from '@/types';
import styles from './HistoryGraph.module.css';
import getSymbolFromCurrency from 'currency-symbol-map';

interface HistoryGraphProps {
  subscriptions: Subscription[];
  currency: string;
  showCurrencySymbol: boolean;
}

const subtractInterval = (date: Date, value: number, unit: string) => {
  switch (unit) {
    case 'days': return subDays(date, value);
    case 'weeks': return subWeeks(date, value);
    case 'months': return subMonths(date, value);
    case 'years': return subYears(date, value);
    default: return subMonths(date, value);
  }
};

const HistoryGraph: React.FC<HistoryGraphProps> = ({ subscriptions, currency, showCurrencySymbol }) => {
  const data = useMemo(() => {
    const today = new Date();
    const startDate = subMonths(startOfMonth(today), 11); // Start 11 months ago to show 12 months total

    // Initialize map for last 12 months
    const monthlyTotals = new Map<string, number>();
    const months: string[] = [];

    let currentMonth = startDate;
    for (let i = 0; i < 12; i++) {
      const monthKey = format(currentMonth, 'yyyy-MM');
      monthlyTotals.set(monthKey, 0);
      months.push(monthKey);
      currentMonth = subMonths(currentMonth, -1); // actually add 1 month
    }

    subscriptions.forEach(sub => {
      if (sub.included === false) return;

      const amount = typeof sub.amount === 'string' ? parseFloat(sub.amount) : sub.amount;
      if (!amount) return;

      let paymentDate = parseISO(sub.due_date);
      // If due date is invalid, skip
      if (isNaN(paymentDate.getTime())) return;

      const intervalValue = sub.interval_value || sub.intervalValue || 1;
      const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';

      // Safety check: if interval is 0 or invalid, skip to avoid infinite loop
      if (intervalValue <= 0) return;

      // Limit iterations to prevent infinite loops in case of weird data
      let iterations = 0;
      const MAX_ITERATIONS = 1000;

      let cursor = new Date(paymentDate);

      // Initial step back
      cursor = subtractInterval(cursor, intervalValue, intervalUnit);

      while (isAfter(cursor, startDate) || cursor.getTime() === startDate.getTime()) {
        if (iterations++ > MAX_ITERATIONS) break;

        if (isBefore(cursor, today) || cursor.getTime() === today.getTime()) {
          const monthKey = format(cursor, 'yyyy-MM');
          if (monthlyTotals.has(monthKey)) {
            monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
          }
        }

        // Move back
        cursor = subtractInterval(cursor, intervalValue, intervalUnit);
      }
    });

    return months.map(month => ({
      name: format(parseISO(month + '-01'), 'MMM'),
      fullDate: month,
      amount: monthlyTotals.get(month) || 0
    }));

  }, [subscriptions]);

  const formatCurrency = (val: number) => {
    if (showCurrencySymbol) {
      return `${getSymbolFromCurrency(currency) || '$'}${val.toFixed(0)}`;
    }
    return `${val.toFixed(0)} ${currency}`;
  };

  return (
    <div className={styles.graphContainer}>
      <div className={styles.title}>
        Spending History (Est.)
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={styles.customTooltip}>
                      <p className={styles.tooltipLabel}>{payload[0].payload.fullDate}</p>
                      <p className={styles.tooltipValue}>
                        {formatCurrency(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#818cf8' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryGraph;
