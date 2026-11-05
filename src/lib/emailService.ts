/**
 * Email Service Module for Company Tech
 * Handles transactional emails, template rendering, and Resend API integration.
 */
export { sendEmailJob, renderEmailTemplate, getEmailConfig, maskEmail } from '../../server/email';
export type { EmailSendResult } from '../../server/email';
