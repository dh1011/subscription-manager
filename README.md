# 📅 Subscription Manager

[![Docker](https://img.shields.io/docker/pulls/dh1011/subscription-manager.svg)](https://hub.docker.com/r/dh1011/subscription-manager)

This single-page web application lets you keep track of and manage your subscriptions. You can add, edit, delete, and view subscriptions all in one place. You can set up notifications for each subscription using NTFY. The app provides a general summary of all your subscriptions and a detailed summary for each payment account, all within a single, intuitive interface.

## Demo
https://github.com/user-attachments/assets/9e7830e1-3c3c-474a-8f48-93ee8f5e440d

## Features
- ➕ Add, edit, and delete subscriptions
- 🗓️ View subscriptions on a calendar
- 💰 Calculate weekly, monthly, and yearly totals
- 📊 Detailed summaries per payment account
- 🖼️ Easy to add icons for each subscription
- 🔔 Notification system integration with NTFY
- 💱 Support for multiple currencies

## Tech Stack

- ⚛️ Next.js
- 🔄 React
- 🗄️ SQLite
- 🐳 Docker
- 🎨 Iconify

## Setup

### Using Docker Compose

1. Create a `docker-compose.yml` file with the following content:

   ```yaml
   version: "3.9"
   services:
     app:
       image: dh1011/subscription-manager:stable
       ports:
         - "3000:3000"
       volumes:
         - ./data:/app/data
       restart: unless-stopped
   ```

2. Run Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. The app will be available at `http://localhost:3000`.

---

### Manual Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/subscription-manager.git
   cd subscription-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The app will be available at `http://localhost:3000`.

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Adding Icons

This app uses Iconify icons. To add an icon to your subscription, use the icon name from the [Iconify icon library](https://icon-sets.iconify.design/).

## Notifications

The app integrates with NTFY for sending notifications. To set up notifications:

1. Go to the Settings page
2. Enter your NTFY topic
3. Save the settings

You'll receive notifications for upcoming subscription payments.

Enjoy 🎉!
