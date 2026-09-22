# Error Handling Architecture & Codebase Consistency Design

## 1. Problem Statement & Motivation

An audit of the codebase against [docs/agent.md](file:///home/ubu/Documents/dev/web/gigo/docs/agent.md) and [docs/principle.md](file:///home/ubu/Documents/dev/web/gigo/docs/principle.md) revealed multiple critical inconsistencies:

1. **Payload & Error Envelope Inconsistency:**
   - Some API routes returned `{ success: true, ... }`, while others returned bare payloads (e.g. `{ projects: [] }`, `{ posts: [] }`).
   - Error responses varied between `{ error: string }`, `{ success: false, error: string }`, and default Hono validator structures.
   - Services mixed `{ error: string }` (`service.ts`) with `{ reason: string }` (`check-in.ts`).
2. **Ambiguous `try/catch` Boundaries:**
   - Unclear rules about where `try/catch` should be applied, leading to potential error swallowing or unhandled rejections.
3. **Banned Type Assertions (`as Type`):**
   - Violations of `docs/agent.md` Section 4.1 in Hono route handlers (`c.get("user") as { id: string }`), web client (`response.json() as Promise<T>`), and type guards (`(error as UniqueViolationError)`).
4. **Duplicated Schemas & Contracts:**
   - Web hooks redefined local TypeScript interfaces (`TicketsResponse`, `CollabResponse`, `FeedResponse`) rather than reusing shared Zod schemas from `@campus/contracts`.
5. **Comment Clutter:**
   - Redundant line comments (such as `// ponytail: ...`) and syntax translations violated `docs/principle.md` Section 2.

---

## 2. Universal Response & Error Contracts (`@campus/contracts`)

All client-server payloads will strictly originate from `@campus/contracts`.

### A. Universal Error Contract
```typescript
// packages/contracts/src/errors.ts
import { z } from "zod";

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

### B. Standardized Response Schemas
Every successful API endpoint returns a typed envelope with `success: true`:

- **Tickets:**
  - `UserTicketsResponseSchema`: `{ success: true, tickets: UserTicketDto[] }`
  - `ClaimTicketResponseSchema`: `{ success: true, ticket: UserTicketDto }`
  - `CheckInTicketResponseSchema`: `{ success: true, ticket: CheckInTicketResultDto }`
- **Collab:**
  - `CollabListResponseSchema`: `{ success: true, projects: CollabPostDto[] }`
  - `CreateCollabResponseSchema`: `{ success: true, collab: CollabPostDto }`
- **Feed:**
  - `FeedListResponseSchema`: `{ success: true, posts: FeedPostDto[] }`
  - `CreateFeedResponseSchema`: `{ success: true, post: FeedPostDto }`

---

## 3. Backend Error Architecture & `try/catch` Invariants (`apps/api`)

### A. The Core Invariant
**Anticipated domain failures must use Discriminated Result Unions; unexpected exceptions must bubble to the global error handler.**

### B. Where `try/catch` is Strictly Mandatory
`try/catch` is restricted exclusively to low-level boundary I/O:

1. **Database Constraint Violations:**
   In `claimTicketAtomic` (`apps/api/src/modules/tickets/service.ts`), a database transaction is wrapped in `try ... catch (error: unknown)` to intercept PostgreSQL unique constraint violation `23505`.
   - Must use a pure type guard `isUniqueViolation(error)` with **zero type assertions**.
   - If `23505`, returns `{ success: false, error: "ALREADY_CLAIMED", status: 409 }`.
   - **Mandatory Re-throw:** Any other database or runtime error is re-thrown (`throw error`) to be caught by the global handler.
2. **Cryptographic Token Verification:**
   In `verifyTicket` (`packages/crypto/src/tickets.ts`), invalid signatures, base64 errors, or malformed JSON are caught and return `{ valid: false }`.
3. **WebSocket Message Parsing:**
   In `websocketHandlers.message` (`apps/api/src/ws/handlers.ts`), invalid JSON frames are caught and safely ignored.

### C. Where `try/catch` is Strictly Forbidden
1. **HTTP Route Handlers:**
   Route handlers must not wrap code in `try/catch`. They await service functions and execute early returns based on `result.success`:
   ```typescript
   const result = await claimTicketAtomic(eventId, user.id);
   if (!result.success) {
     return c.json({ success: false, error: result.error }, result.status);
   }
   return c.json({ success: true, ticket: result.ticket }, 201);
   ```
2. **Middleware:**
   Auth and RBAC middlewares do not use `try/catch`. They return early on failure with status 401 or 403:
   ```typescript
   return c.json({ success: false, error: "UNAUTHORIZED" }, 401);
   ```

### D. Global Error Handler (`apps/api/src/middleware/error.ts`)
Configured on `app.onError(errorHandler)`:
- Intercepts all unhandled exceptions.
- In production (`NODE_ENV === "production"`): sanitizes error message to `"INTERNAL_SERVER_ERROR"` with status 500.
- In development/test: returns the real error message with status 500.
- Logs structured error diagnostics to server logs.

### E. Validation Error Handler
A reusable `@hono/zod-validator` hook maps schema validation failures to:
```json
{
  "success": false,
  "error": "VALIDATION_FAILED",
  "details": { ... }
}
```
with status 400.

### F. Service Consistency Alignment
- In `check-in.ts`, replace `reason` with `error` (`{ success: false, error: "..." }`).
- Strongly type Hono `ContextVariableMap` with `user: AuthSessionUser` to eliminate `c.get("user") as { id: string }` type assertions.

---

## 4. Frontend Ingestion Architecture (`apps/web`)

### A. Zero-Assertion API Client (`apps/web/src/lib/api-client.ts`)
Replace `return response.json() as Promise<T>` with runtime Zod schema parsing:

```typescript
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  schema: z.ZodType<T>,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const parsed = ApiErrorResponseSchema.safeParse(errorJson);
    const message = parsed.success ? parsed.data.error : `HTTP_${response.status}`;
    throw new ApiError(response.status, message, parsed.success ? parsed.data.details : undefined);
  }

  const json = await response.json();
  return schema.parse(json);
}
```

### B. React Hooks Alignment (`apps/web/src/hooks/`)
- Delete local response interfaces in `useTickets.ts`, `useCollab.ts`, and `useFeed.ts`.
- Pass Zod schemas from `@campus/contracts` directly to `apiRequest`.
- Standardize `try / catch / finally` state updates across all query and mutation hooks.

---

## 5. Code Quality & Zero-Clutter Comments (`docs/principle.md`)

- Remove all `// ponytail: ...` comments.
- Remove redundant syntax translations.
- Retain only architectural rationale (e.g. Zero-Trust physical isolation invariants).

---

## 6. Verification Pipeline

1. **Type Safety:** `pnpm turbo run typecheck` passes with zero type errors and zero `as Type` assertions.
2. **Automated Testing:** `pnpm turbo run test` passes across `@campus/api`, `@campus/contracts`, and `@campus/crypto`.
3. **Database Integrity:** `pnpm --filter @campus/db db:check` confirms schema consistency.
4. **Code Quality:** `pnpm dlx @biomejs/biome check .` passes cleanly.
