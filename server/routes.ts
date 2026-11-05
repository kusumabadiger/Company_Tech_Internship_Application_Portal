import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import { DB, generateApplicationId, generateTrackingToken, hashToken } from './db';
import { generateOfferLetterPdf } from './pdf';
import { sendEmailJob, renderEmailTemplate, getEmailConfig, verifySmtpConnection } from './email';
import { requireAdminAuth, requireVerifiedUserAuth } from './firebaseAdmin';
import { ApplicationRecord, EmailJobRecord, ExperienceLevel } from './types';

const router = express.Router();
router.use('/admin', requireAdminAuth);

const VALID_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Intern',
  'Social Media Manager',
  'Content Writer',
  'Business Development Intern',
  'Community Manager',
  'HR Intern',
];

const VALID_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate / Postgraduate',
];

const isValidEmail = (value: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

/**
 * Public: Submit a new internship application
 */
router.post('/applications', requireVerifiedUserAuth, async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      college,
      pursuingYear,
      experienceLevel,
      internshipRole,
      resumeBase64,
      resumeName,
    } = req.body;

    const firebaseUser = (req as { firebaseUser?: { email?: string } }).firebaseUser;
    const signedInEmail = firebaseUser?.email?.trim().toLowerCase();
    const submittedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (signedInEmail && submittedEmail && signedInEmail !== submittedEmail) {
      return res.status(403).json({ error: 'Application email must match your verified Firebase account email.' });
    }

    // Server-side validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0 || fullName.length > 100) {
      return res.status(400).json({ error: 'Full name is required (max 100 characters).' });
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email) || email.trim().length > 120) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!college || typeof college !== 'string' || college.trim().length === 0 || college.length > 150) {
      return res.status(400).json({ error: 'College or institution name is required (max 150 characters).' });
    }

    if (!VALID_YEARS.includes(pursuingYear)) {
      return res.status(400).json({ error: 'Please select a valid current year of study.' });
    }

    if (experienceLevel !== 'Fresher' && experienceLevel !== 'Experienced') {
      return res.status(400).json({ error: 'Experience level must be either Fresher or Experienced.' });
    }

    if (!VALID_ROLES.includes(internshipRole)) {
      return res.status(400).json({ error: 'Please select a valid Company Tech internship role.' });
    }

    // Optional resume validation: check size (< 5MB)
    if (resumeBase64 && typeof resumeBase64 === 'string') {
      const approxSizeBytes = (resumeBase64.length * 3) / 4;
      if (approxSizeBytes > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Resume file size exceeds the 5 MB limit.' });
      }
    }

    // Generate unique ID & secure tracking token
    const applicationId = generateApplicationId();
    const trackingToken = generateTrackingToken();
    const trackingTokenHash = hashToken(trackingToken);
    const submittedAt = new Date().toISOString();

    const newApp: ApplicationRecord = {
      applicationId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      college: college.trim(),
      pursuingYear,
      experienceLevel: experienceLevel as ExperienceLevel,
      internshipRole,
      resumeName: resumeName ? String(resumeName).substring(0, 100) : null,
      resumePath: resumeBase64 ? `resumes/${applicationId}/${resumeName || 'resume.pdf'}` : null,
      resumeBase64: resumeBase64 || null,
      submittedAt,
      status: 'Pending',
      statusHistory: [
        {
          id: `evt_${applicationId}_${Date.now()}`,
          status: 'Pending',
          label: 'Application Submitted',
          note: 'Application successfully registered and awaiting review.',
          changedAt: submittedAt,
          changedBy: 'system',
        },
      ],
      interviews: [],
      trackingToken,
      trackingTokenHash,
      schemaVersion: 1,
      emailJobs: [],
    };

    // Save to database
    DB.save(newApp);

    // Trigger Email A: Applicant confirmation
    const applicantJobId = `job_conf_${Date.now()}`;
    const applicantSendResult = await sendEmailJob('applicant_confirmation', newApp, trackingToken);
    const applicantJob: EmailJobRecord = {
      jobId: applicantJobId,
      applicationId,
      emailType: 'applicant_confirmation',
      recipient: newApp.email,
      status: applicantSendResult.status,
      attemptCount: 1,
      providerMessageId: applicantSendResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: applicantSendResult.errorMessage,
    };
    DB.addEmailJob(applicantJob);

    // Trigger Email B: Support notification
    const supportJobId = `job_notif_${Date.now()}`;
    const supportSendResult = await sendEmailJob('support_notification', newApp);
    const supportJob: EmailJobRecord = {
      jobId: supportJobId,
      applicationId,
      emailType: 'support_notification',
      recipient: getEmailConfig().supportEmail,
      status: supportSendResult.status,
      attemptCount: 1,
      providerMessageId: supportSendResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: supportSendResult.errorMessage,
    };
    DB.addEmailJob(supportJob);

    return res.status(201).json({
      success: true,
      applicationId,
      trackingToken,
      internshipRole,
      status: 'Pending',
      submittedAt,
      message: 'Application successfully registered with Company Tech.',
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    return res.status(500).json({ error: 'Internal server error while processing your application.' });
  }
});

