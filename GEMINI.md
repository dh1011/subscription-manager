# GEMINI.md - Subscription Manager Project Context

This project is a single-page web application built with **Next.js** for managing subscriptions. It allows users to track expenses, set up notifications via NTFY, and visualize their subscription payments on a calendar.

## Project Overview

-   **Main Technologies:** Next.js (App Router), React, TypeScript, SQLite, Styled Components, Framer Motion, date-fns, Iconify.
-   **Architecture:**
    -   **Frontend:** React components with Styled Components and CSS Modules. Next.js App Router for routing.
    -   **Backend:** Next.js API Routes (`src/app/api/`) interacting with a local SQLite database.
    -   **Database:** SQLite database located in the `data/` directory (initialized at runtime).
-   **Key Features:**
    -   Subscription CRUD operations.
    -   Calendar view of due dates.
    -   Calculation of weekly, monthly, and yearly totals.
    -   Visualization with charts (Composition, Cost Trend, History).
    -   NTFY integration for push notifications.
    -   Multi-currency support.

## Core Directories

-   `src/app/`: Next.js App Router pages and API routes.
-   `src/components/`: Reusable UI components, including visualization charts.
-   `src/lib/`: Core logic, including database configuration (`db.ts`), date utilities (`dateUtils.ts`), and general utilities (`utils.ts`).
-   `src/types/`: TypeScript interfaces and types.
-   `public/`: Static assets like icons and manifest files.
-   `data/`: (Generated at runtime) Stores the SQLite database file.

## Building and Running

-   **Development:** `npm run dev` - Starts the development server at `http://localhost:3000`.
-   **Build:** `npm run build` - Creates a production-ready build.
-   **Production Start:** `npm run start` - Runs the production server after building.
-   **Linting:** `npm run lint` - Runs ESLint for code quality checks.
-   **Database Seeding:** `GET /api/seed` - Populates the database with mock subscription data for testing.
-   **Docker:** Can be run via Docker Compose using the provided `docker-compose.yml`.

## Development Conventions

-   **Type Safety:** Strictly use TypeScript for all new code. Types are defined in `src/types/index.ts`.
-   **Database Access:** Use the `getDb` function from `src/lib/db.ts` to interact with the SQLite database.
-   **Styling:** A mix of Styled Components and CSS Modules is used. Follow the existing pattern for the component you are modifying.
-   **Date Manipulation:** Use `date-fns` for all date-related logic (see `src/lib/dateUtils.ts`).
-   **Icons:** Use Iconify via `@iconify-icon/react`.
-   **API Responses:** Follow the `ApiResponse<T>` structure defined in `src/types/index.ts`.

## Key Files & Their Roles

-   `src/lib/db.ts`: Handles SQLite connection and schema initialization.
-   `src/app/api/init/route.ts`: API endpoint to trigger database initialization.
-   `src/types/index.ts`: Central location for shared TypeScript interfaces (Subscription, UserConfiguration, etc.).
-   `src/app/page.tsx`: The main application entry point.
-   `docker-compose.yml`: Standard deployment configuration.
