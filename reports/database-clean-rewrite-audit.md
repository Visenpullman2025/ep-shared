# Database Current Phase Audit

Status: current phase audit updated on 2026-05-07.

## Confirmed Direction

Current phase:

- MySQL is the business source of truth.
- Dcat Plus, users, merchants, orders, payments, wallets, reviews, square content, and operational back office data stay on MySQL.
- Current frontend flow support must be audited against MySQL migrations, Laravel routes, BFF routes, and `api/registry.md`.

Paused:

- PostgreSQL capability read-model work is paused.
- PostgreSQL-only migrations must not stay in the active MySQL migration path.
- If AI semantic search, distance search, or recommendation read models are restarted later, they need a new approved plan.

## Current MySQL Audit Evidence

Verified on 2026-05-07:

- `php artisan config:show database.default` resolves to `mysql`.
- `php artisan db:show` connects to database `ep` on MySQL 8.0.36 and reports 54 tables.
- `php artisan migrate:status` shows current customer/merchant/order migrations as `Ran`.
- Removed `2026_05_04_000000_enable_postgres_ai_geo_extensions` from active migrations because it blocked MySQL migration.
- Removed `2026_05_04_010000_create_local_demo_catalog` from active migrations because it is local demo data and should not run on current RDS.
- `2026_05_07_090000_add_location_fields_to_yipai_merchants` is `Ran` in batch 44.

## Current Tables That Support Frontend Flow

Current MySQL has the table families needed by the active customer and merchant flows:

- Standard service browsing and quote: `yipai_standard_services`, `yipai_requirement_templates`, `yipai_quote_previews`.
- Customer profile and address flow: `yipai_users`, `yipai_user_addresses`, `yipai_user_messages`, `yipai_wallets`, `yipai_wallet_transactions`.
- Order and payment flow: `yipai_orders`, `yipai_order_details`, `yipai_order_state_logs`, `yipai_payments`.
- Matching and merchant confirmation: `yipai_merchant_capabilities`, `yipai_merchant_candidates`, `yipai_merchant_quote_confirmations`.
- Fulfillment, after-sales, reviews, and credit: `yipai_fulfillment_events`, `yipai_after_sales_cases`, `yipai_reviews`, `yipai_merchant_credit_profiles`, `yipai_merchant_credit_events`.
- Merchant portal and Dcat: `yipai_merchants`, `yipai_merchant_accounts`, `yipai_merchant_tokens`, `admin_users`, `admin_roles`, `admin_permissions`, `admin_menu`, `admin_settings`.

## API Support Audit

Supported by current Laravel routes and current registry:

- Customer standard service flow: `GET /api/v1/standard-services`, `GET /api/v1/standard-services/{code}`, `GET /api/v1/standard-services/{code}/requirement-template`, `POST /api/v1/standard-services/{code}/quote-preview`.
- Customer account/address/order flow: `auth/register`, `auth/login`, `auth/me`, `me/profile`, `me/addresses`, `orders`, `orders/{orderNo}`, `payments/intent`, reviews, after-sales, cancel, hide-from-list, confirm-completion.
- Merchant flow: `merchant/auth/*`, `merchant/profile`, `merchant/capabilities*`, `merchant/availability`, `merchant/order-requests`, `merchant/order-requests/{candidateId}/quote-confirmation`, `merchant/orders*`, `merchant/credit-profile`, `merchant/reviews`, wallet routes.
- Upload policy: `GET /api/v1/uploads/oss-policy` and `GET /api/v1/merchant/uploads/oss-policy`.

R-030 BFF/API gaps resolved on 2026-05-07:

- `ep/src/app/api/merchants/featured/route.ts` now has upstream `GET /api/v1/merchants/featured`.
- `ep/src/app/api/me/verification/route.ts` now has upstream `GET/POST /api/v1/me/verification` backed by `yipai_user_verifications`.
- `ep/src/app/api/me/location/route.ts` now has upstream `GET/POST /api/v1/me/location` backed by default address and `yipai_users.location`.

## Current Phase Decision

The current database and implemented API routes can support the main active frontend flows:

- Browse standard services.
- Fill requirement template.
- Generate quote preview.
- Register/login.
- Manage profile and address book.
- Create order.
- Generate merchant candidates.
- Merchant submits quote confirmation.
- Customer confirms quote.
- Payment/platform custody.
- Merchant starts and finishes service.
- Customer confirms completion.
- Reviews, square publishing, wallet views, and basic after-sales.

The current phase is not blocked by PostgreSQL. R-030 BFF/API gaps are closed; remaining risk should be found through browser-level flow testing and real data quality checks.

## Next Action

Before implementing the `pgsql plan`, keep validating the current MySQL route set:

1. Test homepage featured merchants against real merchant data.
2. Test user location and address consistency through profile/order detours.
3. Test user verification only from pages that truly need it; remove unused frontend entry points after reference scan.
4. Keep `DB_CONNECTION=mysql` and do not run PostgreSQL-only migrations in the current phase.
