# MyQuro POS – Complete Deployment & Distribution Plan

This document outlines the full deployment architecture, distribution model, and operational flow for the MyQuro POS system, based on the current codebase structure.

---

# 1. System Overview

MyQuro POS utilizes a **Hybrid Client-Bridge Architecture** consisting of two primary components:

## A. Cloud Layer (SaaS Application)
**Tech Stack:** Next.js 15 (App Router), Neon (Postgres), Drizzle ORM, Better Auth, Cloudflare R2.

**Responsibilities:**
*   **Authentication:** Managed via `better-auth` (Tables: `user`, `session`, `account`).
*   **Organization Logic:** Multi-tenant support via `organization` tables.
*   **Business Logic:** API routes for Orders, Menu, and Reporting (`app/api/pos/`).
*   **Print Generation:** Generates raw print payloads (JSON) for Bills and KOTs (`lib/pos/buildPrintData.ts`).
*   **Storage:** Stores compliance documents in Cloudflare R2 (`lib/r2.ts`).

## B. Local Print Bridge (Desktop Agent)
**Tech Stack:** Electron, Express.js, Node.js.

**Responsibilities:**
*   **Local Server:** Listens on port `4001` (by default) via Express.
*   **Printer Driver:** Communicates with thermal printers via USB/Serial/Network.
*   **Formatting:** Converts JSON payloads into printer-specific commands (`pos-print-bridge/formatter.js`).
*   **System Tray:** Runs silently in the background on the restaurant's POS terminal.

---

# 2. Cloud Deployment (SaaS)

## Step 1 – Database (Neon Postgres)
*   **Setup:** Create a Neon project.
*   **Migrations:**
    *   Ensure `drizzle.config.ts` points to your schema.
    *   Run migrations: `npx drizzle-kit migrate`.
    *   **Key Tables to Verify:** `order`, `order_item`, `menu_item`, `order_print_event`.

## Step 2 – Object Storage (Cloudflare R2)
*   **Bucket:** Create a private bucket (e.g., `myquro-pos-documents`).
*   **Access:** Generate R2 API Tokens with **Object Read & Write** permissions.
*   **CORS:** Configure CORS on the bucket to allow requests from your production domain.
*   **Code Reference:** See `lib/r2.ts` (uses `@aws-sdk/client-s3` with custom HTTPS agent).

## Step 3 – Vercel Deployment (Web App)
*   Import the repository into Vercel.
*   **Build Command:** `next build`
*   **Environment Variables:**

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Connection String | `postgres://User:Pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Auth encryption key | `generated-secret-key` |
| `BETTER_AUTH_URL` | Base URL of the app | `https://pos.myquro.com` |
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID | `...` |
| `R2_ACCESS_KEY_ID` | R2 Token Access Key | `...` |
| `R2_SECRET_ACCESS_KEY` | R2 Token Secret | `...` |
| `R2_BUCKET_NAME` | Name of the bucket | `myquro-pos-documents` |
| `NEXT_PUBLIC_BASE_URL` | Public frontend URL | `https://pos.myquro.com` |
| `NEXT_PUBLIC_PRINT_BRIDGE_URL` | Address of local agent | `http://localhost:4001` |

*   **Deploy:** Push to `main` branch to trigger deployment.

---

# 3. Print Architecture (Client-Side Bridge Model)

Current implementation (verified in `lib/pos/printClient.ts`):

1.  **User Trigger:** Staff clicks "Print Bill" or "Print KOT" in the POS UI.
2.  **Fetch Payload:** Browser calls SaaS API:
    *   `POST /api/pos/orders/[id]/print/[type]`
    *   Server verifies `orderId`, builds print data, and returns JSON.
3.  **Bridge Communication:** Browser explicitly calls the Local Bridge:
    *   `POST http://localhost:4001/print`
    *   Body: `{ type: "BILL" | "KOT", data: { ... } }`
4.  **Physical Print:**
    *   Bridge (`server.js`) receives request.
    *   Bridge formats text (`formatter.js`) and sends to printer (`printer.js`).
5.  **Logging (Optional):**
    *   Success/Failure can be logged back to the server in `order_print_event` table.

**Security Details:**
*   The browser communicates directly with `localhost`.
*   This avoids complex firewall polling logic inside the restaurant network.
*   The Cloud API never talks to the printer directly.

---

# 4. Print Agent Distribution (Electron)

The agent is located in `pos-print-bridge/`.

## Build Configuration
*   **Package Name:** `myquro-print-agent`
*   **Builder:** `electron-builder`
*   **Targets:**
    *   Windows (`nsis` installer)
    *   Linux (`AppImage`)
    *   macOS (`dmg`)

## Build Steps
1.  Navigate to directory: `cd pos-print-bridge`
2.  Install dependencies: `npm install`
3.  Build for current OS: `npm run build`
    *   *Note: To build for Windows from Linux, you may need Wine installed or use CI/CD.*

## Installation (Restaurant Side)
1.  Run the installer (e.g., `MyQuro Print Agent Setup 1.0.0.exe`).
2.  App installs to local data/program files.
3.  Starts automatically on launch.
4.  **Verification:** Check system tray for the MyQuro icon.
5.  **Port Check:** Ensure port `4001` is not blocked by local antivirus.

---

# 5. Production Workflow

## New Restaurant Onboarding
1.  **Admin:** Create Organization in SaaS Dashboard (`/admin`).
2.  **Admin:** Verify Organization status (Active).
3.  **Owner:** Receive email invite -> Sign up.
4.  **Setup:**
    *   Owner logs in on POS machine.
    *   Downloads & Installs **Print Agent**.
    *   Navigates to POS page (`/pos`).
    *   Browser asks prompt to allow connection to `localhost:4001` (if applicable).
5.  **Compliance:** Owner uploads required documents (mapped to `organization_document` schema).

---

# 6. Monitoring & Maintenance

## Database Monitoring
*   Monitor `order_print_event` table for high failure rates (`status = 'FAILED'`).
*   Check `drizzle` folder for schema sync state.

## App Monitoring
*   Use Vercel Analytics for page speeds.
*   Check Vercel Server Logs for R2 upload failures or Auth issues.

## Print Agent Updates
*   Currently manual update (distribute new `.exe`).
*   *Future:* Enable `electron-updater` for auto-updates.

---
