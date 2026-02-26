---
title: "Internal Design System"
description: "A shared component library and token system adopted across 6 product teams, built with React and vanilla CSS custom properties."
pubDate: "2024-01-15"
tags: ["React", "TypeScript", "CSS", "Storybook"]
github: "https://github.com/ndartayeta/design-system"
---

## Overview

Six product teams were building their own buttons, modals, and form elements — each slightly different. Inconsistent UX, duplicated code, and slow design reviews were the result. This project created a single source of truth.

## Approach

Rather than adopting an existing library wholesale, I built a **lean token-first system**:

1. **Design tokens** defined in JSON, compiled to CSS custom properties and TypeScript constants via Style Dictionary.
2. **Primitive components** (Button, Input, Badge, Stack, etc.) built with zero runtime dependencies.
3. **Storybook** documentation with interactive controls, accessibility audits, and visual regression snapshots.
4. **Automated publishing** via a GitHub Actions pipeline on every merge to main.

## Adoption

I ran a series of workshops with each team, pair-programming the migration of their highest-traffic pages. Within 3 months all 6 teams had migrated their primary flows.

## Outcome

- 35% reduction in design-review cycles — designers could reference Storybook instead of reviewing every PR.
- 4,000+ lines of duplicated component code deleted across the monorepo.
- Lighthouse accessibility scores improved from an average of 72 → **91**.
