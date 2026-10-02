import { NextResponse } from 'next/server';
import { NotificationDeliveryError, sendNotification } from '@/lib/notifications';
import { NtfySettings } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: Request) {
  let settings: NtfySettings;
  try {
    settings = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid notification settings JSON.' }, { status: 400 });
  }
  try {
    await sendNotification(settings, {
      title: 'Test Notification',
      message: 'Test notification from Subscription Manager',
      priority: 5
    });

    return NextResponse.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    if (error instanceof NotificationDeliveryError) {
      console.error(`Test notification failed: ${error.message}`);
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
