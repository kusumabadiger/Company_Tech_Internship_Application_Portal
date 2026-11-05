# Company Tech — Internship Application & Management System

## Overview

The **Company Tech Internship Application & Management System** is a web-based platform designed to streamline the internship recruitment process for applicants and administrators.

The platform enables applicants to create accounts, explore internship opportunities, submit applications, upload resumes, and track their application progress. Administrators can manage applications, review applicant details, update application statuses, and coordinate recruitment activities through a dedicated admin portal.

## Features

### Applicant Portal
- User registration and secure login
- Email verification and password reset
- Personal profile management
- Browse available internship opportunities
- Submit internship applications
- Upload and manage resumes
- Track application status and progress
- Receive application-related email notifications

### Admin Portal
- Separate administrator login
- Secure admin authentication and authorization
- View and manage internship applications
- Filter applications by status and internship role
- Review applicant details and resumes
- Update application statuses
- Manage recruitment workflows
- Send automated email notifications
- Monitor email delivery and retry failed emails

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend development |
| TypeScript | Type-safe application development |
| Vite | Development server and build tool |
| Node.js | Backend runtime |
| Express.js | Backend API |
| Firebase Authentication | User authentication and email verification |
| Firebase Admin SDK | Backend authentication verification |
| Firestore / Application Data Storage | Data management |
| Gmail SMTP | Automated email notifications |

## Installation and Setup

### Prerequisites
- Node.js
- npm
- Git
- Firebase project with Authentication configured

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/company-tech-internship-management-system.git
```

### 2. Navigate to the project directory

```bash
cd company-tech-internship-management-system
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root and add the required Firebase, backend, and SMTP configuration.

Do not commit `.env` files or sensitive credentials to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open the application at the local URL displayed in the terminal.

## Security

The system incorporates:
- Firebase-based authentication
- Email verification
- Protected application routes
- Backend verification of Firebase ID tokens
- Role-based access control for administrators
- Restricted access to applicant resumes
- Environment-based configuration for sensitive credentials

## Testing

Run the following commands to check the project:

```bash
npm run lint
npm run build
```

## Project Objective

The goal of this project is to provide a centralized and efficient internship recruitment platform that reduces manual administrative work, improves applicant communication, and simplifies application management.

## Future Enhancements

- AI-powered resume and internship matching
- Interview scheduling and notifications
- Recruitment analytics and reporting
- Advanced application filtering
- Applicant reminders and notifications

## Author

Developed as a software project for internship application and recruitment management.
