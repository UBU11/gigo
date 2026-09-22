# Error Handling Architecture & Codebase Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize error handling and response envelopes across `@campus/contracts`, `apps/api`, and `apps/web`, establish boundary-only `try/catch` invariants, eliminate all banned `as Type` assertions, and strip comment clutter per `docs/agent.md` and `docs/principle.md`.

**Architecture:** Services use Discriminated Result Unions (`{ success: true, ... } | { success: false, error, status }`); `try/catch` is isolated exclusively to boundary I/O (Postgres constraints, Web Crypto, JSON parsing); route handlers contain zero `try/catch` blocks; unexpected errors bubble to global `onError`; the web client validates all incoming payloads with Zod schemas.

**Tech Stack:** Bun, Hono, Zod, Drizzle ORM, Web Crypto API, React 19, TypeScript (strict).

## Global Constraints

- `noImplicitAny: true`, `strict: true`, `exactOptionalPropertyTypes: true`.
- Type assertions (`as Type`) are strictly banned across the entire codebase.
- All client-server payloads must originate from `@campus/contracts`.
- Zero line-by-line comment spam; remove all `// ponytail: ...` and syntax-translating comments.
- Raw SQL migrations only for DB schema changes.

---

### Task 1: Shared Response & Error Contracts (`packages/contracts`)

**Files:**
- Create: `packages/contracts/src/errors.ts`
- Modify: `packages/contracts/src/tickets.ts`
- Modify: `packages/contracts/src/collab.ts`
- Modify: `packages/contracts/src/feed.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/test/contracts.test.ts`

**Interfaces:**
- Consumes: Zod primitives
- Produces:
  - `ApiErrorResponseSchema` / `ApiErrorResponse`: `{ success: false, error: string, details?: unknown }`
  - `UserTicketsResponseSchema` / `UserTicketsResponse`: `{ success: true, tickets: UserTicketDto[] }`
  - `ClaimTicketResponseSchema` / `ClaimTicketResponse`: `{ success: true, ticket: UserTicketDto }`
  - `CheckInTicketResponseSchema` / `CheckInTicketResponse`: `{ success: true, ticket: { id: string, checkedInAt: Date | null } }`
  - `CollabListResponseSchema` / `CollabListResponse`: `{ success: true, projects: CollabPostDto[] }`
  - `CreateCollabResponseSchema` / `CreateCollabResponse`: `{ success: true, collab: CollabPostDto }`
  - `FeedListResponseSchema` / `FeedListResponse`: `{ success: true, posts: FeedPostDto[] }`
  - `CreateFeedResponseSchema` / `CreateFeedResponse`: `{ success: true, post: FeedPostDto }`

- [ ] **Step 1: Write the failing tests in `packages/contracts/test/contracts.test.ts`**

Add tests validating the new response envelope schemas and error schema:

```typescript
import {
  ApiErrorResponseSchema,
  ClaimTicketResponseSchema,
  CollabListResponseSchema,
  CreateCollabResponseSchema,
  CreateFeedResponseSchema,
  FeedListResponseSchema,
  UserTicketsResponseSchema,
} from "../src";

// In describe("Contracts Schema Validation"):
it("validates ApiErrorResponseSchema correctly", () => {
  const valid = ApiErrorResponseSchema.safeParse({
    success: false,
    error: "EVENT_SOLD_OUT",
  });
  expect(valid.success).toBe(true);

  const invalid = ApiErrorResponseSchema.safeParse({
    success: true,
    error: "EVENT_SOLD_OUT",
  });
  expect(invalid.success).toBe(false);
});

it("validates response envelopes for tickets, collab, and feed", () => {
  const ticketsValid = UserTicketsResponseSchema.safeParse({
    success: true,
    tickets: [],
  });
  expect(ticketsValid.success).toBe(true);

  const collabValid = CollabListResponseSchema.safeParse({
    success: true,
    projects: [],
  });
  expect(collabValid.success).toBe(true);

  const feedValid = FeedListResponseSchema.safeParse({
    success: true,
    posts: [],
  });
  expect(feedValid.success).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @campus/contracts test`
Expected: FAIL with `Module not found` or `ApiErrorResponseSchema is not defined`.

- [ ] **Step 3: Implement contract definitions**

1. Create `packages/contracts/src/errors.ts`:
```typescript
import { z } from "zod";

export const ApiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: z.string(),
	details: z.unknown().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

2. In `packages/contracts/src/tickets.ts`, add and export:
```typescript
export const UserTicketsResponseSchema = z.object({
	success: z.literal(true),
	tickets: z.array(UserTicketDtoSchema),
});
export type UserTicketsResponse = z.infer<typeof UserTicketsResponseSchema>;

