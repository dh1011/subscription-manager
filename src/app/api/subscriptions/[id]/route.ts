import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Subscription } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const subscription: Subscription = await request.json();
    const db = await getDb();

    await db.run(
      `UPDATE subscriptions SET
        name = ?, amount = ?, due_date = ?, icon = ?, color = ?,
        account = ?, autopay = ?, interval_value = ?, interval_unit = ?,
        notify = ?, currency = ?, tags = ?
      WHERE id = ?`,
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
        subscription.tags ? JSON.stringify(subscription.tags) : null,
        id
      ]
    );

    const updatedSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    await db.close();

    if (!updatedSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig ? Boolean(userConfig.show_currency_symbol) : true;

    // Map 'default' currency to the user's configured currency
    const result = {
      ...updatedSubscription,
      currency: updatedSubscription.currency === 'default' ? defaultCurrency : updatedSubscription.currency,
      showCurrencySymbol,
      tags: updatedSubscription.tags ? JSON.parse(updatedSubscription.tags) : []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const db = await getDb();
    
    const result = await db.run('DELETE FROM subscriptions WHERE id = ?', id);
    await db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const db = await getDb();
    
    const subscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    await db.close();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig ? Boolean(userConfig.show_currency_symbol) : true;

    // Map 'default' currency to the user's configured currency
    const result = {
      ...subscription,
      currency: subscription.currency === 'default' ? defaultCurrency : subscription.currency,
      showCurrencySymbol,
      tags: subscription.tags ? JSON.parse(subscription.tags) : []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
} 