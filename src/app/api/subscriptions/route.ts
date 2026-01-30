import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Subscription } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const subscriptions = await db.all('SELECT * FROM subscriptions');
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    await db.close();

    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig ? Boolean(userConfig.show_currency_symbol) : true;

    const result = subscriptions.map(sub => ({
      ...sub,
      dueDate: sub.due_date,
      intervalValue: sub.interval_value,
      intervalUnit: sub.interval_unit,
      currency: sub.currency === 'default' ? defaultCurrency : sub.currency,
      showCurrencySymbol,
      tags: sub.tags ? JSON.parse(sub.tags) : []
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const subscription: Subscription = await request.json();
    const db = await getDb();

    const result = await db.run(
      `INSERT INTO subscriptions (
        name, amount, due_date, icon, color, account, autopay,
        interval_value, interval_unit, notify, currency, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscription.name,
        subscription.amount,
        subscription.dueDate,
        subscription.icon,
        subscription.color,
        subscription.account,
        subscription.autopay ? 1 : 0,
        subscription.intervalValue,
        subscription.intervalUnit,
        subscription.notify ? 1 : 0,
        subscription.currency || 'default',
        subscription.tags ? JSON.stringify(subscription.tags) : null
      ]
    );

    const newSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', result.lastID);
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    await db.close();

    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig ? Boolean(userConfig.show_currency_symbol) : true;

    // Map 'default' currency to the user's configured currency
    const finalSubscription = {
      ...newSubscription,
      dueDate: newSubscription.due_date,
      intervalValue: newSubscription.interval_value,
      intervalUnit: newSubscription.interval_unit,
      currency: newSubscription.currency === 'default' ? defaultCurrency : newSubscription.currency,
      showCurrencySymbol,
      tags: newSubscription.tags ? JSON.parse(newSubscription.tags) : []
    };

    return NextResponse.json(finalSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}