/**
 * Return the signed-in applicant's own application history only.
 * New submissions are bound to the verified Firebase account email above.
 */
router.get('/applications/mine', requireVerifiedUserAuth, (req: Request, res: Response) => {
  const firebaseUser = (req as Request & { firebaseUser?: { email?: string } }).firebaseUser;
  const email = firebaseUser?.email?.trim().toLowerCase();
  if (!email) {
    return res.status(403).json({ error: 'A verified account email is required to view application history.' });
  }

  const applications = DB.getAll()
    .filter((app) => app.email.trim().toLowerCase() === email)
    .map((app) => ({
      applicationId: app.applicationId,
      internshipRole: app.internshipRole,
      status: app.status,
      submittedAt: app.submittedAt,
      trackingToken: app.trackingToken || null,
    }));

  return res.json({ applications });
});

/**
 * Public: Secure applicant tracking
 * Strict security per PRD Section 15: requires valid Application ID AND secret tracking token.
 */
router.post('/applications/track', (req: Request, res: Response) => {
  const { applicationId, token } = req.body;

  if (!applicationId || !token) {
    return res.status(400).json({
      error: 'Both Application Reference ID and your secure Tracking Token are required to check status.',
    });
  }

  const app = DB.getByToken(String(applicationId).trim(), String(token).trim());

  if (!app) {
    return res.status(404).json({
      error: 'No application was found matching this Application ID and Tracking Token combination. Please verify your credentials.',
    });
  }

  // Section 15.3: Return only minimal needed info without exposing private resume, admin notes, or internal secrets
  return res.json({
    applicationId: app.applicationId,
    fullName: app.fullName,
    internshipRole: app.internshipRole,
    submissionDate: app.submittedAt,
    status: app.status,
    statusHistory: app.statusHistory || [],
    interviews: app.interviews || [],
    decisionDate: app.decisionAt || null,
    joiningDate: app.joiningDate || null,
    internshipDuration: app.internshipDuration || null,
    offerLetterAvailable: app.status === 'Accepted' && app.offerLetterGenerationStatus === 'generated',
    offerLetterUrl:
      app.status === 'Accepted' && app.offerLetterGenerationStatus === 'generated'
        ? `/api/applications/${app.applicationId}/offer-letter?token=${encodeURIComponent(token)}`
        : null,
  });
});

/**
 * Admin: Get all applications with filters, search, and real stats
 */
router.get('/admin/applications', (req: Request, res: Response) => {
  try {
    const { search, status, role } = req.query;
    let list = DB.getAll();

    if (status && status !== 'all') {
      list = list.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
    }

    if (role && role !== 'all') {
      list = list.filter((a) => a.internshipRole === String(role));
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.applicationId.toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.college.toLowerCase().includes(q)
      );
    }

    const stats = DB.getStats();

    return res.json({
      stats,
      applications: list,
    });
  } catch (err) {
    console.error('Error fetching admin applications:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
});

/**
 * Admin: Get single application details
 */
router.get('/admin/applications/:id', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  return res.json(app);
});

