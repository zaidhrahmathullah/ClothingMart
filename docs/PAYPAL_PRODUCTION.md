# PayPal Production Activation Guide

ClothingMart currently uses PayPal Sandbox for development and payment testing.

The backend includes a guarded Live configuration, but live payment processing requires separate credentials, deployment configuration, merchant eligibility verification and end-to-end testing.

## 1. Prerequisites

Before enabling production payments:

- Verify that the PayPal Business account can receive the intended payments in its registered country.
- Complete any required PayPal account verification.
- Create a Live REST application in the PayPal Developer Dashboard.
- Obtain the Live Client ID and Client Secret.
- Deploy the frontend and backend with HTTPS.
- Configure the production database and secure environment variables.

## 2. Production Environment

Configure the backend's production environment:

NODE_ENV=production

PAYPAL_ENVIRONMENT=live
PAYPAL_LIVE_ENABLED=true

PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_LIVE_CLIENT_SECRET
PAYPAL_WEBHOOK_ID=YOUR_LIVE_WEBHOOK_ID

Keep all credentials in the deployment platform's secret-management system.

Never commit actual credentials to GitHub.

The Live environment must use PayPal's production API rather than its Sandbox API.

## 3. Frontend Configuration

The frontend obtains its public PayPal configuration from:

GET /api/v1/payments/config/paypal

Do not hardcode the Live Client ID in the checkout component.

The PayPal Client Secret must remain exclusively on the backend.

## 4. Production Webhook

Create a separate Live webhook in the PayPal Developer Dashboard.

Configure its URL to point to the deployed ClothingMart backend's PayPal webhook endpoint.

Use the resulting Live Webhook ID in the production environment.

Verify webhook signatures and preserve webhook replay protection.

Sandbox and Live webhook identifiers are not interchangeable.

## 5. Production Verification

Before accepting customer payments, verify:

- PayPal SDK initialization
- Currency conversion and transaction totals
- Payment creation and approval
- Server-side capture and verification
- Order/payment status synchronization
- Inventory and cart finalization
- Customer cancellation
- Interrupted checkout and capture recovery
- Duplicate requests and webhook replay handling
- Full and partial refunds
- Admin payment visibility

Perform controlled real-money tests using an appropriately configured merchant account.

## 6. Security Notes

Never enable Live processing merely by copying Sandbox credentials into a production deployment.

The `PAYPAL_LIVE_ENABLED` safeguard must be explicitly configured, and the complete deployment must be tested.

Destructive database seeding must remain disabled in production.

## Current Project Status

PayPal Sandbox is implemented and tested. Live activation is a separate deployment milestone and is not claimed as completed.
