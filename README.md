<div align="center">

# Subscription Manager

</div>

![Demo](demo.gif)

## Features

- Add, edit, and delete subscriptions
- View subscriptions on a calendar
- Calculate weekly, monthly, and yearly totals
- Customizable icons and colors for each subscription

## Tech Stack

- React
- Express
- PostgreSQL
- Font Awesome

## Setup

### Docker Compose

1. Clone the repository
2. Make sure you have Docker and Docker Compose installed
3. Run the following command in the project root:
   ```
   docker-compose up --build
   ```
4. The app will be available at `http://localhost:3000`

### Manual Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your PostgreSQL database
4. Create a `.env` file with your database credentials
5. Run the app: `npm run dev`

## Adding Icons

This app uses Font Awesome icons. To add an icon to your subscription, use the icon name from the [Font Awesome icon library](https://fontawesome.com/icons).

Enjoy!
