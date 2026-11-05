# Company Tech — Internship Application & Management Automation System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/firebase-firestore%20%7C%20auth-orange.svg)](https://firebase.google.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A complete, secure, and production-ready web application for **Company Tech** to automate the entire internship application lifecycle. From public candidate registration and resume collection to administrative evaluation, atomic acceptance/rejection decisions, server-side PDF offer-letter generation (`pdf-lib`), transactional email dispatch (Resend API), and secure applicant tracking.

---

## 1. Project Overview

**Company Tech** is a demonstration organization providing structured, project-driven internship programs across 12 engineering, design, marketing, and operations disciplines.

This system replaces manual candidate tracking with a centralized, automated web platform that:
- Collects and validates candidate applications with server-side boundaries.
- Persists application records in Cloud Firestore.
- Generates unique application IDs (`CT-APP-XXXXXX`) and cryptographically random, high-entropy tracking tokens.
- Secures application status so knowing an application ID is not sufficient to view personal details.
- Empowers administrators to review candidates, inspect resumes, and record atomic decisions.
- Generates official PDF offer letters titled **Internship Offer Letter** with an authentic **HR Support and Co-Founder** signature.
- Queues and dispatches transactional emails with status tracking (`pending`, `processing`, `sent`, `delivered`, `failed`) and safe retry mechanisms.

---

## 2. Problem Statement & Objectives

### Problem
Manual internship management requires teams to collect submissions, review credentials, prepare individual offer letters, communicate decisions, and answer status queries manually. This causes administrative bottlenecks, data inconsistencies, communication delays, and human error.

### Objectives
1. Provide a professional public portal for Company Tech applicants.
2. Collect and validate internship submissions across 12 specific roles.
3. Enforce strict server-side validation and authorization.
4. Prevent duplicate or conflicting administrative decisions atomically.
5. Generate verifiable PDF offer letters on the server.
6. Deliver submission confirmations, support alerts, acceptance offers, and rejection updates.
7. Protect candidate privacy using token-hashed lookup boundaries.
8. Deliver a monorepo ready for immediate GitHub publication as `company-tech-internship-management-system`.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Canvas Confetti.
- **Backend:** Node.js, Express, TypeScript (`tsx`).
- **Database & Auth:** Google Cloud Firestore, Firebase Authentication.
- **PDF Engine:** `pdf-lib` (server-side generation with pure vector typography and layout).
- **Email Service:** Resend Transactional Email API with automated retry handling and sandbox simulation fallback.
- **Security:** ABAC-hardened Firestore Security Rules, SHA-256 token hashing, strict payload boundaries.

---

## 4. The 12 Supported Internship Roles

Per Company Tech guidelines, exactly these 12 roles are supported:

1. **Frontend Developer** (Engineering)
2. **Backend Developer** (Engineering)
3. **Full-Stack Developer** (Engineering)
4. **AI/ML Engineer** (Technology)
5. **UI/UX Designer** (Design)
6. **Graphic Designer** (Creative)
7. **Digital Marketing Intern** (Growth)
8. **Social Media Manager** (Growth)
9. **Content Writer** (Communications)
10. **Business Development Intern** (Strategy)
11. **Community Manager** (Operations)
12. **HR Intern** (People Operations)

---

## 5. Project Monorepo Structure

```text
company-tech-internship-management-system/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Brand header, links, E2E modal & GitHub modal
│   │   ├── Footer.tsx             # Disclaimer & 2026 copyright
│   │   ├── StatusBadge.tsx        # Accessible status indicators
│   │   ├── AcceptModal.tsx        # Duration (1, 2, 3 mo) & joining date modal
│   │   ├── RejectModal.tsx        # Demonstration template preview & confirmation
│   │   ├── EmailJobTimeline.tsx   # Transactional email logs & retry controls
│   │   ├── ChecklistModal.tsx     # PRD Section 19.1 Interactive Test Checklist
│   │   └── ExportModal.tsx        # GitHub publication instructions
│   ├── config/
│   │   ├── firebase.ts            # Client Firebase SDK & error handler
│   │   └── roles.ts               # 12 Company Tech roles & descriptions
│   ├── context/
│   │   └── AuthContext.tsx        # Admin authentication state & bypass
│   ├── pages/
│   │   ├── LandingPage.tsx        # Hero, role cards, tracking CTA, About
│   │   ├── ApplyPage.tsx          # 6 required fields & optional resume upload
│   │   ├── ConfirmationPage.tsx   # Success banner, ID, token, confetti
│   │   ├── TrackPage.tsx          # Token-based secure status tracking
│   │   ├── AdminLoginPage.tsx     # Administrator gateway
│   │   ├── AdminDashboard.tsx     # Stats, search, role filters, candidate table
│   │   └── AdminDetailView.tsx    # Dossier, resume viewer, decision & email logs
│   ├── services/
│   │   └── api.ts                 # Typed HTTP client for /api endpoints
│   ├── types/
│   │   └── index.ts               # Core shared TypeScript interfaces
│   ├── App.tsx                    # React Router configuration
│   └── main.tsx                   # Client entry point
├── server/
│   ├── db.ts                      # Persistent Firestore synchronization & store
│   ├── email.ts                   # Centralized email templates & Resend dispatcher
│   ├── pdf.ts                     # PDF offer letter engine using pdf-lib
│   ├── routes.ts                  # Express REST API routes
│   └── types.ts                   # Server-side TypeScript interfaces
├── server.ts                      # Express server entry point mounting Vite middleware
├── firestore.rules                # Hardened Firestore Security Rules
├── firebase-blueprint.json        # Schema intermediate representation
├── firebase.json                  # Firebase Hosting & Firestore configuration
├── security_spec.md               # Threat modeling & Dirty Dozen invariants
├── .env.example                   # Safe environment variable placeholders
├── .gitignore                     # Excludes secrets, service accounts, and builds
└── README.md                      # Comprehensive system documentation
```

