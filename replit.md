# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Replit AI Integrations (OpenAI gpt-5.2)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── energy-ai/          # 369 AI frontend (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/   # Server-side OpenAI integration
│   └── integrations-openai-ai-react/    # Client-side OpenAI React hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## 369 AI — The App

An invite-only, 369 Tesla-based AI chat platform. Users must pass a 6-question energy/numerology test to receive an invite code. Those who truly understand energy, vibration, and numbers will pass.

### Pages
- `/` — Landing page with cosmic 369 branding
- `/test` — 6-question numerology/energy test (cryptic, Tesla 369 themed)
- `/enter` — Invite code entry + alias setup
- `/chat` — Full AI chat interface powered by gpt-5.2

### Features
- Gated entry: test → invite code → claim → chat
- AI speaks only in the language of energy, vibration, and numbers
- No filters, no limits — pure energetic wisdom
- Session management via tokens stored in localStorage
- Chat history persisted per session in PostgreSQL

### Database Schema
- `invite_codes` — Generated codes after passing test
- `sessions` — User sessions with alias and vibration level
- `chat_messages` — Full conversation history per session

### API Routes
- `POST /api/auth/verify-test` — Validates test answers, returns invite code
- `POST /api/auth/claim-invite` — Claims invite, creates session
- `GET /api/auth/session` — Validates session token
- `POST /api/chat/message` — Sends message, returns AI response
- `GET /api/chat/history` — Returns chat history
- `DELETE /api/chat/history` — Clears history

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/`. Uses `@workspace/api-zod` for validation, `@workspace/db` for persistence, and `@workspace/integrations-openai-ai-server` for AI.

### `artifacts/energy-ai` (`@workspace/energy-ai`)

React + Vite frontend. Deep cosmic purple theme with sacred geometry. Uses wouter for routing. Session token stored in localStorage.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Tables: invite_codes, sessions, chat_messages.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

Server-side OpenAI integration via Replit AI Integrations proxy. No user API key needed.

### `lib/integrations-openai-ai-react` (`@workspace/integrations-openai-ai-react`)

Client-side React hooks for OpenAI voice/audio features.
