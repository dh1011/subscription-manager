import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Subscription } from '@/types';

function mapSubscription(sub: any, defaultCurrency: string, showCurrencySymbol: boolean) {
  return {
    ...sub,
    dueDate: sub.due_date,
    endDate: sub.end_date,
    paidCycleDueDate: sub.paid_cycle_due_date,
    paidAt: sub.paid_at,
    intervalValue: sub.interval_value,
    intervalUnit: sub.interval_unit,
    currency: sub.currency === 'default' ? defaultCurrency : sub.currency,
    showCurrencySymbol,
    tags: sub.tags ? JSON.parse(sub.tags) : []
  };
}

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
        notify = ?, currency = ?, end_date = ?, tags = ?
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
        subscription.endDate || subscription.end_date || null,
        subscription.tags ? JSON.stringify(subscription.tags) : null,
        id
      ]
    );

    if (subscription.autopay) {
      await db.run(
        'UPDATE subscriptions SET paid_cycle_due_date = NULL, paid_at = NULL WHERE id = ?',
        [id]
      );
    }

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

    const result = mapSubscription(updatedSubscription, defaultCurrency, showCurrencySymbol);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { paid, cycleDueDate } = await request.json();

    if (typeof paid !== 'boolean' || typeof cycleDueDate !== 'string' || !cycleDueDate) {
      return NextResponse.json(
        { error: 'paid and cycleDueDate are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existingSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);

    if (!existingSubscription) {
      await db.close();
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (Boolean(existingSubscription.autopay)) {
      await db.close();
      return NextResponse.json(
        { error: 'Paid status is only available for non-autopay subscriptions' },
        { status: 400 }
      );
    }

    if (paid) {
      await db.run(
        `UPDATE subscriptions
         SET paid_cycle_due_date = ?, paid_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [cycleDueDate, id]
      );
    } else {
      await db.run(
        `UPDATE subscriptions
         SET paid_cycle_due_date = NULL, paid_at = NULL
         WHERE id = ?`,
        [id]
      );
    }

    const updatedSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    await db.close();

    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig ? Boolean(userConfig.show_currency_symbol) : true;

    return NextResponse.json(mapSubscription(updatedSubscription, defaultCurrency, showCurrencySymbol));
  } catch (error) {
    console.error('Error updating subscription paid status:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription paid status' },
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

    const result = mapSubscription(subscription, defaultCurrency, showCurrencySymbol);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
} 
