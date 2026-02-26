---
title: "API Platform Redesign"
description: "A ground-up redesign of a multi-tenant REST API platform, reducing latency by 40% and cutting infrastructure costs."
pubDate: "2023-09-01"
tags: ["Node.js", "PostgreSQL", "Redis", "AWS"]
github: "https://github.com/ndartayeta/api-platform"
demo: "https://api-platform-demo.example.com"
---

## Overview

The existing API platform had grown organically over four years, accumulating inconsistent patterns, slow queries, and mounting infrastructure costs. This project was a ground-up rebuild with a focus on performance, developer experience, and maintainability.

## Challenges

- **Latency**: p95 response times exceeded 800 ms on the most-used endpoints due to N+1 query patterns and lack of caching.
- **Consistency**: Dozens of endpoints with slightly different response shapes made client integration difficult.
- **Observability**: No structured logging or distributed tracing made debugging production issues painful.

## Solution

I introduced a layered architecture separating the transport, service, and data-access layers. Key changes:

- Replaced ad-hoc queries with a **typed query builder** backed by PostgreSQL, eliminating N+1 patterns.
- Added a **Redis caching layer** for expensive aggregate queries with short TTLs.
- Standardised response envelopes and introduced **OpenAPI docs** generated at build time.
- Integrated **OpenTelemetry** for distributed tracing across services.

## Outcome

- p95 latency dropped from 820 ms → **490 ms** (40% improvement).
- Infrastructure costs fell 25% due to reduced database load.
- Developer integration time (new client onboarding) cut from 3 days to half a day.
