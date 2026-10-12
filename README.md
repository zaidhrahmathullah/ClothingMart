# ClothingMart

**A full-stack e-commerce platform built with Next.js, React, Express, TypeScript, PostgreSQL, and Prisma.**

ClothingMart is a publicly deployed e-commerce portfolio project featuring a customer storefront, administrative management system, and PayPal Sandbox payment integration.

The project demonstrates full-stack application development, REST API design, database modeling, secure authentication, payment processing, and cloud deployment.

### Live Demo

**Website:** https://clothingmart.vercel.app

**Source Code:** https://github.com/zaidhrahmathullah/ClothingMart

> **Payment Notice:** ClothingMart currently supports PayPal Sandbox transactions for demonstration and testing. Real-money payments are not enabled.

## Features

### Customer Storefront

- Responsive product catalogue and category navigation
- Product details, images, and variants
- Shopping cart and wishlist
- Customer registration and login
- Profile and shipping address management
- Checkout and order history
- PayPal Sandbox checkout
- LKR storefront pricing with exchange-rate conversion for PayPal transactions

### Administration

- Product creation, editing, and management
- Category and subcategory management
- Product image uploads
- Inventory management
- Customer and order management
- Payment monitoring and refund management
- Role-based access control

### Payment Processing

- Modular payment-provider architecture
- PayPal order creation and capture
- Payment status management and order synchronization
- PayPal webhook verification
- Webhook replay protection
- Payment creation idempotency
- Payment capture recovery
- Cancellation and failure handling
- Refund processing
- Inventory and cart finalization following successful payment

The payment architecture separates shared business logic from provider-specific integrations, allowing additional gateways to be implemented in the future.

**Currently implemented:** PayPal Sandbox.

**Not implemented:** PayHere and Stripe.

## Technology Stack

Layer - Technologies

Frontend - Next.js 16, React 19, TypeScript, Tailwind CSS 4
Backend - Node.js, Express 5, TypeScript, Zod
Database - PostgreSQL, Prisma 7
Authentication - JWT access and refresh tokens, HTTP-only cookies
Payments - PayPal Sandbox, PayPal JavaScript SDK
Image Storage - Supabase Storage
Frontend Hosting - Vercel
Backend Hosting - Render
Architecture - npm workspaces monorepo

## System Architecture

ClothingMart uses a monorepo containing two independently deployable applications.

Customer / Administrator
          |
          v
  Next.js Frontend
     (Vercel)
          |
          v
   Express REST API
       (Render)
          |
          +---- PostgreSQL / Prisma
          |
          +---- Supabase Storage
          |
          +---- PayPal Sandbox API
          |
          +---- Exchange-Rate Service


The frontend communicates with the Express REST API for authentication, catalogue management, cart operations, checkout, orders, and administrative features.

The backend manages business logic, database operations, payment verification, and external service integrations.

## Authentication and Security

ClothingMart implements cookie-based JWT authentication with separate access and refresh tokens.

Security-related features include:

- HTTP-only authentication cookies
- Access and refresh token separation
- Refresh-token rotation
- Role-based authorization for administrative operations
- Backend validation using Zod
- Server-side payment verification
- Webhook verification and replay protection
- Payment idempotency safeguards
- Environment-based credential management

Automatic restoration of expired sessions across all navigation scenarios remains a planned improvement.

## Payment Architecture

The payment module separates common payment operations from provider-specific implementations.

The backend is responsible for creating PayPal orders, capturing and verifying payments, synchronizing payment and order states, handling webhook events, and processing refunds.

The system includes safeguards against duplicate payment creation, repeated webhook processing, and inconsistent payment states.

Storefront prices are maintained in LKR. PayPal transaction amounts are converted using the configured exchange-rate service.

**PayPal Sandbox is the only currently implemented payment provider.** Production payment activation requires additional configuration and verification.

## Project Structure

ClothingMart/
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── modules/
│   └── web/
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

- Node.js and npm compatible with the project dependencies
- PostgreSQL
- PayPal Developer Sandbox credentials
- Credentials for the configured exchange-rate service
- Supabase configuration if using cloud image storage

### 1. Clone the Repository

git clone https://github.com/zaidhrahmathullah/ClothingMart.git
cd ClothingMart


### 2. Install Dependencies

npm install


### 3. Configure Environment Variables

Use the environment templates where provided:

apps/api/.env.example → apps/api/.env
apps/web/.env.example → apps/web/.env.local


Configure the database connection, JWT secrets, payment credentials, storage configuration, and other required environment variables.

Never commit real credentials or local environment files.

### 4. Prepare the Database

Create the PostgreSQL database specified by `DATABASE_URL`.

From the project root:

npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts


### 5. Start the Backend

npm run dev:backend


Default API URL:

http://localhost:4000/api/v1

### 6. Start the Frontend

In a separate terminal:

npm run dev:frontend


Open:

http://localhost:3000

**Local configuration note:** The frontend includes an API rewrite configured for the deployed backend. Adjust the rewrite for local backend testing if necessary.

## Available Scripts

Run these commands from the repository root.

Command - Description
`npm run dev:frontend` - Start the Next.js development server
`npm run dev:backend` - Start the Express development server
`npm run build:frontend` - Build the frontend
`npm run build:backend` - Compile the backend
`npm run build` - Build both applications
`npm run start:frontend` - Start the production frontend
`npm run start:backend` - Start the compiled backend
`npm test --workspace apps/api` - Run backend payment regression tests
`npm run test:categories --workspace apps/api` - Run category tests

## Testing

The backend includes automated regression tests covering:

- PayPal configuration
- Webhook processing
- Payment and order synchronization
- Payment cancellation
- Capture recovery
- Payment creation idempotency
- Refund processing
- Order finalization
- PayPal provider behavior

Run backend tests:

npm test --workspace apps/api


Build both applications:

npm run build


PayPal Sandbox checkout, order processing, administrative operations, and refunds should also be verified through manual end-to-end testing.

## Deployment

ClothingMart is publicly deployed using:

- Vercel: Next.js frontend
- Render: Express backend
- Supabase: PostgreSQL database and product image storage

The live storefront is available at:

https://clothingmart.vercel.app

The deployed website is a portfolio demonstration. Payment transactions use PayPal Sandbox rather than live payment processing.

## Engineering Highlights

### Modular Payment Integration

Implemented a provider abstraction that keeps PayPal-specific operations separate from shared payment logic, supporting future payment gateway integrations.

### Payment Reliability

Designed payment state transitions, webhook replay protection, idempotency safeguards, and recovery mechanisms to reduce duplicate operations and inconsistent order states.

### Full-Stack Deployment

Deployed the frontend and backend independently, integrating hosted database services, image storage, and external payment APIs.

### Authentication and Authorization

Implemented JWT-based authentication, refresh-token rotation, protected API endpoints, and role-based administrative access.

## Project Status

Publicly Deployed — Portfolio Demonstration

The customer storefront, administrative features, and PayPal Sandbox payment workflow have been implemented.

The project remains open to improvements, including session restoration, additional payment providers, performance optimization, and further automated testing.

PayPal Live payments are not enabled.

---

Built as a full-stack software engineering portfolio project.