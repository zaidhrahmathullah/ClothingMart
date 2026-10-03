# Adding a Payment Provider to ClothingMart

ClothingMart separates shared payment orchestration from provider-specific integrations.

PayPal is the currently implemented provider. Additional gateways can be introduced using the shared payment contract and provider registry.

This document describes the intended extension process.

## 1. Architecture

The main payment module is located at:

apps/api/src/modules/payments/

Important shared files include:

File - Responsibility

`payment.provider.ts` - Shared provider contract
`payment.types.ts` - Shared payment types and provider identifiers
`payment.service.ts` - Shared payment utilities and state-transition validation
`payment.state.ts` - Payment lifecycle rules
`payment-refund.service.ts` - Shared refund orchestration
`payment-webhook-event.service.ts` - Webhook event replay checks
`providers/provider.registry.ts` - Provider registration and lookup

Provider-specific implementations belong under `providers/`.

## 2. Create a Provider Directory

For example, a future PayHere integration could use:

providers/
├── provider.registry.ts
├── paypal/
│   └── ...existing implementation
└── payhere/
    ├── payhere.config.ts
    ├── payhere.client.ts
    ├── payhere.provider.ts
    ├── payhere.types.ts
    ├── payhere.controller.ts
    ├── payhere-payment.service.ts
    └── payhere-webhook.service.ts


Only create files actually required by the new provider.

## 3. Implement the Shared Contract

Implement the `PaymentProvider` interface defined in `payment.provider.ts`.

Review the provider's support for:

- Payment creation
- Payment capture
- Payment verification
- Payment cancellation
- Refund processing

Do not assume that all gateways implement these operations identically.

Handle unsupported operations explicitly.

## 4. Register the Provider

Update the supported provider identifiers and the provider registry.

Check whether the Prisma `PaymentProvider` enum requires a migration.

Register the implementation in:

providers/provider.registry.ts

A provider must not become selectable before its implementation and configuration are ready.

## 5. Implement Provider-Specific Checkout

Create the appropriate frontend checkout component.

When multiple gateways are available, introduce a payment-method selector while reusing the existing cart, shipping address and order-management functionality.

Do not expose provider secrets in frontend code.

## 6. Implement Callbacks and Webhooks

Each gateway may have a different authentication, signature-verification and notification mechanism.

Verify incoming notifications using the provider's documented process.

Normalize provider-specific events before applying shared payment and order-state transitions.

Preserve replay protection and idempotency safeguards.

## 7. Preserve Order Integrity

A successful frontend redirect or popup closure is not sufficient proof of payment.

The backend must establish the authoritative transaction result before marking a payment completed and finalizing the associated order.

External provider calls must be coordinated carefully with durable database records and recovery mechanisms.

## 8. Test Before Activation

Add automated tests covering:

- Successful payment creation and completion
- Rejected or cancelled payments
- Provider errors and network interruptions
- Duplicate creation/capture requests
- Webhook authenticity and replay
- Order synchronization
- Refund handling
- Currency and amount consistency

Complete the gateway's Sandbox or test-environment verification before considering production activation.

## Current Provider Status

Provider - Status

PayPal - Implemented using Sandbox
PayHere - Reserved for future integration
Stripe - Potential future integration; not implemented

Additional provider support requires implementation and testing, not merely adding credentials.
