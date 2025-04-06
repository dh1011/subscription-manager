import { NextResponse } from 'next/server';
import { initializeDb } from '@/lib/db';

export async function GET() {
  try {
    await initializeDb();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
} 