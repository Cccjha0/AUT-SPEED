import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor() {
    this.transporter = this.createTransport();
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    if (!options.to) {
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.getFromAddress(),
        ...options
      });
    } catch (error) {
      this.logger.warn(
        `Unable to send mail to ${options.to}: ${(error as Error).message}`
      );
    }
  }

  private createTransport(): Transporter {
    if (process.env.NODE_ENV === 'test') {
      return nodemailer.createTransport({
        jsonTransport: true
      });
    }

    if (
      process.env.GMAIL_USER &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    ) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      });
    }

    if (process.env.GOOGLE_APP_ACCOUNT && process.env.GOOGLE_APP_PASSWORD) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GOOGLE_APP_ACCOUNT,
          pass: process.env.GOOGLE_APP_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          : undefined,
      tls: { rejectUnauthorized: false }
    });
  }

  private getFromAddress() {
    return (
      process.env.SMTP_FROM ||
      process.env.GMAIL_USER ||
      process.env.GOOGLE_APP_ACCOUNT ||
      'no-reply@speed.aut'
    );
  }
}
