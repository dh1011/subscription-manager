import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { UserConfiguration } from '@/types';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
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
    
    const existing = await db.get('SELECT id FROM user_configuration LIMIT 1');
    
    if (existing) {
      await db.run(
        'UPDATE user_configuration SET currency = ?, show_currency_symbol = ? WHERE id = ?',
        [config.currency, config.showCurrencySymbol ? 1 : 0, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
        [config.currency, config.showCurrencySymbol ? 1 : 0]
      );
    }
    
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
    const db = await getDb();
    
    const existing = await db.get('SELECT id FROM user_configuration LIMIT 1');
    
    if (existing) {
      await db.run(
        'UPDATE user_configuration SET currency = ?, show_currency_symbol = ? WHERE id = ?',
        [config.currency, config.showCurrencySymbol ? 1 : 0, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
        [config.currency, config.showCurrencySymbol ? 1 : 0]
      );
    }
    
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