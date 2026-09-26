import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: any = null;

  constructor() {
    this.initTransport();
  }

  private getResendApiKey(): string {
    return (
      (env as any).RESEND_API_KEY ||
      process.env.RESEND_API_KEY ||
      env.EMAIL_SERVICE_API_KEY ||
      process.env.EMAIL_SERVICE_API_KEY ||
      process.env.ESEND_API_KEY ||
      ''
    ).trim();
  }

  private hasSmtpConfig(): boolean {
    return Boolean(env.SMTP_HOST && (env.SMTP_USER || env.SMTP_PASS));
  }

  private initTransport() {
    const resendApiKey = this.getResendApiKey();

    if (resendApiKey) {
      logger.info('[EmailService] Configured with Resend HTTP API.');
      return;
    }

    if (this.hasSmtpConfig()) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        logger.info(`[EmailService] Configured SMTP transporter with host: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
        return;
      } catch (err: any) {
        logger.error(`[EmailService] Failed to initialize SMTP transporter: ${err.message}`);
        this.transporter = null;
      }
    }

    logger.info('[EmailService] Neither Resend API key nor SMTP credentials provided. Running in development console log mode.');
  }

  async sendMail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const { to, subject, html, text } = options;
    const from = env.EMAIL_FROM || process.env.EMAIL_FROM || 'SpeakWise AI <noreply@speakwiseai.app>';
    const resendApiKey = this.getResendApiKey();

    // 1. If RESEND_API_KEY exists, Resend is used.
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to,
            subject,
            html,
            text,
          }),
        });

        if (response.ok) {
          const resData = (await response.json()) as any;
          logger.info(`[EmailService] Email sent via Resend API to ${to}: id=${resData?.id}`);
          return { success: true, messageId: resData?.id };
        } else {
          const errText = await response.text();
          logger.error(`[EmailService] Resend API failed (${response.status}): ${errText}`);
          return { success: false };
        }
      } catch (err: any) {
        logger.error(`[EmailService] Resend API error: ${err.message}`);
        return { success: false };
      }
    }

    // 2. SMTP is only used when SMTP credentials are configured and Resend is not being used.
    if (this.hasSmtpConfig()) {
      if (!this.transporter) {
        try {
          this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            },
          });
        } catch (err: any) {
          logger.error(`[EmailService] Failed to initialize SMTP transporter: ${err.message}`);
          return { success: false };
        }
      }

      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html,
        });
        logger.info(`[EmailService] Email delivered via SMTP to ${to} (MessageID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[EmailService] SMTP send error to ${to}: ${err.message}`);
        return { success: false };
      }
    }

    // 3. Console fallback is used only when neither Resend nor SMTP is configured.
    const previewMessage = `
================================================================================
📧 [EMAIL SERVICE - DEV CONSOLE PREVIEW]
To: ${to}
From: ${from}
Subject: ${subject}
--------------------------------------------------------------------------------
${text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()}
================================================================================`;
    console.log(previewMessage);
    logger.info(`[EmailService] Mock email logged to console for: ${to}`);

    return { success: true, messageId: 'dev_mock_' + Date.now() };
  }

  /**
   * Send Email Verification OTP
   */
  async sendVerificationEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Verify your SpeakWise AI email address';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SpeakWise AI</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Executive Speech Intelligence & Acoustic Analytics</p>
        </div>
        <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Confirm your email address</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for creating an account on SpeakWise AI. Use the verification code below to verify your email address.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #818cf8; background: #0f172a; padding: 14px 28px; border-radius: 10px; border: 1px solid #4f46e5; font-family: monospace;">
              ${otp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            This one-time code expires in <strong>10 minutes</strong>. Never share this code with anyone.
          </p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          If you did not request this email, please ignore it or contact security@speakwise.ai.
        </p>
      </div>
    `;
    const text = `SpeakWise AI Email Verification Code: ${otp}. This code expires in 10 minutes.`;
    const res = await this.sendMail({ to: email, subject, html, text });
    return res.success;
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Reset your SpeakWise AI password';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SpeakWise AI</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Password Reset Request</p>
        </div>
        <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Reset your password</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            We received a request to reset the password for your SpeakWise AI account. Enter the following one-time code to proceed:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f43f5e; background: #0f172a; padding: 14px 28px; border-radius: 10px; border: 1px solid #e11d48; font-family: monospace;">
              ${otp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            This reset code is single-use and expires in <strong>15 minutes</strong>.
          </p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;
    const text = `SpeakWise AI Password Reset Code: ${otp}. This code is valid for 15 minutes.`;
    const res = await this.sendMail({ to: email, subject, html, text });
    return res.success;
  }

  /**
   * Send Google Account Sign-In Reminder (When Google-only user tries forgot password)
   */
  async sendGoogleAccountNotice(email: string): Promise<boolean> {
    const subject = 'Your SpeakWise AI account uses Google Sign-In';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800;">SpeakWise AI</h1>
        </div>
        <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px;">Google Sign-In Account</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            We received a password reset request for this email address. However, your SpeakWise AI account was created using <strong>Google Sign-In</strong> and does not use a standalone password.
          </p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            Please log in by clicking <strong>"Continue with Google"</strong> on the SpeakWise AI login screen.
          </p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          If you did not request this, you can safely ignore this message.
        </p>
      </div>
    `;
    const text = `Your SpeakWise AI account was created using Google Sign-In. Please log in by clicking "Continue with Google".`;
    const res = await this.sendMail({ to: email, subject, html, text });
    return res.success;
  }
}

export const emailService = new EmailService();
