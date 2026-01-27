import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import {
    format,
    subMonths,
    subWeeks,
    subYears,
    subDays,
    startOfWeek,
    startOfMonth,
    startOfYear,
    isAfter,
    isBefore,
    parseISO,
    addWeeks,
    addMonths,
    addYears
} from 'date-fns';
import { Subscription } from '@/types';
import styles from './Charts.module.css';
import getSymbolFromCurrency from 'currency-symbol-map';

interface CostTrendGraphProps {
    subscriptions: Subscription[];
    selectedPeriod: 'week' | 'month' | 'year';
    currency: string;
    showCurrencySymbol: boolean;
}

const subtractInterval = (date: Date, value: number, unit: string): Date => {
    switch (unit) {
        case 'days': return subDays(date, value);
        case 'weeks': return subWeeks(date, value);
        case 'months': return subMonths(date, value);
        case 'years': return subYears(date, value);
        default: return subMonths(date, value);
    }
};

const CostTrendGraph: React.FC<CostTrendGraphProps> = ({
    subscriptions,
    selectedPeriod,
    currency,
    showCurrencySymbol
}) => {
    const data = useMemo(() => {
        const today = new Date();
        let startDate: Date;
        let dateFormat: string;
        let labelFormat: string;
        let points: number;
        let iteratorStep: (d: Date, n: number) => Date;
        let pointKeyFn: (d: Date) => string;

        // Define X-axis range and granularity based on selected period
        if (selectedPeriod === 'week') {
            // Show last 12 weeks
            points = 12;
            startDate = startOfWeek(subWeeks(today, points - 1));
            dateFormat = 'yyyy-ww'; // unique key
            labelFormat = "'W'w"; // Week number label
            iteratorStep = addWeeks;
            pointKeyFn = (d) => format(d, 'yyyy-ww');
        } else if (selectedPeriod === 'year') {
            // Show last 5 years
            points = 5;
            startDate = startOfYear(subYears(today, points - 1));
            dateFormat = 'yyyy';
            labelFormat = 'yyyy';
            iteratorStep = addYears;
            pointKeyFn = (d) => format(d, 'yyyy');
        } else {
            // Default: Month - Show last 12 months
            points = 12;
            startDate = startOfMonth(subMonths(today, points - 1));
            dateFormat = 'yyyy-MM';
            labelFormat = 'MMM';
            iteratorStep = addMonths;
            pointKeyFn = (d) => format(d, 'yyyy-MM');
        }

        // Initialize map
        const trendTotals = new Map<string, number>();
        const timePoints: string[] = [];

        let current = startDate;
        for (let i = 0; i < points; i++) {
            const key = pointKeyFn(current);
            trendTotals.set(key, 0);
            timePoints.push(key);
            current = iteratorStep(current, 1);
        }

        // Populate data
        subscriptions.forEach(sub => {
            if (sub.included === false) return;
            const amount = typeof sub.amount === 'string' ? parseFloat(sub.amount) : sub.amount;
            if (!amount) return;

            const dateStr = sub.dueDate || sub.due_date;
            if (!dateStr) return;

            let paymentDate = parseISO(dateStr);
            if (isNaN(paymentDate.getTime())) return;

            const intervalValue = sub.interval_value || sub.intervalValue || 1;
            const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';

            if (intervalValue <= 0) return;

            let cursor = new Date(paymentDate);
            let iterations = 0;
            const MAX_ITERATIONS = 1000;

            // Start from due date and go backwards using the helper
            cursor = subtractInterval(cursor, intervalValue, intervalUnit);

            while (isAfter(cursor, startDate) || cursor.getTime() === startDate.getTime()) {
                if (iterations++ > MAX_ITERATIONS) break;

                if (isBefore(cursor, today) || cursor.getTime() === today.getTime()) {
                    const key = pointKeyFn(cursor);
                    if (trendTotals.has(key)) {
                        trendTotals.set(key, (trendTotals.get(key) || 0) + amount);
                    }
                }

                cursor = subtractInterval(cursor, intervalValue, intervalUnit);
            }
        });

        // Format for Recharts
        return timePoints.map(tp => {
            // Parse key back to date for label if needed, or iterate differently
            // Simplified: we used consistent formatting.
            // For rendering, we can regex/parse or just reconstruct
            let label = tp;
            if (selectedPeriod === 'month') {
                label = format(parseISO(tp + '-01'), labelFormat);
            } else if (selectedPeriod === 'week') {
                // 'yyyy-ww' is tricky to parse directly into a date object correctly without context
                // Let's just use the string suffix for now
                label = tp.split('-')[1];
            } else {
                label = tp;
            }

            return {
                name: label,
                fullKey: tp,
                amount: trendTotals.get(tp) || 0
            };
        });

    }, [subscriptions, selectedPeriod]);

    const formatCurrency = (val: number) => {
        if (showCurrencySymbol) {
            return `${getSymbolFromCurrency(currency) || '$'}${val.toFixed(0)}`;
        }
        return `${val.toFixed(0)} ${currency}`;
    };

    return (
        <div className={styles.chartCard}>
            <div className={styles.title}>
                Total Cost Trend ({selectedPeriod === 'year' ? 'Yearly' : selectedPeriod === 'week' ? 'Weekly' : 'Monthly'})
            </div>
            <div className={styles.graphWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                            <p className={styles.tooltipLabel}>{payload[0].payload.fullKey}</p>
                                            <p className={styles.tooltipValue}>
                                                {formatCurrency(payload[0].value as number)}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ fill: '#6366f1', strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CostTrendGraph;
