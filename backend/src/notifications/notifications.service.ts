import { Injectable } from '@nestjs/common';
import { MailerService } from './providers/mailer.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly mailer: MailerService) {}

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
    const targets = process.env.NOTIFY_MODERATORS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'SPEED moderation queue needs attention',
          text: `There are currently ${queueSize} submissions awaiting moderation.`
        })
      )
    );
  }

  async notifyAnalysts(queueSize: number) {
    const targets = process.env.NOTIFY_ANALYSTS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'SPEED analysis queue update',
          text: `There are ${queueSize} submissions ready for analysis.`
        })
      )
    );
  }

  async notifyModeratorsNewSubmission(payload: { title: string; submitter?: string }) {
    const targets = process.env.NOTIFY_MODERATORS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    if (!targets.length) {
      return;
    }
    const text = `New submission "${payload.title}"` + (payload.submitter ? ` from ${payload.submitter}` : '') + ' is waiting for review.';
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'New SPEED submission awaiting review',
          text
        })
      )
    );
  }

  async notifyAnalystsNewSubmission(payload: { title: string; doi?: string | null }) {
    const targets = process.env.NOTIFY_ANALYSTS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    if (!targets.length) {
      return;
    }
    const text = `A submission "${payload.title}" has entered the analysis queue${payload.doi ? ` (DOI: ${payload.doi})` : ''}.`;
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'New SPEED submission ready for analysis',
          text
        })
      )
    );
  }

  async notifyModerationInactivity(queueSize: number) {
    const targets = process.env.NOTIFY_MODERATORS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    if (!targets.length) {
      return;
    }
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'Moderation queue inactive for 24h',
          text: `There are ${queueSize} submissions still queued and no moderation action in the last 24 hours.`
        })
      )
    );
  }

  async notifyAnalysisInactivity(queueSize: number) {
    const targets = process.env.NOTIFY_ANALYSTS?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    if (!targets.length) {
      return;
    }
    await Promise.all(
      targets.map(email =>
        this.mailer.sendMail({
          to: email,
          subject: 'Analysis queue inactive for 24h',
          text: `There are ${queueSize} submissions awaiting analysis and no analysis action in the last 24 hours.`
        })
      )
    );
  }
}