/**
 * Admin: Update stage in the candidate pipeline
 */
router.post('/admin/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['Pending', 'Screening', 'Interview Scheduled', 'Interview Completed', 'Accepted', 'Rejected'];
    const nextStatus = typeof status === 'string' ? status : '';
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: 'A valid application stage is required.' });
    }

    const app = DB.getById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const result = DB.updateStatus(req.params.id, nextStatus as any, 'admin_auth_user', typeof note === 'string' ? note : undefined);
    if (!result.success || !result.app) {
      return res.status(409).json({ error: result.error || 'Failed to update application status.' });
    }

    const statusJobResult = await sendEmailJob('status_update', result.app, result.app.trackingToken);
    const statusEmailJob: EmailJobRecord = {
      jobId: `job_status_${Date.now()}`,
      applicationId: result.app.applicationId,
      emailType: 'status_update',
      recipient: result.app.email,
      status: statusJobResult.status,
      attemptCount: 1,
      providerMessageId: statusJobResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: statusJobResult.errorMessage,
    };
    DB.addEmailJob(statusEmailJob);

    const statusEmailMessage = statusJobResult.status === 'failed'
      ? `Application status updated to ${nextStatus}, but the applicant email was not sent: ${statusJobResult.errorMessage || 'Email provider failed.'} Retry it from the email dispatch logs after fixing the provider configuration.`
      : `Application status updated to ${nextStatus}, and the applicant email was sent.`;

    return res.json({
      success: true,
      emailSent: statusJobResult.status !== 'failed',
      application: DB.getById(req.params.id),
      emailError: statusJobResult.errorMessage,
      message: statusEmailMessage,
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ error: 'Internal server error while updating application status.' });
  }
});

router.post('/admin/applications/:id/interviews', async (req: Request, res: Response) => {
  try {
    const { interviewType, scheduledAt, durationMinutes, mode, location, interviewerName, notes } = req.body;

    const allowedTypes = ['Phone Screen', 'Technical Interview', 'HR Interview', 'Panel Interview'];
    const allowedModes = ['Online', 'On-site', 'Hybrid'];

    if (!allowedTypes.includes(interviewType)) {
      return res.status(400).json({ error: 'Please select a valid interview type.' });
    }
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
      return res.status(400).json({ error: 'A valid interview date and time are required.' });
    }
    if (!allowedModes.includes(mode)) {
      return res.status(400).json({ error: 'Please select a valid interview mode.' });
    }

    const app = DB.getById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const result = DB.scheduleInterview(
      req.params.id,
      {
        interviewType,
        scheduledAt,
        durationMinutes: Number(durationMinutes) || 45,
        mode,
        location: typeof location === 'string' ? location : null,
        interviewerName: typeof interviewerName === 'string' ? interviewerName : null,
        notes: typeof notes === 'string' ? notes : null,
      },
      'admin_auth_user'
    );

    if (!result.success || !result.app) {
      return res.status(409).json({ error: result.error || 'Failed to schedule interview.' });
    }

    const inviteResult = await sendEmailJob('interview_invite', result.app, result.app.trackingToken);
    const inviteJob: EmailJobRecord = {
      jobId: `job_interview_${Date.now()}`,
      applicationId: result.app.applicationId,
      emailType: 'interview_invite',
      recipient: result.app.email,
      status: inviteResult.status,
      attemptCount: 1,
      providerMessageId: inviteResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: inviteResult.errorMessage,
    };
    DB.addEmailJob(inviteJob);

    const inviteMessage = inviteResult.status === 'failed'
      ? `Interview scheduled, but the applicant was not emailed: ${inviteResult.errorMessage || 'Email provider failed.'} Retry it from the email dispatch logs after fixing the provider configuration.`
      : 'Interview scheduled and the applicant email was sent.';

    return res.json({
      success: true,
      emailSent: inviteResult.status !== 'failed',
      application: DB.getById(req.params.id),
      emailError: inviteResult.errorMessage,
      message: inviteMessage,
    });
  } catch (err) {
    console.error('Error scheduling interview:', err);
    return res.status(500).json({ error: 'Internal server error while scheduling interview.' });
  }
});

