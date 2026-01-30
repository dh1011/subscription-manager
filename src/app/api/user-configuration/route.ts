import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { UserConfiguration } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.get('SELECT currency, show_currency_symbol FROM user_configuration ORDER BY id DESC LIMIT 1');
    await db.close();

    if (!result) {
      return NextResponse.json({
        currency: 'USD',
        showCurrencySymbol: true
      });
    }

    return NextResponse.json({
      currency: result.currency,
      showCurrencySymbol: Boolean(result.show_currency_symbol)
    });
  } catch (error) {
    console.error('Error fetching user configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const config: UserConfiguration = await request.json();
    const db = await getDb();

    // Delete existing
    await db.run('DELETE FROM user_configuration');

    // Insert new
    await db.run(
      'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
      [config.currency, config.showCurrencySymbol ? 1 : 0]
    );

    await db.close();

    return NextResponse.json({ message: 'User configuration updated successfully' });
  } catch (error) {
    console.error('Error updating user configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update user configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const config: UserConfiguration = await request.json();
    console.log('PUT user-configuration:', config);
    const db = await getDb();

    // Delete existing
    await db.run('DELETE FROM user_configuration');

    // Insert new
    await db.run(
      'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
      [config.currency, config.showCurrencySymbol ? 1 : 0]
    );

    await db.close();

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating user configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update user configuration' },
      { status: 500 }
    );
  }
}