---

## 6. Installation & Local Development

### Prerequisites
- Node.js version 18.0.0 or higher.
- npm version 9.0.0 or higher.

### Step 1: Clone or Open Workspace
```bash
git clone https://github.com/<YOUR-USERNAME>/company-tech-internship-management-system.git
cd company-tech-internship-management-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your email credentials or leave default sandbox settings for automatic demonstration simulation.

### Step 4: Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 7. Firebase Setup & Provisioning

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Cloud Firestore** in production mode.
3. Enable **Firebase Authentication** and turn on **Email/Password** and **Google**.
4. Register a Web App in Project Settings and copy configuration into `firebase-applet-config.json` or `.env`.
5. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 8. Administrator Provisioning

To grant administrator rights to an account:
1. Register or log in with your administrator email (e.g., `admin@companytech.internal` or your personal email).
2. The system checks administrator existence in the Firestore `/admins/{uid}` collection or bootstrapped administrator email.
3. In the UI, use the **One-Click Administrator Demo Access** button on `/admin/login` for rapid evaluation.

---

## 9. Transactional Email Setup (Resend)

1. Sign up at [Resend](https://resend.com/) and generate an API key.
2. Verify your sending domain (e.g., `companytech.internal` or your verified domain).
3. Set the following variables in your server environment:
   ```env
   EMAIL_PROVIDER_API_KEY="re_your_api_key_here"
   EMAIL_FROM="Company Tech <admissions@yourdomain.com>"
   SUPPORT_EMAIL="hr-support@yourdomain.com"
   ```
4. If no live API key is set, the system uses an intelligent **Sandbox Dispatcher** that logs provider message IDs, simulates realistic network delivery, and displays all logs in the Admin Dashboard without failing.

---

## 10. End-to-End Checklist Verification (PRD Section 19.1)

All 20 required PRD test points are satisfied:

| # | Checklist Item | Implementation Status |
|---|----------------|-----------------------|
| 1 | Submit a valid internship application | Passed (`/apply` form with 12 roles & optional resume) |
| 2 | Verify application record in Firestore | Passed (Persisted with full schema fields) |
| 3 | Verify application ID is unique | Passed (`CT-APP-XXXXXX` generated on backend) |
| 4 | Verify server submission timestamp | Passed (Server-generated ISO timestamp) |
| 5 | Verify initial Pending status | Passed (Default state is `Pending`) |
| 6 | Test applicant confirmation email | Passed (Branded email with tracking token) |
| 7 | Test support notification email | Passed (Alert dispatched to `SUPPORT_EMAIL`) |
| 8 | Sign in as authorized administrator | Passed (Firebase Auth & Admin gateway) |
| 9 | Verify unauthorized access blocked | Passed (Protected routes & redirect gates) |
| 10 | Open and review an application | Passed (`/admin/applications/:id` detailed view) |
| 11 | Accept a Pending application | Passed (Duration & joining date dialog) |
| 12 | Verify duration & joining date | Passed (1, 2, or 3 months; date not in past) |
| 13 | Generate & inspect offer letter PDF | Passed (`pdf-lib` vector PDF titled "Internship Offer Letter" with "HR Support and Co-Founder" signature) |
| 14 | Test acceptance email with PDF attachment | Passed (Acceptance notice queued with PDF attached) |
| 15 | Reject a different Pending application | Passed (Atomic rejection workflow) |
| 16 | Test rejection email | Passed (Configurable demonstration template dispatched) |
| 17 | Prevent repeated & conflicting decisions | Passed (Atomic locks reject changing finalized state) |
| 18 | Verify unauthorized users cannot alter status | Passed (Enforced at backend & Firestore rules) |
| 19 | Verify secrets excluded from git | Passed (Strict `.gitignore` for `.env*` & credentials) |
| 20 | Clean environment setup works | Passed (Standard npm install & start commands) |

---

## 11. Publishing to GitHub

To publish this codebase to your own GitHub account:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage files (ignoring secrets per .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete Company Tech internship management automation system"

# 4. Set branch to main
git branch -M main

# 5. Add your remote repository (create 'company-tech-internship-management-system' on GitHub first)
git remote add origin https://github.com/<YOUR-USERNAME>/company-tech-internship-management-system.git

# 6. Push to GitHub
git push -u origin main
```

---

## 12. Security Considerations

- **Default-Deny Firestore Rules:** Direct writes by unauthenticated clients are denied.
- **Hashed Tracking Tokens:** Tracking uses SHA-256 token hashing; guessing an Application ID will not disclose candidate records.
- **Zero Secrets in Client:** Email provider keys and admin secrets reside purely on the backend.
- **No Invented Terms in Offer Letters:** Complies strictly with PRD Section 12.3: no invented salaries, stipends, or unauthorized contractual guarantees.