/**
 * Admin: Accept application workflow
 * Concurrency safe, requires duration & joining date (not in past), generates PDF, sends email
 */
router.post('/admin/applications/:id/accept', async (req: Request, res: Response) => {
  try {
    const { duration, joiningDate } = req.body;

    const allowedDurations = ['1 month', '2 months', '3 months'];
    if (!allowedDurations.includes(duration)) {
      return res.status(400).json({ error: 'Please specify a duration: 1 month, 2 months, or 3 months.' });
    }

    if (!joiningDate || isNaN(Date.parse(joiningDate))) {
      return res.status(400).json({ error: 'A valid joining date is required.' });
    }

    // Joining date validation: must not be in past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(joiningDate);
    if (targetDate < today) {
      return res.status(400).json({ error: 'Joining date cannot be set in the past.' });
    }

    const current = DB.getById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    if (current.status !== 'Pending') {
      return res.status(409).json({
        error: `Cannot accept: Application has already been finalized as '${current.status}'.`,
      });
    }

    // Generate real PDF offer letter using pdf-lib
    const tempAppForPdf = {
      ...current,
      status: 'Accepted' as const,
      internshipDuration: duration,
      joiningDate,
    };

    let pdfBuffer: Buffer | null = null;
    let pdfBase64 = '';
    try {
      pdfBuffer = await generateOfferLetterPdf(tempAppForPdf);
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfErr) {
      console.error('Error generating PDF offer letter:', pdfErr);
      return res.status(500).json({ error: 'Failed to generate PDF offer letter.' });
    }

    // Commit decision in database atomically
    const decisionResult = DB.makeDecision(req.params.id, 'Accepted', 'admin_auth_user', {
      internshipDuration: duration,
      joiningDate,
      offerLetterBase64: pdfBase64,
    });

    if (!decisionResult.success || !decisionResult.app) {
      return res.status(409).json({ error: decisionResult.error || 'Failed to record acceptance.' });
    }

    const updatedApp = decisionResult.app;

    // Dispatch acceptance email with offer letter PDF attached
    const acceptanceJobId = `job_offer_${Date.now()}`;
    const emailResult = await sendEmailJob('acceptance_offer', updatedApp, undefined, pdfBuffer);

    const emailJob: EmailJobRecord = {
      jobId: acceptanceJobId,
      applicationId: updatedApp.applicationId,
      emailType: 'acceptance_offer',
      recipient: updatedApp.email,
      status: emailResult.status,
      attemptCount: 1,
      providerMessageId: emailResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: emailResult.errorMessage,
    };
    DB.addEmailJob(emailJob);

    if (emailResult.status === 'failed') {
      console.warn(`[Acceptance Workflow] Candidate ${updatedApp.applicationId} accepted, but acceptance email delivery failed: ${emailResult.errorMessage}`);
      return res.json({
        success: true,
        emailSent: false,
        application: DB.getById(req.params.id),
        emailError: emailResult.errorMessage,
        message: `Candidate accepted and offer letter PDF generated. Notice: Acceptance email failed: ${emailResult.errorMessage}`,
      });
    }

    console.log(`[Acceptance Workflow] Candidate ${updatedApp.applicationId} accepted and acceptance email dispatched. Provider Message ID: ${emailResult.providerMessageId}`);
    return res.json({
      success: true,
      emailSent: true,
      application: DB.getById(req.params.id),
      message: 'Application accepted and offer letter dispatched to applicant successfully.',
    });
  } catch (err) {
    console.error('Error accepting application:', err);
    return res.status(500).json({ error: 'Internal server error during acceptance workflow.' });
  }
});

