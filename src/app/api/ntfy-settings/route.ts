import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { NtfySettings } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.get(`
      SELECT service, topic, domain, gotify_url, gotify_token
      FROM ntfy_settings
      ORDER BY id DESC
      LIMIT 1
    `);
    await db.close();

    return NextResponse.json({
      service: result?.service || 'ntfy',
      topic: result?.topic || '',
      domain: result?.domain || 'https://ntfy.sh',
      gotifyUrl: result?.gotify_url || '',
      gotifyToken: result?.gotify_token || ''
    });
  } catch (error) {
    console.error('Error fetching NTFY settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NTFY settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const settings: NtfySettings = await request.json();
    const db = await getDb();

    // Delete existing settings
    await db.run('DELETE FROM ntfy_settings');

    // Insert new settings
    await db.run(
      `INSERT INTO ntfy_settings
        (service, topic, domain, gotify_url, gotify_token)
       VALUES (?, ?, ?, ?, ?)`,
      [
        settings.service || 'ntfy',
        settings.topic || '',
        settings.domain || 'https://ntfy.sh',
        settings.gotifyUrl || '',
        settings.gotifyToken || ''
      ]
    );

    await db.close();

    return NextResponse.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating NTFY settings:', error);
    return NextResponse.json(
      { error: 'Failed to update NTFY settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const settings: NtfySettings = await request.json();
    console.log('PUT ntfy-settings:', settings);
    const db = await getDb();

    // Delete existing settings
    await db.run('DELETE FROM ntfy_settings');

    // Insert new settings
    await db.run(
      `INSERT INTO ntfy_settings
        (service, topic, domain, gotify_url, gotify_token)
       VALUES (?, ?, ?, ?, ?)`,
      [
        settings.service || 'ntfy',
        settings.topic || '',
        settings.domain || 'https://ntfy.sh',
        settings.gotifyUrl || '',
        settings.gotifyToken || ''
      ]
    );

    await db.close();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating NTFY settings:', error);
    return NextResponse.json(
      { error: 'Failed to update NTFY settings' },
      { status: 500 }
    );
  }
}