export const ClaimTicketResponseSchema = z.object({
	success: z.literal(true),
	ticket: UserTicketDtoSchema,
});
export type ClaimTicketResponse = z.infer<typeof ClaimTicketResponseSchema>;

export const CheckInTicketResultSchema = z.object({
	id: z.string().uuid(),
	checkedInAt: z.coerce.date().nullable().optional(),
});
export type CheckInTicketResult = z.infer<typeof CheckInTicketResultSchema>;

export const CheckInTicketResponseSchema = z.object({
	success: z.literal(true),
	ticket: CheckInTicketResultSchema,
});
export type CheckInTicketResponse = z.infer<typeof CheckInTicketResponseSchema>;
```
Clean up redundant comments.

3. In `packages/contracts/src/collab.ts`, add and export:
```typescript
export const CollabListResponseSchema = z.object({
	success: z.literal(true),
	projects: z.array(CollabPostDtoSchema),
});
export type CollabListResponse = z.infer<typeof CollabListResponseSchema>;

export const CreateCollabResponseSchema = z.object({
	success: z.literal(true),
	collab: CollabPostDtoSchema,
});
export type CreateCollabResponse = z.infer<typeof CreateCollabResponseSchema>;
```

4. In `packages/contracts/src/feed.ts`, add and export:
```typescript
export const FeedListResponseSchema = z.object({
	success: z.literal(true),
	posts: z.array(FeedPostDtoSchema),
});
export type FeedListResponse = z.infer<typeof FeedListResponseSchema>;

export const CreateFeedResponseSchema = z.object({
	success: z.literal(true),
	post: FeedPostDtoSchema,
});
export type CreateFeedResponse = z.infer<typeof CreateFeedResponseSchema>;
```

5. In `packages/contracts/src/index.ts`:
```typescript
export * from "./auth";
export * from "./collab";
export * from "./errors";
export * from "./feed";
export * from "./profiles";
export * from "./tickets";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @campus/contracts test`
Expected: PASS with 13 tests passing.

- [ ] **Step 5: Commit changes**

```bash
git add packages/contracts/
git commit -m "feat(contracts): define standardized response envelopes and ApiErrorResponseSchema"
```

---

### Task 2: Backend Error & Validation Middleware (`apps/api`)

**Files:**
- Create: `apps/api/src/middleware/validator.ts`
- Modify: `apps/api/src/middleware/error.ts`
- Modify: `apps/api/src/middleware/session.ts`
- Modify: `apps/api/src/middleware/rbac.ts`
- Modify: `apps/api/test/error.test.ts`
- Modify: `apps/api/test/rbac.test.ts`

**Interfaces:**
- Consumes: `ApiErrorResponse` from `@campus/contracts`, `AuthSessionUser` from `@campus/contracts`
- Produces:
  - `validatedJson(schema)` helper wrapping `zValidator` with uniform 400 failure
  - `errorHandler` returning sanitized 500 `{ success: false, error: string }`
  - Strongly typed `c.get("user")` returning `AuthSessionUser | undefined` without `as` assertions.

- [ ] **Step 1: Write failing tests in `apps/api/test/error.test.ts` and `apps/api/test/rbac.test.ts`**

Update `apps/api/test/rbac.test.ts` to expect `{ success: false, error: "UNAUTHORIZED" }` and `{ success: false, error: "FORBIDDEN" }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/test/rbac.test.ts`
Expected: FAIL because responses currently lack `success: false`.

- [ ] **Step 3: Implement `apps/api/src/middleware/validator.ts`**

```typescript
import type { ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

export function validatedJson<T extends ZodSchema>(schema: T) {
	return zValidator("json", schema, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					success: false as const,
					error: "VALIDATION_FAILED",
					details: result.error.flatten(),
				},
				400,
			);
		}
	});
}
```

- [ ] **Step 4: Update `apps/api/src/middleware/session.ts` and `rbac.ts`**

In `session.ts`:
```typescript
import type { AuthSessionUser } from "@campus/contracts";
import type { Context, Next } from "hono";
import { auth } from "../lib/auth";

declare module "hono" {
	interface ContextVariableMap {
		user: AuthSessionUser;
		session: unknown;
	}
}

export async function sessionMiddleware(c: Context, next: Next) {
	if (c.get("user")) {
		await next();
		return;
	}

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ success: false, error: "UNAUTHORIZED" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
}
```

In `rbac.ts`:
```typescript
import type { Context, Next } from "hono";

export type Role = "admin" | "organizer" | "user";