/**
 * Route Alias: POST /api/applications/accept
 * Supports callers targeting /api/applications/accept with { id, applicationId, duration, joiningDate }
 */
router.post('/applications/accept', requireAdminAuth, async (req: Request, res: Response) => {
  const targetId = req.body.id || req.body.applicationId;
  if (!targetId) {
    return res.status(400).json({ error: 'Application ID is required in request body.' });
  }
  req.params.id = String(targetId);
  // Forward to standard accept logic
  const acceptHandler = (router as any).stack.find(
    (layer: any) => layer.route && layer.route.path === '/admin/applications/:id/accept' && layer.route.methods.post
  );
  if (acceptHandler) {
    return acceptHandler.route.stack[0].handle(req, res);
  }
  return res.status(500).json({ error: 'Internal routing error' });
});

/**
 * Admin: Reject application workflow
 * Concurrency safe, records rejection and dispatches demonstration template email
 */
router.post('/admin/applications/:id/reject', async (req: Request, res: Response) => {
  try {
    const current = DB.getById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    if (current.status !== 'Pending') {
      return res.status(409).json({
        error: `Cannot reject: Application is already marked as '${current.status}'.`,
      });
    }

    const decisionResult = DB.makeDecision(req.params.id, 'Rejected', 'admin_auth_user');

    if (!decisionResult.success || !decisionResult.app) {
      return res.status(409).json({ error: decisionResult.error || 'Failed to record rejection.' });
    }

    const updatedApp = decisionResult.app;

    // Dispatch rejection email
    const rejectionJobId = `job_rej_${Date.now()}`;
    const emailResult = await sendEmailJob('rejection_notice', updatedApp);

    const emailJob: EmailJobRecord = {
      jobId: rejectionJobId,
      applicationId: updatedApp.applicationId,
      emailType: 'rejection_notice',
      recipient: updatedApp.email,
      status: emailResult.status,
      attemptCount: 1,
      providerMessageId: emailResult.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: emailResult.errorMessage,
    };
    DB.addEmailJob(emailJob);

    const deliveryMessage = emailResult.status === 'failed'
      ? `Application marked as Rejected, but the rejection email was not sent: ${emailResult.errorMessage || 'Email provider failed.'} Retry it from the email dispatch logs after fixing the provider configuration.`
      : 'Application marked as Rejected and the rejection email was sent to the applicant.';

    return res.json({
      success: true,
      emailSent: emailResult.status !== 'failed',
      application: DB.getById(req.params.id),
      emailError: emailResult.errorMessage,
      message: deliveryMessage,
    });
  } catch (err) {
    console.error('Error rejecting application:', err);
    return res.status(500).json({ error: 'Internal server error during rejection workflow.' });
  }
});

/**
 * Admin: Retry an eligible failed email job
 */
router.post('/admin/applications/:id/send-offer-letter', async (req: Request, res: Response) => {
  try {
    const app = DB.getById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    if (app.status !== 'Accepted') {
      return res.status(409).json({ error: 'An offer letter can only be emailed after the application is accepted.' });
    }

    let pdfBuffer: Buffer;
    if (app.offerLetterBase64) {
      pdfBuffer = Buffer.from(app.offerLetterBase64, 'base64');
    } else {
      pdfBuffer = await generateOfferLetterPdf(app);
      app.offerLetterBase64 = pdfBuffer.toString('base64');
      app.offerLetterGenerationStatus = 'generated';
      app.offerLetterGeneratedAt = app.offerLetterGeneratedAt || new Date().toISOString();
      DB.save(app);
    }

    const result = await sendEmailJob('acceptance_offer', app, undefined, pdfBuffer);
    const job: EmailJobRecord = {
      jobId: `job_offer_resend_${Date.now()}`,
      applicationId: app.applicationId,
      emailType: 'acceptance_offer',
      recipient: app.email,
      status: result.status,
      attemptCount: 1,
      providerMessageId: result.providerMessageId,
      createdAt: new Date().toISOString(),
      errorMessage: result.errorMessage,
    };
    DB.addEmailJob(job);

    const message = result.status === 'failed'
      ? `Offer letter email was not sent: ${result.errorMessage || 'Email provider failed.'}`
      : 'Offer letter PDF was emailed to the applicant.';
    return res.json({
      success: result.status !== 'failed',
      emailSent: result.status !== 'failed',
      emailError: result.errorMessage,
      application: DB.getById(req.params.id),
      message,
    });
  } catch (err) {
    console.error('Error sending offer letter email:', err);
    return res.status(500).json({ error: 'Failed to send the offer letter email.' });
  }
});

