import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { format, addMonths, addDays } from 'date-fns';

export async function GET() {
    try {
        const db = await getDb();

        // Clear existing data
        await db.run('DELETE FROM subscriptions');

        const today = new Date();

        const mockSubscriptions = [
            {
                name: 'Netflix',
                amount: 15.99,
                due_date: format(addDays(today, 5), 'yyyy-MM-dd'),
                icon: 'mdi:netflix',
                color: '#E50914',
                account: 'Credit Card',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'months',
                notify: 1,
                currency: 'USD',
                tags: ['Entertainment', 'Streaming']
            },
            {
                name: 'Spotify',
                amount: 9.99,
                due_date: format(addDays(today, 12), 'yyyy-MM-dd'),
                icon: 'mdi:spotify',
                color: '#1DB954',
                account: 'PayPal',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'months',
                notify: 0,
                currency: 'USD',
                tags: ['Music', 'Streaming']
            },
            {
                name: 'AWS',
                amount: 45.50,
                due_date: format(addDays(today, 2), 'yyyy-MM-dd'),
                icon: 'mdi:aws',
                color: '#FF9900',
                account: 'Business Card',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'months',
                notify: 1,
                currency: 'USD',
                tags: ['Work', 'Infrastructure']
            },
            {
                name: 'Internet',
                amount: 79.00,
                due_date: format(addDays(today, 20), 'yyyy-MM-dd'),
                icon: 'mdi:wifi',
                color: '#0066CC',
                account: 'Checking',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'months',
                notify: 1,
                currency: 'USD',
                tags: ['Utilities']
            },
            {
                name: 'Gym Membership',
                amount: 50.00,
                due_date: format(addDays(today, 1), 'yyyy-MM-dd'),
                icon: 'mdi:dumbbell',
                color: '#333333',
                account: 'Credit Card',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'months',
                notify: 0,
                currency: 'USD',
                tags: ['Health']
            },
            {
                name: 'Adobe Creative Cloud',
                amount: 599.88,
                due_date: format(addMonths(today, 3), 'yyyy-MM-dd'),
                icon: 'simple-icons:adobe',
                color: '#FF0000',
                account: 'Business Card',
                autopay: 1,
                interval_value: 1,
                interval_unit: 'years',
                notify: 1,
                currency: 'USD',
                tags: ['Work', 'Software']
            },
            {
                name: 'Meal Kit',
                amount: 60.00,
                due_date: format(addDays(today, 3), 'yyyy-MM-dd'),
                icon: 'mdi:food',
                color: '#4CAF50',
                account: 'Credit Card',
                autopay: 0,
                interval_value: 1,
                interval_unit: 'weeks',
                notify: 1,
                currency: 'USD',
                tags: ['Food']
            },
            {
                name: 'Car Insurance',
                amount: 1200.00,
                due_date: format(addMonths(today, 5), 'yyyy-MM-dd'),
                icon: 'mdi:car',
                color: '#003366',
                account: 'Checking',
                autopay: 1,
                interval_value: 6,
                interval_unit: 'months',
                notify: 1,
                currency: 'USD',
                tags: ['Insurance']
            }
        ];

        for (const sub of mockSubscriptions) {
            await db.run(
                `INSERT INTO subscriptions (
          name, amount, due_date, icon, color, account, autopay, 
          interval_value, interval_unit, notify, currency, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sub.name, sub.amount, sub.due_date, sub.icon, sub.color, sub.account,
                    sub.autopay, sub.interval_value, sub.interval_unit, sub.notify,
                    sub.currency, JSON.stringify(sub.tags)
                ]
            );
        }

        await db.close();

        return NextResponse.json({ message: 'Database seeded successfully', count: mockSubscriptions.length });
    } catch (error) {
        console.error('Error seeding database:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
