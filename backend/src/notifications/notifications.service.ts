import { Injectable } from '@nestjs/common';
import { MailerService } from './providers/mailer.service';
import { StaffService } from '../staff/staff.service';

const MODERATOR_ROLE = 'moderator';
const ANALYST_ROLE = 'analyst';

interface RecipientCacheEntry {
  emails: string[];
  expiresAt: number;
}

@Injectable()
export class NotificationsService {
  private readonly recipientCache = new Map<string, RecipientCacheEntry>();
  private readonly cacheTtlMs = Number(
    process.env.NOTIFICATION_STAFF_CACHE_TTL_MS ?? 60_000
  );

  constructor(
    private readonly mailer: MailerService,
    private readonly staffService: StaffService
  ) {}

  async notifySubmissionDecision(params: {
    email?: string | null;
    name?: string | null;
    title: string;
    status: 'accepted' | 'rejected';
  }) {
    if (!params.email) {
      return;
    }
    const subject =
      params.status === 'accepted'
        ? 'Your SPEED submission has been accepted'
        : 'Your SPEED submission was rejected';
    const salutation = params.name ? `Hi ${params.name},` : 'Hello,';
    const body =
      params.status === 'accepted'
        ? `${salutation}\n\nYour article "${params.title}" has passed moderation and will move into the analysis queue.\n\nThanks for contributing to SPEED.`
        : `${salutation}\n\nWe reviewed "${params.title}" but could not accept it at this time. Please review the guidelines before resubmitting.\n\nRegards,\nSPEED Team`;
    await this.mailer.sendMail({
      to: params.email,
      subject,
      text: body
    });
  }

  async notifyModerators(queueSize: number) {
    await this.sendRoleNotification(
      MODERATOR_ROLE,
      'SPEED moderation queue needs attention',
      `There are currently ${queueSize} submissions awaiting moderation.`
    );
  }

  async notifyAnalysts(queueSize: number) {
    await this.sendRoleNotification(
      ANALYST_ROLE,
      'SPEED analysis queue update',
      `There are ${queueSize} submissions ready for analysis.`
    );
  }

  async notifyModeratorsNewSubmission(payload: { title: string; submitter?: string }) {
    const text =
      `New submission "${payload.title}"` +
      (payload.submitter ? ` from ${payload.submitter}` : '') +
      ' is waiting for review.';
    await this.sendRoleNotification(
      MODERATOR_ROLE,
      'New SPEED submission awaiting review',
      text
    );
  }

  async notifyAnalystsNewSubmission(payload: { title: string; doi?: string | null }) {
    const text = `A submission "${payload.title}" has entered the analysis queue${
      payload.doi ? ` (DOI: ${payload.doi})` : ''
    }.`;
    await this.sendRoleNotification(
      ANALYST_ROLE,
      'New SPEED submission ready for analysis',
      text
    );
  }

  async notifyModerationInactivity(queueSize: number) {
    await this.sendRoleNotification(
      MODERATOR_ROLE,
      'Moderation queue inactive for 24h',
      `There are ${queueSize} submissions still queued and no moderation action in the last 24 hours.`
    );
  }

  async notifyAnalysisInactivity(queueSize: number) {
    await this.sendRoleNotification(
      ANALYST_ROLE,
      'Analysis queue inactive for 24h',
      `There are ${queueSize} submissions awaiting analysis and no analysis action in the last 24 hours.`
    );
  }

  private async sendRoleNotification(role: string, subject: string, text: string) {
    const recipients = await this.getRecipients(role);
    if (!recipients.length) {
      return;
    }
    await Promise.all(
      recipients.map(email =>
        this.mailer.sendMail({
          to: email,
          subject,
          text
        })
      )
    );
    await this.staffService.markNotified(recipients);
  }

  private async getRecipients(role: string) {
    const normalizedRole = role.trim().toLowerCase();
    if (!normalizedRole) {
      return [];
    }
    const cached = this.recipientCache.get(normalizedRole);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.emails;
    }
    const emails = await this.staffService.listActiveEmailsByRole(normalizedRole);
    this.recipientCache.set(normalizedRole, {
      emails,
      expiresAt: Date.now() + this.cacheTtlMs
    });
    return emails;
  }
}