/**
 * Admin: Retry an eligible failed email job
 */
router.post('/admin/email-jobs/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const all = DB.getAll();
    let targetJob: EmailJobRecord | null = null;
    let targetApp: ApplicationRecord | null = null;

    for (const app of all) {
      const match = app.emailJobs?.find((j) => j.jobId === req.params.jobId);
      if (match) {
        targetJob = match;
        targetApp = app;
        break;
      }
    }

    if (!targetJob || !targetApp) {
      return res.status(404).json({ error: 'Email job not found.' });
    }

    let pdfBuffer: Buffer | undefined;
    if (targetJob.emailType === 'acceptance_offer' && targetApp.offerLetterBase64) {
      pdfBuffer = Buffer.from(targetApp.offerLetterBase64, 'base64');
    }

    const result = await sendEmailJob(targetJob.emailType, targetApp, undefined, pdfBuffer);

    targetJob.attemptCount += 1;
    targetJob.status = result.status;
    targetJob.lastAttemptAt = new Date().toISOString();
    targetJob.providerMessageId = result.providerMessageId;
    targetJob.errorMessage = result.errorMessage;

    DB.addEmailJob(targetJob);

    return res.json({
      success: true,
      job: targetJob,
      message: `Email job retried. Status is now ${result.status}.`,
    });
  } catch (err) {
    console.error('Error retrying email job:', err);
    return res.status(500).json({ error: 'Failed to retry email job.' });
  }
});

/**
 * Admin: Preview rendered email template
 */
router.get('/admin/applications/:id/email-preview/:emailType', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  const emailType = req.params.emailType as any;
  const rendered = renderEmailTemplate(emailType, app, app.trackingToken);
  return res.json({
    emailType,
    recipient: emailType === 'support_notification' ? getEmailConfig().supportEmail : app.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
});

async function sendOfferLetterResponse(app: ApplicationRecord, res: Response, token?: string) {
  if (app.status !== 'Accepted' || app.offerLetterGenerationStatus !== 'generated') {
    return res.status(404).send('Offer letter is not available for this application.');
  }

  if (token) {
    const valid = DB.getByToken(app.applicationId, token);
    if (!valid) {
      return res.status(403).send('Unauthorized access to this offer letter.');
    }
  }

  let pdfBuffer: Buffer;
  if (app.offerLetterBase64) {
    pdfBuffer = Buffer.from(app.offerLetterBase64, 'base64');
  } else {
    pdfBuffer = await generateOfferLetterPdf(app);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Company-Tech-Offer-Letter-${app.applicationId}.pdf"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(pdfBuffer);
}

/**
 * Public applicant download for a validated tracking token.
 */
router.get('/applications/:id/offer-letter', async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).send('Application not found.');
  }

  if (!token) {
    return res.status(401).send('A valid tracking token is required to access the offer letter.');
  }

  return sendOfferLetterResponse(app, res, token);
});

/**
 * Admin download of the generated offer letter PDF.
 */
router.get('/admin/applications/:id/offer-letter', async (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).send('Application not found.');
  }

  return sendOfferLetterResponse(app, res);
});

