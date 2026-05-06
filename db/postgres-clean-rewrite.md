# PostgreSQL / MySQL Split Plan

Last updated: 2026-05-07

Status: paused. Current phase stays MySQL-only for business facts and migrations.

Scope: database direction only; concrete migrations live in `epbkend/expatth-backend/database/migrations`.

## Current Phase

The current phase is MySQL-only for business facts. Do not implement the PostgreSQL task tree during current frontend-flow validation.

Current phase work:

- Verify MySQL tables and Laravel routes support the active customer and merchant frontends.
- Resolve BFF/API gaps before adding new database capability work.
- Keep Dcat Plus and all transaction facts on MySQL.
- Do not keep PostgreSQL-only migrations in the active MySQL migration path.

## Next Phase: `pgsql plan`

The following task tree is paused and must be re-approved before implementation:

- Add PostgreSQL capability tables for merchant geo profiles, recommendation features, search embeddings, and sync runs.
- Add sync jobs from MySQL facts to PostgreSQL read models.
- Schedule sync every 6 hours.
- Add Dcat manual sync action.
- Add AI semantic search embeddings with pgvector.
- Add PostGIS distance and service-area query support.
- Add pg_trgm multilingual fuzzy search support.

## Decision

ExpatTH backend currently has two database responsibilities:

- **Current business source of truth**: keep MySQL for users, merchants, orders, payments, wallets, reviews, Dcat Plus, and operational back office data.
- **Future AI/geo/search capability read models**: use PostgreSQL on Alibaba Cloud RDS first when distance search, recommendation ranking, semantic search, and multilingual fuzzy search need dedicated computation tables.

The backend must not switch the default `DB_CONNECTION` from MySQL to PostgreSQL unless there is an explicit Dcat admin replacement or full transaction database migration plan. The next PostgreSQL step is not a transaction-source migration; it is a computed read-model slice fed from MySQL.

The PostgreSQL target capability set is:

- PostGIS for distance and service-area search.
- pgvector for AI embedding search and semantic matching.
- pg_trgm for fuzzy text search and fallback matching.

MySQL is not legacy-only in the current backend because Dcat Plus admin reads `config('admin.database.connection') ?: config('database.default')`, and the current backend default connection is MySQL.

## Why

The product needs:

- nearby merchant matching
- service radius filtering
- AI semantic search
- smart recommendation and push candidates
- clean state and contract consistency across user, merchant, and backend apps

PostgreSQL is still the better fit for distance search, AI semantic search, and future recommendation data. However, the current backend already has a Dcat Plus admin system and MySQL schema snapshot for admin and transaction tables. Replacing the default connection now would add transaction and back-office risk before the product flow is stable.

Redis remains useful for queue, cache, rate limiting, and push throttling, but not as the source of truth.

## Clean Rewrite Rules

- Prefer new clean tables over patching legacy service-centric tables.
- Delete legacy tables and migrations once replacement tables exist and references are removed.
- Do not keep both old and new customer entry flows. The customer entry is StandardService, not serviceId.
- Do not store lat/lng as loose decimals for matching logic. Use geography(Point, 4326).
- Do not store AI embeddings in random feature tables. Use a dedicated embedding table with owner type/id and model metadata.
- Do not run PostgreSQL-only migrations against the current MySQL default connection.
- Do not move Dcat Plus admin tables away from MySQL without a named replacement plan.

## Core Extensions

Required PostgreSQL capability migration, only for a PostgreSQL connection:

- postgis
- vector
- pg_trgm

If the active connection is MySQL, this migration must be skipped or isolated to a PostgreSQL-specific connection.

## Current MySQL-Bound Admin Area

Evidence in the backend:

- `composer.json` requires `dcat-plus/laravel-admin`.
- `config/admin.php` leaves `admin.database.connection` empty, so Dcat uses Laravel's default database connection.
- Current backend config resolves `database.default` to `mysql`.
- Dcat admin tables are present in the MySQL schema snapshot: `admin_users`, `admin_roles`, `admin_permissions`, `admin_menu`, `admin_settings`, `admin_extensions`, and related pivot/history tables.

Implication: Dcat admin is a current MySQL-bound subsystem, not a disposable legacy table group.

## Capability Read Model Workflow

Decision date: 2026-05-06.

Confirmed direction:

- Keep `DB_CONNECTION=mysql` for Laravel default and Dcat's own admin tables.
- Keep `ADMIN_DB_CONNECTION=mysql` for explicit Dcat table ownership.
- Keep transaction writes in MySQL until a separate full migration is intentionally planned.
- Use PostgreSQL read models only for distance search, recommendation ranking, AI semantic search, and multilingual fuzzy search.
- Prefer Alibaba Cloud RDS for PostgreSQL when this capability database is introduced.
- Sync MySQL facts into PostgreSQL every 6 hours by default.
- Provide a Dcat manual sync action for operators to trigger the same sync job on demand.

The backend currently has a read-only admin bridge:

- Use `TRADE_READ_CONNECTION` for Dcat trade center pages and future capability/read-model screens.
- Supported connection templates are `mysql_trade` and `pgsql_trade`.
- Dcat trade order, payment, and order-state-log pages use backend AdminRead models and must remain read-only.

This lets operators view or trigger read-model workflows without moving Dcat's users, roles, menus, settings, or extension tables away from MySQL.

## Sync Sources

PostgreSQL read models should be derived from MySQL facts:

- merchant location and service-area data
- merchant capabilities and ready status
- standard service and requirement template text
- order requirement payload summaries
- quote preview and merchant quote confirmation summaries
- rating, completion, late/no-show, and response-speed metrics
- user behavior and interest events when product tracking is introduced
- public review, merchant profile, and service text used for embeddings

Core money, order state, wallet balance, and settlement facts remain in MySQL until a separate transaction-source migration is approved.

## New Table Direction

### merchant_locations

Purpose: geospatial source of truth for merchant/service locations.

Important fields:

- merchant_id
- address_id nullable
- location geography(Point, 4326)
- service_radius_meters
- service_area jsonb nullable
- status

### search_embeddings

Purpose: shared semantic index for services, templates, merchants, help content, and future recommendation content.

Important fields:

- owner_type
- owner_id
- locale
- content_kind
- content_hash
- embedding vector
- model
- metadata jsonb

### user_interest_events

Purpose: behavioral facts for smart push and recommendation.

Important fields:

- user_id nullable
- anonymous_id nullable
- standard_service_code nullable
- event_type
- location geography(Point, 4326) nullable
- payload jsonb
- created_at

### push_candidates

Purpose: generated recommendation/push candidates before delivery.

Important fields:

- user_id nullable
- merchant_id nullable
- standard_service_code
- score
- reason jsonb
- status
- expires_at

## Legacy Cleanup Targets

Initial scan shows these areas need rewrite review:

- old service routes: services/{id}/create-data, services/{id}/summary, services/{id}/price-preview
- old service process template model/controller/admin screens
- yipai_services as customer-facing entry
- decimal lat/lng fields used for matching
- PHP-level distance calculation in OrderFlowService
- workflow_status strings not yet unified with target workflowStatus

Do not delete them blindly. First build the clean replacement path, scan references, then remove obsolete paths.
