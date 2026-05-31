# ServiceDesk — Helpdesk & Support Platform

ServiceDesk is an enterprise-grade customer support and helpdesk portal built on a modern Next.js 14 stack, Prisma ORM, and PostgreSQL. It delivers a Zoho-style user experience with role-based dashboards, a unified application shell, detailed ticket conversation threads, dynamic SLA calculation, CRM tools, a knowledge base, and visual reporting metrics.

---

## 🚀 Key Features

### 1. Collapsible Sidebar & Unified Shell
* Collapsible navigation layout showing active route highlights (including query-param-aware filtering) and staff counts.
* Unified top navigation with global search inputs, breadcrumb pathname indicators, and quick-create ticket buttons.
* Dynamic NextAuth session headers to extract logged-in profile names, roles, and initial circles.

### 2. Deep Ticket Detail & Property Management
* **70/30 Thread Layout**: Left side renders chronologically sorted timeline conversations, while the right panel displays core ticket metadata.
* **Reply Composer**: Smooth tab controls to draft public client replies or record private amber-highlighted internal notes.
* **Property Controls**: Interactive dropdowns to reassign tickets to specific agents, modify priorities (Urgent, High, Medium, Low), or change statuses (Open, In Progress, On Hold, Pending, Resolved, Closed).
* **Live SLA Counter**: Dynamic countdown calculations changing colors based on SLA limits (Green for compliant, Red for breached).
* **Activity Logs**: Chronological metadata audit tracking changes made to tickets.

### 3. CRM & Organization Directories (CRUD)
* **Client Contacts Directory (`/contacts`)**: Full CRUD controls to add, search, and edit customer contacts (email, phone, company account).
* **Corporate Accounts Manager (`/accounts`)**: Corporate account registers showing domain websites, industry sectors, and active client counters.

### 4. Helpdesk Operations Settings
* **Departments Configuration (`/settings/departments`)**: Admin-only settings page to manage support department queues (e.g., Tech Support, Billing) with custom target email addresses and operational timezones.
* **Database Integrity**: Employs Prisma's `onDelete: SetNull` cascade settings so deleting departments or contacts safely nullifies ticket bindings rather than cascading destructively.

### 5. Interactive Knowledge Base (KB)
* Dynamic articles categories viewable by all users at `/kb`.
* Dynamic article details with automatically incrementing view counts.
* Interactive administrator CRUD panels to edit article titles, categories, publish draft statuses, and manage collections.

### 6. Analytics & Performance Reports (`/reports`)
* Visual dashboard presenting performance metrics.
* Tracks SLA compliance percentages, average Customer Satisfaction (CSAT) ratings, active breach alerts, and department workload distributions.

---

## 🛠️ Technology Stack

* **Core**: Next.js 14 (App Router) & React 18
* **Database Layer**: Prisma ORM with PostgreSQL
* **Security & Auth**: NextAuth.js v4 (Credentials Provider with role mapping)
* **Validation**: Zod (for server-side input and body validations)
* **Styling**: Vanilla CSS Modules (Fluid flex layouts, custom dark mode colors, glassmorphism filters, animations)
* **Icons**: Lucide React

---

## 🔑 Demo Access Credentials

To test the application locally, you can sign in using any of the seeded credentials:

* **Administrator Role**:
  * Email: `admin@acme.com`
  * Password: `password123`
* **Agent Role**:
  * Email: `sarah@acme.com`
  * Password: `password123`

---

## ⚙️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database Environment
Create a `.env` or `.env.local` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/service_desk"
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run Database Migrations & Seeds
Push the schema to your local PostgreSQL instance and seed it with demo CRM accounts, tickets, agents, and categories:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Launch the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. All layout shells, custom CRM folders, and setting pages are fully responsive and functional!