function resolveResumeFileIfExists(app: ApplicationRecord): string | null {
  if (!app.resumePath) return null;

  const candidate = path.resolve(process.cwd(), app.resumePath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  const fallback = path.resolve(process.cwd(), 'uploads', 'resumes', app.applicationId, app.resumeName || 'resume.pdf');
  if (fs.existsSync(fallback) && fs.statSync(fallback).isFile()) {
    return fallback;
  }

  return null;
}

function getResumeMimeType(fileName?: string | null, fallbackMimeType?: string | null): string {
  const normalizedName = (fileName || '').toLowerCase();
  const mimeType = (fallbackMimeType || '').toLowerCase();

  if (normalizedName.endsWith('.pdf') || mimeType.includes('pdf')) {
    return 'application/pdf';
  }
  if (normalizedName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (normalizedName.endsWith('.doc') || mimeType.includes('msword')) {
    return 'application/msword';
  }
  if (normalizedName.endsWith('.rtf') || mimeType.includes('rtf')) {
    return 'application/rtf';
  }
  if (normalizedName.endsWith('.txt') || mimeType.includes('text/plain')) {
    return 'text/plain';
  }

  return fallbackMimeType || 'application/octet-stream';
}

/**
 * Download or view uploaded resume
 */
router.get('/admin/applications/:id/resume', (req: Request, res: Response) => {
  const app = DB.getById(req.params.id);
  if (!app) {
    return res.status(404).send('Application not found.');
  }

  const filePath = resolveResumeFileIfExists(app);
  if (filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getResumeMimeType(app.resumeName, 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${app.resumeName || path.basename(filePath)}"`);
    return res.send(fileBuffer);
  }

  if (!app.resumeBase64) {
    return res.status(404).send('Resume not found or was not uploaded with this application.');
  }

  const dataUriMatch = app.resumeBase64.match(/^data:([^;,]+)(?:;charset=[^;,]+)?(?:;base64)?,(.+)$/i);
  if (dataUriMatch && dataUriMatch.length >= 3) {
    const contentType = getResumeMimeType(app.resumeName, dataUriMatch[1]);
    const dataBuffer = Buffer.from(dataUriMatch[2], 'base64');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${app.resumeName || 'resume.pdf'}"`);
    return res.send(dataBuffer);
  }

  try {
    const dataBuffer = Buffer.from(app.resumeBase64, 'base64');
    const contentType = getResumeMimeType(app.resumeName, 'application/pdf');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${app.resumeName || 'resume.pdf'}"`);
    return res.send(dataBuffer);
  } catch {
    return res.status(400).send('The stored resume is not a valid base64 document.');
  }
});

/**
 * Admin: Send a test email
 */
router.post('/admin/send-test-email', async (req: Request, res: Response) => {
  const { recipient } = req.body;
  const testApp: ApplicationRecord = {
    applicationId: 'CT-TEST-0001',
    fullName: 'Test Candidate',
    email: recipient || 'test@example.com',
    college: 'Demonstration University',
    pursuingYear: '4th Year',
    experienceLevel: 'Fresher',
    internshipRole: 'Frontend Developer',
    submittedAt: new Date().toISOString(),
    status: 'Pending',
    trackingToken: 'test_token_123',
    schemaVersion: 1,
    emailJobs: [],
  };

  const result = await sendEmailJob('applicant_confirmation', testApp, 'test_token_123');
  return res.json({
    success: result.status === 'sent' || result.status === 'delivered',
    result,
  });
});

/**
 * Admin: lightweight SMTP diagnostics without exposing secrets.
 */
router.get('/admin/email-smtp-status', async (_req: Request, res: Response) => {
  const result = await verifySmtpConnection();
  return res.json({
    ok: result.ok,
    host: result.host,
    secure: result.secure,
    user: result.userMasked,
    errorCode: result.errorCode || null,
    message: result.message,
  });
});

/**
 * System health
 */
router.get('/system/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    stats: DB.getStats(),
    organization: 'Company Tech',
  });
});

export default router;
