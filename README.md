
# ClothingMart

### Full-Stack E-Commerce Platform

A full-stack e-commerce application built with **Next.js, React, Express, TypeScript, PostgreSQL, and Prisma**, featuring a responsive customer storefront, administrative management system, and PayPal Sandbox payment integration.

ClothingMart demonstrates practical software engineering skills across frontend development, REST API design, database modeling, authentication, payment processing, and cloud deployment.

**[Live Demo](https://clothingmart.vercel.app/)** · **[Source Code](https://github.com/zaidhrahmathullah/ClothingMart)** · **[Developer Portfolio](https://zaidhrahmathullah.dev/)**

> **Payment Notice**
>
> ClothingMart uses PayPal Sandbox for demonstration and testing. Real-money payments are not enabled.

---

## Contents

- [Application Preview](#application-preview)
- [Engineering Highlights](#engineering-highlights)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Authentication and Security](#authentication-and-security)
- [Payment Architecture](#payment-architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Status](#project-status)

---

## Application Preview

ClothingMart provides a complete shopping experience, from product discovery and account management to checkout and order processing.


### Customer Storefront

<img width="1365" height="597" alt="cover" src="https://github.com/user-attachments/assets/7a1bcc41-5635-49e5-88ec-dd696722d248" />


### Product Browsing

<img width="1365" height="597" alt="products" src="https://github.com/user-attachments/assets/8f1ac822-3c46-4be4-924d-e99baff89249" />


### Checkout and Payments

<img width="1365" height="601" alt="checkout" src="https://github.com/user-attachments/assets/44520433-e37e-4c06-a277-f8c9cad1376b" />


### Administration

<img width="1365" height="599" alt="admin" src="https://github.com/user-attachments/assets/bc4516ea-3291-4931-90f5-c4a8e5d2c4c1" />


**Explore the application:** [clothingmart.vercel.app](https://clothingmart.vercel.app/)

---

## Engineering Highlights

ClothingMart was developed to explore the engineering challenges involved in building and deploying a full-stack commerce application.

### 1. Modular Payment Architecture

Designed a payment-provider abstraction that separates shared payment business logic from provider-specific implementations.

PayPal Sandbox is currently integrated, while the architecture supports adding other gateways without restructuring the core payment workflow.

### 2. Reliable Payment Processing

Implemented payment state transitions and safeguards to handle real-world payment scenarios, including:

- Duplicate payment creation
- Repeated webhook deliveries
- Payment capture recovery
- Cancellation and failure handling
- Payment and order synchronization
- Inventory and cart finalization
- Refund processing

### 3. Authentication and Authorization

Built a JWT-based authentication system with access and refresh tokens, HTTP-only cookies, refresh-token rotation, protected API endpoints, and role-based administrative access.

### 4. Independent Full-Stack Deployment

Deployed the Next.js frontend and Express backend independently, integrating hosted PostgreSQL, cloud image storage, and external payment services.

---

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
- Payment status management
- Payment and order synchronization
- PayPal webhook verification
- Webhook replay protection
- Payment creation idempotency
- Payment capture recovery
- Cancellation and failure handling
- Refund processing
- Inventory and cart finalization following successful payment

**Implemented payment provider:** PayPal Sandbox

**Not implemented:** PayHere and Stripe

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | PostgreSQL, Prisma 7 |
| Authentication | JWT access and refresh tokens, HTTP-only cookies |
| Payments | PayPal Sandbox, PayPal JavaScript SDK |
| Image Storage | Supabase Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Supabase |
| Architecture | npm workspaces monorepo |

---

## System Architecture

ClothingMart follows a full-stack monorepo architecture containing two independently deployable applications.

```text
                Customer / Administrator
                           |
                           v
                 +--------------------+
                 |  Next.js Frontend  |
                 |       Vercel       |
                 +--------------------+
                           |
                           | REST API
                           v
                 +--------------------+
                 |   Express Backend  |
                 |       Render       |
                 +--------------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
       PostgreSQL      Supabase       External
        + Prisma       Storage        Services
                                         |
                                  +------+------+
                                  |             |
                                  v             v
                               PayPal       Exchange
                               Sandbox      Rate API
```

### Frontend Responsibilities

The Next.js application provides:

- Responsive customer-facing interfaces
- Product browsing and search-related interactions
- Shopping cart and wishlist interfaces
- Authentication and account management interfaces
- Checkout and payment interactions
- Administrative management interfaces

### Backend Responsibilities

The Express REST API manages:

- Authentication and authorization
- Product and category operations
- Shopping cart and wishlist operations
- Address and order management
- Inventory-related business logic
- Payment creation, capture, and verification
- Webhook handling
- Refund processing
- Database access through Prisma

This separation keeps application interfaces independent from backend business logic and external integrations.

---

## Authentication and Security

ClothingMart implements cookie-based JWT authentication with separate access and refresh tokens.

Security-related features include:

- HTTP-only authentication cookies
- Access and refresh token separation
- Refresh-token rotation
- Role-based authorization for administrative operations
- Backend request validation using Zod
- Server-side payment verification
- PayPal webhook verification
- Webhook replay protection
- Payment idempotency safeguards
- Environment-based credential management

**Planned improvement:** Automatic restoration of expired sessions across all navigation scenarios.

---

## Payment Architecture

The payment system separates common business operations from payment-provider implementations.

### Payment Flow

```text
Customer Checkout
       |
       v
Create Application Order
       |
       v
Create Payment Record
       |
       v
PayPal Sandbox Order
       |
       v
Customer Approval
       |
       v
Backend Capture and Verification
       |
       v
Payment / Order Synchronization
       |
       v
Inventory and Cart Finalization
       |
       v
Order Confirmation
```

The backend is responsible for creating PayPal orders, capturing and verifying payments, synchronizing payment and order states, handling webhook events, and processing refunds.

### Reliability Safeguards

**Payment State Management**

Payment state transitions are validated to prevent inconsistent payment updates.

**Idempotency**

Payment creation includes safeguards against duplicate requests and repeated processing.

**Webhook Protection**

PayPal webhook events are verified, and replay protection helps prevent duplicate event handling.

**Capture Recovery**

Recovery logic supports situations where a payment capture succeeds but the application does not immediately receive or complete the expected response.

**Order Finalization**

Payment success is coordinated with order state changes, inventory updates, and cart finalization.

### Currency Handling

Storefront prices are maintained in **Sri Lankan Rupees (LKR)**.

PayPal transaction amounts are converted using the configured exchange-rate service.

### Supported Providers

| Provider | Status |
|---|---|
| PayPal Sandbox | Implemented |
| PayPal Live | Not enabled |
| PayHere | Not implemented |
| Stripe | Not implemented |

Production payment activation requires additional configuration and verification.

---

## Project Structure

```text
ClothingMart/
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── modules/
│   │
│   └── web/
│       └── src/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── prisma7.config.ts
├── package.json
└── README.md
```

The monorepo uses npm workspaces to manage the frontend and backend applications.

---

## Local Development

### Prerequisites

Ensure the following are available:

- Node.js and npm compatible with the project dependencies
- PostgreSQL
- PayPal Developer Sandbox credentials
- Credentials for the configured exchange-rate service
- Supabase configuration if using cloud image storage

### 1. Clone the Repository

```bash
git clone https://github.com/zaidhrahmathullah/ClothingMart.git
cd ClothingMart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Use the environment templates where provided.

**Backend:**

```text
apps/api/.env.example
       |
       v
apps/api/.env
```

**Frontend:**

```text
apps/web/.env.example
       |
       v
apps/web/.env.local
```

Configure the required environment variables for:

- PostgreSQL database connection
- JWT secrets
- PayPal Sandbox credentials
- Exchange-rate service
- Supabase Storage
- Frontend and backend URLs
- Other configured integrations

> Never commit actual credentials, access tokens, or local environment files.

### 4. Prepare the Database

Create the PostgreSQL database specified by `DATABASE_URL`.

From the project root, generate the Prisma client:

```bash
npx prisma generate --config prisma7.config.ts
```

Apply the existing migrations:

```bash
npx prisma migrate deploy --config prisma7.config.ts
```

### 5. Start the Backend

```bash
npm run dev:backend
```

Default API URL:

```text
http://localhost:4000/api/v1
```

### 6. Start the Frontend

Open another terminal and run:

```bash
npm run dev:frontend
```

Open:

```text
http://localhost:3000
```

### Local API Configuration

The frontend currently includes an API rewrite configured for the deployed backend.

For local backend testing, adjust the rewrite to target the local API where necessary.

This configuration is a known area for future improvement.

---

## Available Scripts

Run these commands from the repository root unless otherwise indicated.

| Command | Description |
|---|---|
| `npm run dev:frontend` | Start the Next.js development server |
| `npm run dev:backend` | Start the Express development server |
| `npm run build:frontend` | Build the frontend |
| `npm run build:backend` | Compile the backend |
| `npm run build` | Build both applications |
| `npm run start:frontend` | Start the production frontend |
| `npm run start:backend` | Start the compiled backend |
| `npm test --workspace apps/api` | Run backend payment regression tests |
| `npm run test:categories --workspace apps/api` | Run category tests |

---

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

### Run Backend Tests

```bash
npm test --workspace apps/api
```

### Run Category Tests

```bash
npm run test:categories --workspace apps/api
```

### Build Both Applications

```bash
npm run build
```

### Manual Testing

The following workflows should also be verified through manual end-to-end testing:

- Customer registration and login
- Product browsing and cart management
- PayPal Sandbox checkout
- Order processing and status updates
- Administrative product and inventory operations
- Refund workflows
- Payment cancellation and failure scenarios

---

## Deployment

ClothingMart is publicly deployed using independently hosted frontend and backend applications.

| Service | Responsibility |
|---|---|
| Vercel | Next.js frontend |
| Render | Express REST API |
| Supabase | PostgreSQL database |
| Supabase Storage | Product image storage |
| PayPal Sandbox | Payment demonstration and testing |

**Live Storefront:** https://clothingmart.vercel.app/

The deployed application is intended for portfolio demonstration and technical evaluation.

All payment transactions use PayPal Sandbox rather than live payment processing.

---

## Project Status

**Publicly Deployed — Portfolio Demonstration**

The customer storefront, administrative features, and PayPal Sandbox payment workflow have been implemented.

### Future Improvements

- More comprehensive session restoration
- Additional payment gateway integrations
- Performance optimization
- Expanded automated testing
- Further improvements to local development configuration

PayPal Live payments are not enabled.

---

## Developer

**Zaidh Rahmathullah**

Aspiring Full-Stack Software Engineer based in Sri Lanka.

- **Portfolio:** [zaidhrahmathullah.dev](https://zaidhrahmathullah.dev/)
- **GitHub:** [github.com/zaidhrahmathullah](https://github.com/zaidhrahmathullah)
- **LinkedIn:** [Zaidh Rahmathullah](https://www.linkedin.com/in/zaidh-rahmathullah-629048316/)
- **Email:** [rahmathullah07zaidh@gmail.com](mailto:rahmathullah07zaidh@gmail.com)

---

Built as a full-stack software engineering portfolio project.
