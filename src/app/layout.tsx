import type { Metadata } from 'next';
import localFont from 'next/font/local';
import StyledComponentsRegistry from '@/lib/registry';
import './globals.css';

const poppins = localFont({
  src: [
    { path: './fonts/poppins/Poppins-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/poppins/Poppins-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins/Poppins-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins/Poppins-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins/Poppins-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-poppins',
});

const montserrat = localFont({
  src: './fonts/montserrat/Montserrat.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Subscription Manager',
  description: 'Manage your subscriptions in one place',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo192.png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/logo192.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body className={`${poppins.variable} ${montserrat.variable}`}>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
