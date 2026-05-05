# PostgreSQL / MySQL Split Plan

Last updated: 2026-05-06

Status: revised direction for the independent development/design phase.

Scope: database direction only; concrete migrations live in `epbkend/expatth-backend/database/migrations`.

## Decision

ExpatTH backend currently has two database responsibilities:

- **Current admin and Laravel default connection**: keep MySQL while the Dcat Plus admin system remains in use.
- **Future AI/geo/search capability**: use PostgreSQL with PostGIS, pgvector, and pg_trgm when those capabilities are introduced as a deliberate connection or migration slice.

The backend must not switch the default `DB_CONNECTION` from MySQL to PostgreSQL unless there is an explicit Dcat admin replacement or migration plan.

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

PostgreSQL is still the better fit for distance search, AI semantic search, and future recommendation data. However, the current backend already has a Dcat Plus admin system and MySQL schema snapshot for admin tables. Replacing the default connection would risk breaking admin users, roles, menus, settings, extensions, and existing operational data.

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
