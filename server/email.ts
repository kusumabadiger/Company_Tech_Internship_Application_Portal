import 'dotenv/config';
import nodemailer from 'nodemailer';
import { ApplicationRecord, EmailJobRecord, EmailType, EmailStatus } from './types';

export interface EmailSendResult {
  status: EmailStatus;
  providerMessageId?: string;
  errorMessage?: string;
}

/**
 * Reads dynamic environment configuration at dispatch time.
 */
export function getEmailConfig() {
  const provider = (process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || 'resend').trim().toLowerCase();
  const apiKey = (process.env.EMAIL_PROVIDER_API_KEY || process.env.RESEND_API_KEY || '').trim();
  const rawFrom = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
  const emailFrom = rawFrom || 'Company Tech <onboarding@resend.dev>';
  const supportEmail = (process.env.SUPPORT_EMAIL || 'hr-support@companytech.internal').trim();
  const frontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').trim();
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpFrom = (process.env.SMTP_FROM || '').trim();
  const smtpDefaultFrom = smtpHost.toLowerCase() === 'smtp.gmail.com' && smtpUser.includes('@')
    ? `Company Tech <${smtpUser}>`
    : rawFrom || 'Company Tech <no-reply@companytech.internal>';

  return {
    provider,
    apiKey,
    emailFrom,
    supportEmail,
    frontendUrl,
    smtp: {
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || '587'),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      user: smtpUser,
      pass: (process.env.SMTP_PASS || '').trim(),
      from: smtpFrom || smtpDefaultFrom,
    },
  };
}