export function requireRole(allowedRoles: Role[]) {
	return async (c: Context, next: Next) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ success: false, error: "UNAUTHORIZED" }, 401);
		}

		const userRole = (user.role ?? "user") as Role;
		if (!allowedRoles.includes(userRole)) {
			return c.json({ success: false, error: "FORBIDDEN" }, 403);
		}

		await next();
	};
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test apps/api/test/rbac.test.ts apps/api/test/error.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit changes**

```bash
git add apps/api/src/middleware/ apps/api/test/
git commit -m "feat(api): standardize error and validation middleware with unified envelope"
```

---

### Task 3: Backend Ticket Module Result Pattern & Boundary Try-Catch (`apps/api` & `packages/crypto`)

**Files:**
- Modify: `apps/api/src/modules/tickets/service.ts`
- Modify: `apps/api/src/modules/tickets/check-in.ts`
- Modify: `apps/api/src/modules/tickets/routes.ts`
- Modify: `packages/crypto/src/tickets.ts`
- Modify: `apps/api/test/tickets.test.ts`

**Interfaces:**
- Consumes: `validatedJson`, `ClaimTicketSchema`, `CheckInTicketSchema`
- Produces:
  - `claimTicketAtomic`: Discriminated result union, `try/catch` catching Postgres code `23505` only, re-throwing unexpected errors
  - `executeCheckIn`: returns `{ success: true, ticket }` or `{ success: false, error }` (standardized from `reason`)
  - `ticketRoutes`: clean route handlers with zero `try/catch`, typed user from context.

- [ ] **Step 1: Update `apps/api/test/tickets.test.ts`**

Update route test expectations to expect `{ success: false, error: "..." }` and check-in success/failure envelopes.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/test/tickets.test.ts`
Expected: FAIL due to route expectation mismatches.

- [ ] **Step 3: Update `service.ts`, `check-in.ts`, `routes.ts`, and crypto**

1. In `apps/api/src/modules/tickets/service.ts`:
   - Replace `(error as UniqueViolationError).code === "23505"` with pure type guard:
   ```typescript
   function isUniqueViolation(error: unknown): error is { code: "23505" } {
       return (
           typeof error === "object" &&
           error !== null &&
           "code" in error &&
           (error as Record<string, unknown>).code === "23505"
       );
   }
   ```
   Wait, per strict rule: use `Reflect.get(error, "code") === "23505"` or property check without `as Record`:
   ```typescript
   function isUniqueViolation(error: unknown): error is { code: string } {
       return (
           typeof error === "object" &&
           error !== null &&
           "code" in error &&
           typeof Reflect.get(error, "code") === "string" &&
           Reflect.get(error, "code") === "23505"
       );
   }
   ```
   - Strip `// ponytail: ...` comments.
   - Retain re-throw on unexpected errors.

2. In `apps/api/src/modules/tickets/check-in.ts`:
   - Standardize `reason` to `error`:
     - `{ success: false as const, error: "INVALID_OR_EXPIRED_SIGNATURE" as const }`
     - `{ success: false as const, error: "EVENT_MISMATCH" as const }`
     - `{ success: false as const, error: "ALREADY_CHECKED_IN_OR_INVALID" as const }`
   - Strip `// ponytail: ...` comment.

3. In `apps/api/src/modules/tickets/routes.ts`:
   - Use `validatedJson(ClaimTicketSchema)` and `validatedJson(CheckInTicketSchema)`.
   - Access `const user = c.get("user");` without type assertion.
   - Return `{ success: false, error: result.error }`.

4. In `packages/crypto/src/tickets.ts`:
   - Remove `as BufferSource` assertions.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test apps/api/test/tickets.test.ts`
Expected: PASS with all ticket tests passing.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/src/modules/tickets/ packages/crypto/src/ apps/api/test/tickets.test.ts
git commit -m "refactor(api): standardize ticket routes and services to strict Result pattern"
```

---

### Task 4: Standardize Feed & Collab Routes (`apps/api`)

**Files:**
- Modify: `apps/api/src/modules/collab/routes.ts`
- Modify: `apps/api/src/modules/feed/routes.ts`
- Modify: `apps/api/test/api.test.ts`

**Interfaces:**
- Consumes: `validatedJson`, contracts schemas
- Produces:
  - `collabRoutes.get("/")`: `{ success: true, projects: [] }`
  - `feedRoutes.get("/")`: `{ success: true, posts: [] }`

- [ ] **Step 1: Write integration tests in `apps/api/test/api.test.ts`**

