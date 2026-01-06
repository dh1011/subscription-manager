import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Subscription } from '@/types';
import styles from './Charts.module.css';
import getSymbolFromCurrency from 'currency-symbol-map';

interface CompositionChartsProps {
    subscriptions: Subscription[];
    currency: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CompositionCharts: React.FC<CompositionChartsProps> = ({ subscriptions, currency }) => {

    // Normalize everything to monthly cost for fair comparison in pie chart
    const getMonthlyAmount = (sub: Subscription) => {
        if (sub.included === false) return 0;
        const amount = typeof sub.amount === 'string' ? parseFloat(sub.amount) : sub.amount;
        const intervalValue = sub.interval_value || sub.intervalValue || 1;
        const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';

        if (!amount || intervalValue <= 0) return 0;

        switch (intervalUnit) {
            case 'days': return (amount * 30) / intervalValue; // Approx
            case 'weeks': return (amount * 4.33) / intervalValue; // Approx
            case 'months': return amount / intervalValue;
            case 'years': return amount / (12 * intervalValue);
            default: return amount;
        }
    };

    const { categoryData, paymentData } = useMemo(() => {
        const catMap = new Map<string, number>();
        const payMap = new Map<string, number>();

        subscriptions.forEach(sub => {
            const monthlyCost = getMonthlyAmount(sub);
            if (monthlyCost === 0) return;

            // Categories (First tag)
            let category = 'Uncategorized';
            if (sub.tags && sub.tags.length > 0) {
                category = sub.tags[0];
            }
            catMap.set(category, (catMap.get(category) || 0) + monthlyCost);

            // Payment Method
            const payment = sub.account || 'Unspecified';
            payMap.set(payment, (payMap.get(payment) || 0) + monthlyCost);
        });

        const formatData = (map: Map<string, number>) => {
            return Array.from(map.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value); // Descending
        };

        return {
            categoryData: formatData(catMap),
            paymentData: formatData(payMap)
        };
    }, [subscriptions]);

    const renderCustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const symbol = getSymbolFromCurrency(currency) || '$';
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{data.name}</p>
                    <p className={styles.tooltipValue}>
                        {symbol}{data.value.toFixed(2)} / mo
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.8em' }}>
                        {((data.payload.percent || 0) * 100).toFixed(0)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderChart = (title: string, data: any[]) => (
        <div className={styles.chartCard} style={{ flex: 1, minWidth: '300px' }}>
            <div className={styles.title}>{title}</div>
            <div className={styles.subtitle}>Monthly Cost Distribution</div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={renderCustomTooltip} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className={styles.pieChartsWrapper}>
            {renderChart("Spend by Category", categoryData)}
            {renderChart("Spend by Method", paymentData)}
        </div>
    );
};

export default CompositionCharts;