export function createSmtpTransporter() {
  const { smtp } = getEmailConfig();

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 587,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

export async function verifySmtpConnection(): Promise<{ ok: boolean; host: string; secure: boolean; userMasked: string; errorCode?: string; message: string }> {
  const { smtp } = getEmailConfig();

  if (!smtp.host || !smtp.user || !smtp.pass) {
    return {
      ok: false,
      host: smtp.host || 'missing',
      secure: smtp.secure,
      userMasked: smtp.user ? `${smtp.user.slice(0, 2)}***` : 'missing',
      message: 'SMTP is not fully configured. Check SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_PORT.',
    };
  }

  if (!hasValidSmtpHost(smtp.host)) {
    return {
      ok: false,
      host: smtp.host,
      secure: smtp.secure,
      userMasked: `${smtp.user.slice(0, 2)}***`,
      message: 'SMTP_HOST is invalid. For Gmail, use smtp.gmail.com.',
    };
  }

  const transporter = createSmtpTransporter();

  try {
    await transporter.verify();
    return {
      ok: true,
      host: smtp.host,
      secure: smtp.secure,
      userMasked: smtp.user.includes('@') ? `${smtp.user.slice(0, 2)}***@${smtp.user.split('@')[1]}` : `${smtp.user.slice(0, 2)}***`,
      message: 'SMTP connection verified successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP verification failure';
    const code = (error as { code?: string } | null)?.code ?? 'SMTP_VERIFY_FAILED';
    const friendlyMessage = smtp.host.toLowerCase() === 'smtp.gmail.com'
      && (code === 'EAUTH' || /535|BadCredentials|Username and Password not accepted/i.test(message))
      ? 'Gmail rejected SMTP authentication (535). Set SMTP_PASS in the project .env to a current Google App Password for SMTP_USER, then restart the server and retry the failed email.'
      : message;
    return {
      ok: false,
      host: smtp.host,
      secure: smtp.secure,
      userMasked: smtp.user.includes('@') ? `${smtp.user.slice(0, 2)}***@${smtp.user.split('@')[1]}` : `${smtp.user.slice(0, 2)}***`,
      errorCode: code,
      message: friendlyMessage,
    };
  }
}

function hasValidSmtpHost(host: string): boolean {
  if (!host || host.includes('@')) {
    return false;
  }
  const normalized = host.trim().toLowerCase();
  return /^((localhost)|(\d{1,3}(\.\d{1,3}){3})|([a-z0-9.-]+\.[a-z]{2,}))$/i.test(normalized);
}

/**
 * Privacy-safe email masking for server logs (never logs raw email or secrets).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Renders centralized email templates for Company Tech.
 */
export function renderEmailTemplate(
  type: EmailType,
  app: ApplicationRecord,
  trackingToken?: string
): { subject: string; html: string; text: string } {
  const { frontendUrl } = getEmailConfig();
  const token = trackingToken || app.trackingToken || 'CT-TOKEN';
  const trackUrl = `${frontendUrl}/track?id=${encodeURIComponent(app.applicationId)}&token=${encodeURIComponent(token)}`;

  switch (type) {
    case 'applicant_confirmation':
      return {
        subject: `Application Received: ${app.internshipRole} Internship — Company Tech`,
        text: `Dear ${app.fullName},

Thank you for applying for the ${app.internshipRole} internship at Company Tech.

Your application reference ID is: ${app.applicationId}
Current Status: ${app.status}

You can securely track your application status at any time using your tracking token:
${trackUrl}

Our admissions team will review your application. We will communicate the outcome directly to your email.

Regards,
HR Support and Admissions
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px; letter-spacing: 0.5px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">INTERNSHIP AUTOMATION SYSTEM</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">Thank you for submitting your application for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Application Reference</div>
    <div style="font-size: 18px; font-weight: 700; color: #0f172a; font-family: monospace;">${app.applicationId}</div>
    <div style="margin-top: 10px; font-size: 13px; color: #64748b;">Current Status: <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background-color: #fef3c7; color: #92400e; font-weight: 600;">Pending Review</span></div>
  </div>

  <p style="font-size: 14px; line-height: 1.5; color: #475569;">
    You can securely track your application progress without exposing personal data by using your secure tracking token:
  </p>
  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Track Application Status</a>
  </p>

  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Best regards,<br />
    <strong>HR Support and Admissions</strong><br />
    Company Tech
  </p>
</div>`,
      };

    case 'support_notification':
      return {
        subject: `[New Application] ${app.internshipRole} — ${app.fullName} (${app.applicationId})`,
        text: `New Internship Application Received:

Application ID: ${app.applicationId}
Applicant Name: ${app.fullName}
Email: ${app.email}
College: ${app.college}
Year of Study: ${app.pursuingYear}
Experience Level: ${app.experienceLevel}
Internship Role: ${app.internshipRole}
Submission Time: ${app.submittedAt}

Review in Admin Dashboard:
${frontendUrl}/admin/applications/${app.applicationId}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h3 style="color: #0f172a; margin-top: 0;">New Internship Application Submitted</h3>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
    <tr><td style="padding: 6px 0; color: #64748b; width: 140px;">Application ID:</td><td><strong>${app.applicationId}</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Candidate Name:</td><td>${app.fullName}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Email Address:</td><td>${app.email}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Institution:</td><td>${app.college} (${app.pursuingYear})</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Experience:</td><td>${app.experienceLevel}</td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Internship Role:</td><td><strong>${app.internshipRole}</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #64748b;">Submitted At:</td><td>${app.submittedAt}</td></tr>
  </table>
  <div style="margin-top: 20px;">
    <a href="${frontendUrl}/admin/applications/${app.applicationId}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin Center</a>
  </div>
</div>`,
      };

    case 'status_update':
      return {
        subject: `Application Update: ${app.status} — ${app.internshipRole} Internship`,
        text: `Dear ${app.fullName},

Your Company Tech internship application is now in the following stage: ${app.status}.

Application ID: ${app.applicationId}
Position: ${app.internshipRole}
Tracking Portal: ${trackUrl}

Our team will reach out with the next step when required.

Regards,
HR Support and Admissions
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #2563eb; font-weight: 600;">APPLICATION UPDATE</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">Your internship application for <strong>${app.internshipRole}</strong> is now in the <strong>${app.status}</strong> stage.</p>
  <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 13px; color: #1d4ed8; font-weight: 600; margin-bottom: 6px;">Application Reference</div>
    <div style="font-size: 18px; font-weight: 700; color: #0f172a; font-family: monospace;">${app.applicationId}</div>
  </div>
  <p style="font-size: 14px; line-height: 1.5; color: #475569;">You can review the latest status and any next steps through the candidate tracking portal.</p>
  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">View Status</a>
  </p>
</div>`,
      };

    case 'interview_invite':
      const scheduledInterview = [...(app.interviews || [])]
        .filter((interview) => interview.status === 'Scheduled')
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
      const interviewDate = scheduledInterview && Number.isFinite(Date.parse(scheduledInterview.scheduledAt))
        ? `${new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }).format(new Date(scheduledInterview.scheduledAt))} IST`
        : 'To be confirmed';
      const interviewDetailsText = scheduledInterview
        ? `\nInterview Details:\n- Type: ${scheduledInterview.interviewType}\n- Date and time: ${interviewDate}\n- Duration: ${scheduledInterview.durationMinutes} minutes\n- Mode: ${scheduledInterview.mode}${scheduledInterview.location ? `\n- Location: ${scheduledInterview.location}` : ''}${scheduledInterview.interviewerName ? `\n- Interviewer: ${scheduledInterview.interviewerName}` : ''}${scheduledInterview.notes ? `\n- Notes: ${scheduledInterview.notes}` : ''}\n`
        : '';
      const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      })[character] || character);
      const interviewDetailsHtml = scheduledInterview
        ? `<div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;margin:20px 0;color:#1e3a8a;">
  <strong>Interview Details</strong>
  <ul style="font-size:14px;line-height:1.7;padding-left:20px;margin-bottom:0;">
    <li><strong>Type:</strong> ${escapeHtml(scheduledInterview.interviewType)}</li>
    <li><strong>Date and time:</strong> ${escapeHtml(interviewDate)}</li>
    <li><strong>Duration:</strong> ${scheduledInterview.durationMinutes} minutes</li>
    <li><strong>Mode:</strong> ${escapeHtml(scheduledInterview.mode)}</li>
    ${scheduledInterview.location ? `<li><strong>Location:</strong> ${escapeHtml(scheduledInterview.location)}</li>` : ''}
    ${scheduledInterview.interviewerName ? `<li><strong>Interviewer:</strong> ${escapeHtml(scheduledInterview.interviewerName)}</li>` : ''}
    ${scheduledInterview.notes ? `<li><strong>Notes:</strong> ${escapeHtml(scheduledInterview.notes)}</li>` : ''}
  </ul>
</div>`
        : '';
      return {
        subject: `Interview Invitation: ${app.internshipRole} Internship — Company Tech`,
        text: `Dear ${app.fullName},

You have been shortlisted for the ${app.internshipRole} internship and your interview has been scheduled.
${interviewDetailsText}

Please review the tracking portal for the latest interview details and next steps.

Tracking Portal: ${trackUrl}

Regards,
HR Support and Admissions
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #2563eb; font-weight: 600;">INTERVIEW INVITATION</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">You have been shortlisted for the <strong>${app.internshipRole}</strong> internship. An interview has been scheduled for the next stage of the selection process.</p>
  ${interviewDetailsHtml}
  <p style="font-size: 14px; line-height: 1.5; color: #475569;">Please review your application tracking portal for the interview timing, format, and any preparation notes.</p>
  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">View Interview Details</a>
  </p>
</div>`,
      };

    case 'acceptance_offer':
      return {
        subject: `Congratulations! Internship Offer from Company Tech — ${app.internshipRole}`,
        text: `Dear ${app.fullName},

Congratulations! Following a comprehensive review of your application, Company Tech is pleased to offer you the ${app.internshipRole} internship.

Key Particulars:
- Role: ${app.internshipRole}
- Duration: ${app.internshipDuration || '1 month'}
- Joining Date: ${app.joiningDate || 'As agreed'}
- Application Reference: ${app.applicationId}

Your official Internship Offer Letter PDF has been generated and attached to this email. You can also view or download it at any time from your tracking portal:
${trackUrl}

Please review the attached offer letter for complete instructions.

Sincerely,
HR Support and Co-Founder
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #16a34a; font-weight: 600;">INTERNSHIP OFFER EXTENDED</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.5;">Congratulations! We are delighted to inform you that you have been selected for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0; color: #166534;">
    <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">Internship Particulars:</div>
    <div style="font-size: 13px; line-height: 1.6;">
      • <strong>Role:</strong> ${app.internshipRole}<br />
      • <strong>Duration:</strong> ${app.internshipDuration || '1 month'}<br />
      • <strong>Joining Date:</strong> ${app.joiningDate || 'As agreed'}<br />
      • <strong>Application Reference:</strong> ${app.applicationId}
    </div>
  </div>

  <p style="font-size: 14px; line-height: 1.5; color: #475569;">
    Your official <strong>Internship Offer Letter PDF</strong> has been generated and attached to this message. You can also view or download it at any time from your tracking portal.
  </p>

  <p style="margin: 20px 0;">
    <a href="${trackUrl}" style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">View in Candidate Portal</a>
  </p>

  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Sincerely,<br />
    <strong>HR Support and Co-Founder</strong><br />
    Company Tech
  </p>
</div>`,
      };

    case 'rejection_notice':
      return {
        subject: `Update on Your Internship Application — Company Tech`,
        text: `Dear ${app.fullName},

Thank you for applying for the ${app.internshipRole} internship at Company Tech.

We appreciate the time and effort you invested in your application. After reviewing your application, we regret to inform you that we are unable to proceed with your application at this time.

Thank you for your interest in Company Tech. We wish you the best in your academic and professional journey.

Regards,  
HR Support and Co-Founder  
Company Tech`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #0f172a; font-size: 20px;">COMPANY TECH</h2>
    <span style="font-size: 12px; color: #64748b; font-weight: 600;">APPLICATION STATUS UPDATE</span>
  </div>
  <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${app.fullName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.6;">Thank you for applying for the <strong>${app.internshipRole}</strong> internship at Company Tech.</p>
  <p style="font-size: 15px; line-height: 1.6;">We appreciate the time and effort you invested in your application. After reviewing your application, we regret to inform you that we are unable to proceed with your application at this time.</p>
  <p style="font-size: 15px; line-height: 1.6;">Thank you for your interest in Company Tech. We wish you the best in your academic and professional journey.</p>
  <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    Regards,<br />
    <strong>HR Support and Co-Founder</strong><br />
    Company Tech
  </p>
  <div style="font-size: 11px; color: #94a3b8; margin-top: 16px;">
    Note: This is a demonstration notification template configured for Company Tech's prototype system.
  </div>
</div>`,
      };
  }
}

/**
 * Dispatches an email via Resend API or logs clear failure if unconfigured.
 * Never prints or leaks secrets, and masks recipient email addresses in logs.
 */
export async function sendEmailJob(
  type: EmailType,
  app: ApplicationRecord,
  trackingToken?: string,
  pdfAttachmentBuffer?: Buffer
): Promise<EmailSendResult> {
  const { provider, apiKey, emailFrom, supportEmail, smtp } = getEmailConfig();
  const { subject, html, text } = renderEmailTemplate(type, app, trackingToken);
  const recipient = type === 'support_notification' ? supportEmail : app.email;
  const masked = maskEmail(recipient);

  console.log(`[Email Dispatch] Triggering ${type} for app ${app.applicationId} -> ${masked}`);

  const hasValidKey = apiKey && apiKey.startsWith('re_') && apiKey !== 're_sample_api_key_here';
  const hasSmtpConfig = !!(smtp.host && smtp.user && smtp.pass);

  if (provider === 'smtp') {
    if (!hasSmtpConfig) {
      const errorMsg = 'SMTP is enabled but SMTP_HOST, SMTP_USER, and SMTP_PASS are missing or incomplete.';
      console.warn(`[Email Dispatch WARNING] ${errorMsg}`);
      return {
        status: 'failed',
        errorMessage: errorMsg,
      };
    }

    if (!hasValidSmtpHost(smtp.host)) {
      const errorMsg = 'SMTP is enabled, but SMTP_HOST is invalid. Use a hostname such as smtp.gmail.com or smtp.resend.com, not an email address.';
      console.error(`[Email Dispatch ERROR] ${errorMsg}`);
      return {
        status: 'failed',
        errorMessage: errorMsg,
      };
    }

    try {
      const transporter = createSmtpTransporter();
      const verification = await verifySmtpConnection();

      if (!verification.ok) {
        console.error(`[Email Dispatch ERROR] SMTP verification failed for ${masked}: ${verification.errorCode || 'SMTP_VERIFY_FAILED'} - ${verification.message}`);
        return {
          status: 'failed',
          errorMessage: verification.message,
        };
      }

      const info = await transporter.sendMail({
        from: smtp.from || emailFrom,
        to: recipient,
        subject,
        text,
        html,
        ...(pdfAttachmentBuffer && type === 'acceptance_offer'
          ? {
              attachments: [{
                filename: `Company-Tech-Offer-Letter-${app.applicationId}.pdf`,
                content: pdfAttachmentBuffer,
                contentType: 'application/pdf',
              }],
            }
          : {}),
      });

      console.log(`[Email Dispatch SUCCESS] SMTP provider accepted ${type} for ${masked}. Message ID: ${info.messageId}`);
      return {
        status: 'sent',
        providerMessageId: info.messageId,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown SMTP delivery failure';
      console.error(`[Email Dispatch ERROR] SMTP submission failed for ${masked}:`, errMsg);
      return {
        status: 'failed',
        errorMessage: errMsg,
      };
    }
  }

  if (!hasValidKey) {
    const errorMsg = 'No valid email provider was configured. Add EMAIL_PROVIDER_API_KEY (Resend) or SMTP credentials in your environment.';
    console.warn(`[Email Dispatch WARNING] ${errorMsg}`);
    return {
      status: 'failed',
      errorMessage: errorMsg,
    };
  }

  try {
    const payload: Record<string, unknown> = {
      from: emailFrom,
      to: [recipient],
      subject,
      html,
      text,
    };

    if (pdfAttachmentBuffer && type === 'acceptance_offer') {
      payload.attachments = [
        {
          filename: `Company-Tech-Offer-Letter-${app.applicationId}.pdf`,
          content: pdfAttachmentBuffer.toString('base64'),
        },
      ];
      console.log(`[Email Dispatch] Attached PDF offer letter (${pdfAttachmentBuffer.length} bytes) to ${type}`);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      let parsedError = errBody;
      try {
        const jsonErr = JSON.parse(errBody);
        parsedError = jsonErr.message || errBody;
      } catch {
        // ignore
      }

      console.error(`[Email Dispatch ERROR] Provider returned HTTP ${response.status} for ${masked}: ${parsedError}`);
      return {
        status: 'failed',
        errorMessage: `Provider HTTP ${response.status}: ${parsedError}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    const providerMessageId = data.id || `resend_${Date.now()}`;
    console.log(`[Email Dispatch SUCCESS] Resend accepted ${type} for ${masked}. Message ID: ${providerMessageId}`);

    return {
      status: 'sent',
      providerMessageId,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown network failure communicating with email provider';
    console.error(`[Email Dispatch ERROR] Network exception for ${masked}:`, errMsg);
    return {
      status: 'failed',
      errorMessage: errMsg,
    };
  }
}
