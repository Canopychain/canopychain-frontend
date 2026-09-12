# Polygon hashing

[src/lib/polygon.ts](./src/lib/polygon.ts) hashes a project's boundary
geometry to a 32-byte digest, `hashPolygon()`, which the frontend sends to
two places for the same project:

- to `project-registry` (via
  [projectRegistryClient.ts](./src/lib/projectRegistryClient.ts)) as
  `polygon_hash`, an opaque on-chain commitment;
- to `canopychain-backend` (via [src/lib/api.ts](./src/lib/api.ts)'s
  `registerProjectDetails`) as a hex string (`bytesToHex()`), alongside the
  real GeoJSON.

The contract never verifies the hash against anything — it's a
commitment donors trust exists so the plot a project is scored against
can't be silently swapped after they fund it. The backend is what later
checks the GeoJSON it holds against that commitment.

## The scheme

The digest is `SHA-256(JSON.stringify(geometry))` — the geometry object
run through `JSON.stringify` with no canonicalization, then hashed.

**This is not a canonical GeoJSON hashing scheme.** `JSON.stringify` does
not normalize key order, whitespace, or number formatting, so two
GeoJSON documents that describe the same polygon can hash differently if
they were serialized differently. The scheme only produces a consistent
hash because of one invariant:

> `hashPolygon()` in [src/lib/polygon.ts](./src/lib/polygon.ts) is the
> **only** function, in this repo or any other, that is ever allowed to
> produce a `polygon_hash`.

As long as that holds, the same in-memory geometry object always
serializes and hashes the same way, on both the contract-write and
backend-write paths above, because both calls happen back-to-back from
the same object in [OperatorRegistrationForm](./src/components/operator/OperatorRegistrationForm.tsx).

## Why this matters across repositories

`canopychain-backend` and `canopychain-contracts` both trust hashes
produced this way without being able to verify the scheme themselves — the
invariant lives entirely in this repo, in one file. If a second code path
(a script, a migration, a reimplementation in another language) ever
computes a `polygon_hash` for the same geometry using a different
serialization, it will produce a different hash for logically identical
GeoJSON, and the backend's later verification against the on-chain
commitment will fail for reasons that have nothing to do with the polygon
actually changing.

Any future change that needs to hash a polygon — from a new form, a
migration script, or another repository — must call `hashPolygon()` here,
or reproduce its exact serialization, not just "hash the GeoJSON."