Add tests checking GET and POST for `/api/collab` and `/api/feed` verifying `{ success: true, ... }` envelope and 400 validation error envelope.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/test/api.test.ts`
Expected: FAIL due to missing `success: true` in GET endpoints.

- [ ] **Step 3: Update `collab/routes.ts` and `feed/routes.ts`**

1. In `apps/api/src/modules/collab/routes.ts`:
   ```typescript
   export const collabRoutes = new Hono()
       .use("*", sessionMiddleware)
       .get("/", async (c) => {
           return c.json({ success: true, projects: [] }, 200);
       })
       .post("/", validatedJson(CreateCollabPostSchema), async (c) => {
           const data = c.req.valid("json");
           return c.json(
               { success: true, collab: { id: crypto.randomUUID(), ...data } },
               201,
           );
       });
   ```

2. In `apps/api/src/modules/feed/routes.ts`:
   ```typescript
   export const feedRoutes = new Hono()
       .use("*", sessionMiddleware)
       .get("/", async (c) => {
           // Zero-Trust: Feed only returns pseudonymous handles. Never joins users table.
           return c.json({ success: true, posts: [] }, 200);
       })
       .post("/", validatedJson(CreateFeedPostSchema), async (c) => {
           const data = c.req.valid("json");
           return c.json(
               { success: true, post: { id: crypto.randomUUID(), ...data } },
               201,
           );
       });
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test apps/api/test/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add apps/api/src/modules/collab/ apps/api/src/modules/feed/ apps/api/test/api.test.ts
git commit -m "feat(api): standardize collab and feed routes with success envelope and validatedJson"
```

---

### Task 5: Frontend Type-Safe Ingestion & Comment Clean-Up (`apps/web`)

**Files:**
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/hooks/useTickets.ts`
- Modify: `apps/web/src/hooks/useCollab.ts`
- Modify: `apps/web/src/hooks/useFeed.ts`

**Interfaces:**
- Consumes: `ApiErrorResponseSchema`, `UserTicketsResponseSchema`, `ClaimTicketResponseSchema`, `CollabListResponseSchema`, `CreateCollabResponseSchema`, `FeedListResponseSchema`, `CreateFeedResponseSchema` from `@campus/contracts`
- Produces:
  - `apiRequest<T>(schema: z.ZodType<T>, endpoint: string, options?: RequestInit): Promise<T>`
  - `ApiError`: typed client error with status and details
  - Hooks with zero duplicate interfaces and zero banned `as Type` assertions.

- [ ] **Step 1: Implement `apps/web/src/lib/api-client.ts`**

```typescript
import { ApiErrorResponseSchema } from "@campus/contracts";
import type { z } from "zod";

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiRequest<T>(
	schema: z.ZodType<T>,
	endpoint: string,
	options?: RequestInit,
): Promise<T> {
	const response = await fetch(endpoint, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const parsedError = ApiErrorResponseSchema.safeParse(errorData);
		const message = parsedError.success
			? parsedError.data.error
			: `HTTP_${response.status}`;
		throw new ApiError(
			response.status,
			message,
			parsedError.success ? parsedError.data.details : undefined,
		);
	}

	const rawData: unknown = await response.json();
	return schema.parse(rawData);
}
```

- [ ] **Step 2: Update `useTickets.ts`, `useCollab.ts`, `useFeed.ts`**

Update each hook:
- Remove local interfaces.
- Pass Zod schemas into `apiRequest`.
- Type-safe try/catch with `instanceof Error` error message extraction.

- [ ] **Step 3: Verify frontend typecheck**

Run: `pnpm --filter @campus/web typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add apps/web/src/
git commit -m "refactor(web): implement schema-parsed apiRequest and integrate contracts in hooks"
```

---

### Task 6: Repository-Wide Verification & Quality Audit

**Files:**
- Entire repository

- [ ] **Step 1: Run typecheck across monorepo**

Run: `pnpm turbo run typecheck`
Expected: All 6 packages pass.

- [ ] **Step 2: Run all unit and integration tests**

Run: `pnpm turbo run test`
Expected: All tests pass.

- [ ] **Step 3: Verify database migrations**

Run: `pnpm --filter @campus/db db:check`
Expected: PostgreSQL schema up to date with zero drift.

- [ ] **Step 4: Check formatting and linting with Biome**

Run: `pnpm dlx @biomejs/biome check .`
Expected: 0 errors.

- [ ] **Step 5: Codebase search audit**

Run: `grep -rn " as " apps/ packages/` (excluding node_modules/dist) to ensure zero unauthorized `as Type` assertions remain.
Run: `grep -rn "ponytail" apps/ packages/` to ensure zero comment clutter remains.

- [ ] **Step 6: Final atomic commit**

```bash
git add .
git commit -m "chore: complete error handling architecture and consistency verification"
```
