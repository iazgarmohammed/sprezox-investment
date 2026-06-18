import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.resend.emails.send({
      from: 'Sprezox <onboarding@resend.dev>',
      to,
      subject: 'Reset your Sprezox password',
      html: `
        <p>You requested a password reset for your Sprezox account.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      `,
    });
  }

  async sendConnectionApprovedEmail(
    founderEmail: string,
    founderName: string,
    investorEmail: string,
    investorName: string,
    startupName: string,
  ) {
    await this.resend.emails.send({
      from: 'Sprezox <onboarding@resend.dev>',
      to: founderEmail,
      subject: `Connection approved: ${investorName} wants to connect about ${startupName}`,
      html: `
        <p>Hi ${founderName},</p>
        <p>You approved a connection request. Here are the investor's contact details:</p>
        <p><strong>Name:</strong> ${investorName}<br/>
        <strong>Email:</strong> ${investorEmail}</p>
        <p>You can now reach out directly to continue the conversation.</p>
      `,
    });

    await this.resend.emails.send({
      from: 'Sprezox <onboarding@resend.dev>',
      to: investorEmail,
      subject: `Connection approved: ${startupName} accepted your request`,
      html: `
        <p>Hi ${investorName},</p>
        <p>${startupName} approved your connection request. Here are the founder's contact details:</p>
        <p><strong>Name:</strong> ${founderName}<br/>
        <strong>Email:</strong> ${founderEmail}</p>
        <p>You can now reach out directly to continue the conversation.</p>
      `,
    });
  }
}