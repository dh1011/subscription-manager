import { NextResponse } from 'next/server';
import { NtfySettings } from '@/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export async function POST(request: Request) {
  try {
    const settings: NtfySettings = await request.json();

    if ((settings.service || 'ntfy') === 'gotify') {
      if (!settings.gotifyUrl || !settings.gotifyToken) {
        return NextResponse.json(
          { error: 'Gotify URL and token are required' },
          { status: 400 }
        );
      }

      const gotifyUrl = trimTrailingSlash(settings.gotifyUrl);
      const response = await fetch(`${gotifyUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gotify-Key': settings.gotifyToken
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'Test notification from Subscription Manager',
          priority: 5
        })
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Gotify rejected the test notification' },
          { status: response.status }
        );
      }

      return NextResponse.json({ message: 'Test notification sent successfully' });
    }

    if (!settings.topic || !settings.domain) {
      return NextResponse.json(
        { error: 'NTFY topic and domain are required' },
        { status: 400 }
      );
    }

    const ntfyDomain = trimTrailingSlash(settings.domain);
    const response = await fetch(`${ntfyDomain}/${settings.topic}`, {
      method: 'POST',
      body: 'Test notification from Subscription Manager'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'NTFY rejected the test notification' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
