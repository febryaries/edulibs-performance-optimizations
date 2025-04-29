import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { EmailTemplate } from '@/emails/email-template';

// Create a transporter using Gmail SMTP relay
const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_HOST || 'smtp-relay.gmail.com',
  port: parseInt(process.env.GMAIL_PORT || '587'),
  secure: process.env.GMAIL_SECURE === 'true',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export type EmailProps = {
  recipientName: string;
  previewText: string;
  bodyText: string;
  buttonText: string;
  buttonLink: string;
};

export async function sendEmail({
  to,
  subject,
  emailProps,
}: {
  to: string | string[];
  subject: string;
  emailProps: EmailProps;
}) {
  try {
    // Render the email template
    const html = await render(EmailTemplate(emailProps));

    // Prepare recipients
    const recipients = Array.isArray(to) ? to : [to];

    // Send the email
    const info = await transporter.sendMail({
      from: `${process.env.GMAIL_FROM_NAME || 'EDU Apps'} <${process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });

    // // console.log('[LOG] Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
