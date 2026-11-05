import { auth } from '../config/firebase';
import { Application, DashboardStats, TrackingResult, EmailJob, UserApplicationHistoryEntry } from '../types';

async function withTokenHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const authHeaders = new Headers(headers);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Your Firebase session is not available. Please sign in again and try once the page has finished loading.');
  }

  const token = await currentUser.getIdToken();
  authHeaders.set('Authorization', `Bearer ${token}`);

  return authHeaders;
}

async function withAdminAuthHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  return withTokenHeader(headers);
}

export interface SubmitApplicationPayload {
  fullName: string;
  email: string;
  college: string;
  pursuingYear: string;
  experienceLevel: 'Fresher' | 'Experienced';
  internshipRole: string;
  resumeBase64?: string | null;
  resumeName?: string | null;
}

export interface SubmitResponse {
  success: boolean;
  applicationId: string;
  trackingToken: string;
  internshipRole: string;
  status: string;
  submittedAt: string;
  message: string;
}

export const API = {
  async getMyApplications(): Promise<UserApplicationHistoryEntry[]> {
    const res = await fetch('/api/applications/mine', {
      headers: await withTokenHeader(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load your application history.');
    }
    return data.applications || [];
  },

  async submitApplication(payload: SubmitApplicationPayload): Promise<SubmitResponse> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: await withTokenHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit application.');
    }
    return data;
  },

  async trackApplication(applicationId: string, token: string): Promise<TrackingResult> {
    const res = await fetch('/api/applications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to verify application status.');
    }
    return data;
  },

  async getAdminApplications(params?: {
    search?: string;
    status?: string;
    role?: string;
  }): Promise<{ stats: DashboardStats; applications: Application[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);

    const res = await fetch(`/api/admin/applications?${query.toString()}`, {
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch applications.');
    }
    return data;
  },

  async getAdminApplicationDetail(id: string): Promise<Application> {
    const res = await fetch(`/api/admin/applications/${id}`, {
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load application details.');
    }
    return data;
  },

  async acceptApplication(
    id: string,
    payload: { duration: string; joiningDate: string }
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/accept`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to accept application.');
    }
    return data;
  },

  async rejectApplication(
    id: string
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/reject`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reject application.');
    }
    return data;
  },

  async updateApplicationStatus(
    id: string,
    payload: { status: string; note?: string }
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/status`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update application status.');
    }
    return data;
  },

  async scheduleInterview(
    id: string,
    payload: {
      interviewType: 'Phone Screen' | 'Technical Interview' | 'HR Interview' | 'Panel Interview';
      scheduledAt: string;
      durationMinutes?: number;
      mode: 'Online' | 'On-site' | 'Hybrid';
      location?: string | null;
      interviewerName?: string | null;
      notes?: string | null;
    }
  ): Promise<{ success: boolean; application: Application; message: string }> {
    const res = await fetch(`/api/admin/applications/${id}/interviews`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to schedule interview.');
    }
    return data;
  },

  async sendOfferLetter(applicationId: string): Promise<{
    success: boolean;
    emailSent: boolean;
    application: Application;
    message: string;
    emailError?: string;
  }> {
    const res = await fetch(`/api/admin/applications/${applicationId}/send-offer-letter`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send the offer letter email.');
    }
    return data;
  },

  async retryEmailJob(jobId: string): Promise<{ success: boolean; job: EmailJob; message: string }> {
    const res = await fetch(`/api/admin/email-jobs/${jobId}/retry`, {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retry email delivery.');
    }
    return data;
  },

  async sendTestEmail(recipient: string): Promise<{ success: boolean; result: unknown }> {
    const res = await fetch('/api/admin/send-test-email', {
      method: 'POST',
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ recipient }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send test email.');
    }
    return data;
  },

  async getEmailPreview(
    applicationId: string,
    emailType: string
  ): Promise<{ emailType: string; recipient: string; subject: string; html: string; text: string }> {
    const res = await fetch(`/api/admin/applications/${applicationId}/email-preview/${emailType}`, {
      headers: await withAdminAuthHeader({ 'Content-Type': 'application/json' }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate email preview.');
    }
    return data;
  },

  async getAdminResumeBlob(applicationId: string): Promise<Blob> {
    console.info('[RESUME_DEBUG] fetching resume blob', {
      applicationId,
      at: new Date().toISOString(),
    });

    const res = await fetch(`/api/admin/applications/${applicationId}/resume`, {
      headers: await withAdminAuthHeader(),
    });

    console.info('[RESUME_DEBUG] resume fetch response', {
      applicationId,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type') || null,
    });

    if (!res.ok) {
      let message = 'Failed to load the resume.';
      try {
        const payload = await res.text();
        if (payload) message = payload;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return res.blob();
  },

  async downloadAdminOfferLetter(applicationId: string): Promise<void> {
    const res = await fetch(`/api/admin/applications/${applicationId}/offer-letter`, {
      headers: await withAdminAuthHeader(),
    });

    if (!res.ok) {
      let message = 'Failed to download the offer letter PDF.';
      try {
        const payload = await res.text();
        if (payload) message = payload;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/pdf')) {
      const text = await res.text();
      throw new Error(text || 'The server did not return a valid PDF file.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Company-Tech-Offer-Letter-${applicationId}.pdf`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
