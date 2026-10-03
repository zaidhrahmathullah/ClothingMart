# ClothingMart

A full-stack e-commerce application built with Next.js, Express, TypeScript, PostgreSQL and Prisma.

ClothingMart includes a customer storefront, administrative management features and an integrated PayPal Sandbox checkout and refund workflow.

## Tech Stack

Layer - Technologies
Frontend - Next.js 16, React 19, TypeScript, Tailwind CSS 4
Backend - Node.js, Express 5, TypeScript, Zod
Database - PostgreSQL, Prisma 7
Authentication - JWT access and refresh tokens using cookies
Payments - PayPal Sandbox, PayPal JavaScript SDK
Architecture - npm workspaces monorepo


## Features

### Customer Storefront

- Product catalogue and category browsing
- Product variants and images
- Shopping cart and wishlist
- Customer authentication and address management
- Checkout and order history
- PayPal Sandbox checkout with eligible PayPal and card payment options
- LKR storefront pricing with currency conversion for PayPal transactions

### Administration

- Product and category management
- Inventory management
- Customer and order management
- Payment and refund management

### Payment Architecture

- Shared payment-provider contract and registry
- PayPal-specific implementation isolated from shared payment logic
- Payment state transitions and order synchronization
- Webhook verification and event replay protection
- Payment creation and capture recovery
- Refund processing with durable claims and idempotency safeguards
- Inventory and cart finalization after successful payment

PayPal is the currently implemented payment provider. The architecture supports introducing additional providers in the future; PayHere and Stripe integrations are not currently implemented.


## Project Structure

ClothingMart/
├── apps/
│   ├── api/               # Express backend
│   │   └── src/
│   │       └── modules/
│   └── web/               # Next.js frontend
│       └── src/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── prisma7.config.ts
├── package.json
└── README.md


## Local Development

### Prerequisites

- Node.js and npm compatible with the installed dependencies
- PostgreSQL
- PayPal Developer Sandbox credentials
- An exchange-rate API key for the configured exchange-rate service

### 1. Install dependencies

From the project root:

npm install


### 2. Configure environment variables

Create these local files using the provided examples:

apps/api/.env.example  →  apps/api/.env
apps/web/.env.example  →  apps/web/.env.local


Update the values for your local environment.

The backend configuration includes database connectivity, authentication secrets, PayPal credentials, webhook configuration and exchange-rate settings.

Never commit real environment files or API credentials.

### 3. Prepare the database

Create the PostgreSQL database specified by `DATABASE_URL`.

From the project root, run:

npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts


The Prisma configuration reads the database connection from `apps/api/.env` during local development.

### 4. Start the backend

npm run dev:backend


Default local API address:

http://localhost:4000/api/v1


### 5. Start the frontend

In another terminal:

npm run dev:frontend


Open:

http://localhost:3000


## Available Scripts

Run these commands from the project root:

Command - Purpose
`npm run dev:frontend` - Start the Next.js development server
`npm run dev:backend` - Start the Express development server
`npm run build:frontend` - Build the frontend
`npm run build:backend` - Compile the backend
`npm run build` - Build both applications
`npm run start:frontend` - Start the production-built frontend
`npm run start:backend` - Start the compiled backend
`npm test --workspace apps/api` - Run the configured backend payment regression tests


## PayPal Sandbox

ClothingMart uses PayPal Sandbox for development and payment testing.

The backend creates and captures PayPal orders. The frontend uses the PayPal JavaScript SDK to display eligible checkout options.

The application stores original ClothingMart amounts in LKR and uses the configured exchange-rate service for PayPal transaction amounts.

Webhook processing, payment synchronization, cancellation handling, recovery and refund operations are handled by the backend.

Production payment activation requires separate production credentials, deployment configuration and verification. The presence of a live-mode configuration option does not mean that live payments are enabled.


## Security and Configuration

- Keep authentication secrets and provider credentials server-side.
- Do not expose PayPal client secrets through frontend environment variables.
- Use the provided `.env.example` files as configuration templates.
- PayPal live-mode activation has an explicit safeguard.
- Destructive demo seeding must not be enabled against production databases.
- Configure appropriate frontend origins and HTTPS when deploying.


## Testing

The backend contains automated tests covering payment configuration, webhook handling, order synchronization, cancellation, capture recovery, creation idempotency and refunds.

Run:

npm test --workspace apps/api


Check both applications:

npm run build


Sandbox payment testing should also be performed before any production deployment.


## Project Status

Active Development — Payment Integration Milestone Completed

ClothingMart is an evolving full-stack e-commerce portfolio project.

The PayPal Sandbox payment integration is implemented and tested, including checkout, capture verification, webhook processing, refunds, idempotency, and order finalization.

Both frontend and backend production builds pass, alongside 62 automated backend tests.

Additional platform improvements are planned before the final deployment release.

Note: PayPal Live payments and public production deployment have not yet been activated.