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

## 🐳 Docker Containerized Setup (Automated & Recommended)

This project is fully containerized with Docker and Docker Compose, orchestrating both the Next.js web application and a PostgreSQL database with persistent storage. 

We provide one-click setup scripts that verify your Docker installation, copy environment configurations, resolve port conflicts, build the Docker images, spin up the containers, run the Prisma schema migrations, seed the database, and verify the app is fully online.

### Running in Docker

#### Option A: Windows (PowerShell)
Run the automated script in a PowerShell prompt:
```powershell
.\setup-docker.ps1
```

#### Option B: macOS, Linux, or Git Bash
Run the automated bash script in your terminal:
```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

---

### Managing the Docker Stack Manually

If you prefer to run the Docker commands manually:

1. **Start the containers** in the background:
   ```bash
   docker compose up -d --build
   ```
   *This automatically builds the Next.js app image, runs Prisma migration schema checks, seeds default database values, and binds the web app to port `3000` and PostgreSQL to port `5433` on the host.*

2. **Check the logs** for the app container:
   ```bash
   docker compose logs -f app
   ```

3. **Stop the containers** (preserving database volumes):
   ```bash
   docker compose down
   ```

4. **Stop the containers and wipe the database data**:
   ```bash
   docker compose down -v
   ```

---

## ⚙️ Manual Local Development Setup

Follow these detailed steps to set up and run ServiceDesk manually.

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v18.x or higher) and **npm**
* **PostgreSQL** (v15.x or higher)

---

### 2. Start PostgreSQL Database
ServiceDesk requires a running PostgreSQL instance.

#### Option A: Project-Specific Local PostgreSQL (Recommended for this workspace)
If you are developing in this pre-configured Windows environment, a local PostgreSQL data folder is located at `C:\Service\db_data`. You can start the database using PowerShell:
```powershell
# Start the PostgreSQL server
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Service\db_data" -l "C:\Service\db_data\logfile"
```
*Note: The local PostgreSQL database is configured to listen on port **5433**.*

#### Option B: Standard/Global PostgreSQL Installation
If you are using a standard global PostgreSQL installation:
1. Ensure the PostgreSQL service is running.
2. Create a database named `service_desk`.
3. Note your connection details (user, password, host, port).

---

### 3. Configure Environment Variables
Create a `.env` (or `.env.local`) file in the root directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```

Configure the environment variables in `.env`:
```env
# Database connection URL (matches the local postgres database port 5433)
DATABASE_URL="postgresql://postgres@localhost:5433/service_desk"

# NextAuth secret used for token and session encryption
NEXTAUTH_SECRET="super-secret-dev-key-change-in-production-2024"

# NextAuth canonical URL
NEXTAUTH_URL="http://localhost:3000"
```

---

### 4. Install Dependencies
Install the required packages:
```bash
npm install
```

---

### 5. Initialize the Database (Schema & Seeds)
Sync the Prisma schema to your PostgreSQL database and run the bootstrap seed script:

1. **Push the database schema**:
   This command creates the necessary tables, relations, and columns:
   ```bash
   npx prisma db push
   ```

2. **Seed the database**:
   Bootstrap the database with an organization profile and a default Administrator account:
   ```bash
   npx prisma db seed
   ```

*(Optional)* **Clear/Wipe the Database**:
If you ever need to start with a fresh database and wipe all records (while maintaining database schema integrity):
```bash
node prisma/clear.js
```

---

### 6. Run the Development Server
Launch the Next.js development server:
```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Access Credentials

Once the database has been seeded, use the following credentials to sign in:

* **Administrator Account**:
  * **Email**: `admin@servicedesk.com`
  * **Password**: `admin123`

* **Adding Agents, Contacts, & Departments**:
  Once logged in as an Administrator, you can navigate to:
  * **Settings → Departments** to add, edit, or remove support departments.
  * **Contacts** to add client contacts and associate them with customer accounts.
  * **Accounts** to manage client company accounts.
  * *These newly added entities will instantly populate dropdown selections across the portal (e.g., in the Submit Ticket form).*
