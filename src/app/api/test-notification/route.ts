import { NextResponse } from 'next/server';
import { NotificationDeliveryError, sendNotification } from '@/lib/notifications';
import { NtfySettings } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const settings: NtfySettings = await request.json();
    await sendNotification(settings, {
      title: 'Test Notification',
      message: 'Test notification from Subscription Manager',
      priority: 5
    });

    return NextResponse.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    if (error instanceof NotificationDeliveryError) {
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
