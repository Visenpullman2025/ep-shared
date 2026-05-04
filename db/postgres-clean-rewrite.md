# PostgreSQL Clean Rewrite Plan

Status: confirmed direction for the independent development/design phase.

## Decision

ExpatTH backend database target is PostgreSQL with these extensions:

- PostGIS for distance and service-area search.
- pgvector for AI embedding search and semantic matching.
- pg_trgm for fuzzy text search and fallback matching.

MySQL is legacy context only. New migrations, table names, and query patterns should target PostgreSQL. Do not add compatibility layers for MySQL unless the user explicitly asks for a migration bridge.

## Why

The product needs:

- nearby merchant matching
- service radius filtering
- AI semantic search
- smart recommendation and push candidates
- clean state and contract consistency across user, merchant, and backend apps

PostgreSQL keeps transactional data, JSONB, geography, and vector search in one database during the current stage. Redis remains useful for queue, cache, rate limiting, and push throttling, but not as the source of truth.

## Clean Rewrite Rules

- Prefer new clean tables over patching legacy service-centric tables.
- Delete legacy tables and migrations once replacement tables exist and references are removed.
- Do not keep both old and new customer entry flows. The customer entry is StandardService, not serviceId.
- Do not store lat/lng as loose decimals for matching logic. Use geography(Point, 4326).
- Do not store AI embeddings in random feature tables. Use a dedicated embedding table with owner type/id and model metadata.

## Core Extensions

Required backend migration:

- postgis
- vector
- pg_trgm

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
