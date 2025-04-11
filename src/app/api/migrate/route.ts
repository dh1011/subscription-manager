import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    // Check if background_url column exists
    const tableInfo = await db.all("PRAGMA table_info(user_configuration)");
    const backgroundUrlExists = tableInfo.some(col => col.name === 'background_url');
    
    if (!backgroundUrlExists) {
      // Add the missing column
      await db.exec("ALTER TABLE user_configuration ADD COLUMN background_url TEXT");
      
      // Set default value for existing records
      await db.run(
        "UPDATE user_configuration SET background_url = ? WHERE background_url IS NULL",
        ['https://cdn.midjourney.com/1f46fbfe-102d-49d8-aa96-b54f1ea9a19a/0_0.png']
      );
    }
    
    await db.close();
    
    return NextResponse.json({ 
      message: 'Database migration successful',
      migrated: !backgroundUrlExists
    });
  } catch (error) {
    console.error('Error migrating database:', error);
    return NextResponse.json(
      { error: 'Failed to migrate database' },
      { status: 500 }
    );
  }
} 