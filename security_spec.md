# Security Specification — Company Tech Internship Management System

## 1. Data Invariants
1. Applications can only be updated by verified administrators (`admins/{adminUid}`).
2. Status transitions must strictly follow the state machine: Pending -> Accepted OR Pending -> Rejected. No transitions from Accepted <-> Rejected or back to Pending.
3. Joining date and internship duration must be provided upon acceptance and cannot be empty.
4. Applicants cannot alter status, offerLetterPath, or timestamps directly.
5. PII (applicant full name, email, college) cannot be read by anonymous or unauthenticated users.
6. Email jobs can only be created and updated by system/admins to track transactional dispatch.
7. Admin credentials and claims cannot be self-assigned.

## 2. The "Dirty Dozen" Threat Payloads
1. **Ghost Field Injection**: Attempt to create an application with an injected `isAdmin: true` or `status: "Accepted"`. Must be rejected.
2. **Terminal Status Bypass**: Attempt to update an already "Accepted" application to "Rejected" or "Pending". Must be rejected.
3. **Public Enumeration Attack**: Unauthenticated user attempting to list `/applications` collection. Must return `PERMISSION_DENIED`.
4. **ID Poisoning Attack**: Document ID with invalid characters (e.g. `../../etc/passwd` or oversized junk 2KB ID). Must be rejected.
5. **Self-Promotion Attack**: Authenticated non-admin user creating `/admins/{theirUid}` with role `admin`. Must be rejected.
6. **Fake Offer Letter Path**: Non-admin user setting `offerLetterPath` on another applicant's record. Must be rejected.
7. **Direct Status Modification**: Applicant attempting to update their own application status to `Accepted`. Must be rejected.
8. **Client Timestamp Forgery**: Sending client local timestamp instead of valid server timestamp.
9. **Role Tampering**: Inbound role outside the 12 approved Company Tech internship roles. Must be rejected.
10. **Arbitrary Field Deletion**: Deleting mandatory fields such as `email` or `internshipRole`. Must be rejected.
11. **Email Job Forgery**: Forging a `delivered` status on an email job without authorized processing. Must be rejected.
12. **Malicious Resume Path**: Injecting an executable extension or remote URL into `resumePath`. Must be rejected.
