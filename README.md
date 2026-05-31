# Service Desk Portal

Production-oriented Service Desk Portal scaffolded with Next.js App Router, Auth.js sessions, PostgreSQL, raw `pg` pooling, Zod validation, explicit RBAC, and CSS Modules.

## Stack

- Next.js 14 App Router
- Node.js runtime API routes
- PostgreSQL with raw `pg.Pool`
- Zod validation
- Auth.js / NextAuth session cookies
- React Icons (`react-icons/fi`)
- CSS Modules

## Key Files

- `db/migrations/001_init_service_desk.sql` creates enums, tables, indexes, triggers, and PostgreSQL extensions.
- `lib/db.js` owns the strict PostgreSQL pool and transaction helpers.
- `lib/auth.js` configures credential-based Auth.js sessions.
- `lib/rbac.js` centralizes session loading and role checks.
- `lib/validation/tickets.js` contains shared Zod schemas and SLA calculation.
- `app/api/tickets/route.js` implements `POST /api/tickets` and `GET /api/tickets`.
- `app/api/tickets/[id]/comments/route.js` implements `POST /api/tickets/:id/comments`.
- `app/components/TicketCreationForm.jsx` provides the customer ticket form.
- `app/components/AgentTicketDashboard.jsx` and `app/components/AgentTicketTable.jsx` provide the server/client hybrid queue.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`.

3. Run the migration against PostgreSQL:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/001_init_service_desk.sql
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Security Notes

- API routes use `getServerSession()` and reject missing sessions with `401`.
- Customers only see their own tickets in `GET /api/tickets`.
- Customers cannot create internal notes.
- SQL calls use parameterized queries only.
- Database errors are logged server-side and mapped to a generic client-safe `500`.
- Request bodies are parsed as JSON and validated with strict Zod schemas.
