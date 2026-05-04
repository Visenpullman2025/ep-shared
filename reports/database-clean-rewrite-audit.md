# Database Clean Rewrite Audit

Status: initial scan.

## Confirmed Direction

Use PostgreSQL + PostGIS + pgvector + pg_trgm for the new backend database. MySQL schema is legacy context only.

## Current Backend Findings

From active backend worktree epbkend/expatth-backend:

- Existing migrations already include early new-chain tables: yipai_standard_services, yipai_requirement_templates, yipai_quote_previews.
- Existing routes still expose old customer service-id endpoints.
- Existing code still has admin and model dependencies around YipaiServiceProcessTemplate.
- Merchant/user location currently appears as decimal lat/lng in models and migrations.
- OrderFlowService contains PHP-level distance calculation, which should move to PostGIS query logic.
- Legacy MySQL snapshot exists at database/schema/mysql-schema.sql.

## Immediate Backend Work

1. Enable PostgreSQL extensions through migration.
2. Create clean geospatial and AI support tables.
3. Replace decimal lat/lng matching with PostGIS geography.
4. Replace old service-id customer routes with StandardService flow.
5. Remove legacy service/process-template paths after replacement references are in place.

## Deletion Policy

Delete old migrations/code once the replacement path exists and reference scan shows the old path is no longer used by the clean product flow.
