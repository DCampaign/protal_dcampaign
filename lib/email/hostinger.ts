import 'server-only';
import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function smtpConfig() {
  const user = process.env.HOSTINGER_SMTP_USER;
  const pass = process.env.HOSTINGER_SMTP_PASSWORD;
  if (!user || !pass) throw new Error('Hostinger SMTP is not configured. Add HOSTINGER_SMTP_USER and HOSTINGER_SMTP_PASSWORD.');
  return {
    host: process.env.HOSTINGER_SMTP_HOST ?? 'smtp.hostinger.com',
    port: Number(process.env.HOSTINGER_SMTP_PORT ?? 465),
    secure: (process.env.HOSTINGER_SMTP_PORT ?? '465') === '465',
    auth: { user, pass },
  };
}

export async function sendHostingerEmail({ to, subject, html }: SendEmailInput) {
  const config = smtpConfig();
  const transport = nodemailer.createTransport(config);
  const fromName = process.env.HOSTINGER_SMTP_FROM_NAME?.trim() || 'DCampaign';
  await transport.sendMail({
    from: '"' + fromName.replace(/"/g, '') + '" <' + config.auth.user + '>',
    to,
    replyTo: config.auth.user,
    subject,
    html,
    text: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
}

export function isHostingerSmtpConfigured() {
  return Boolean(process.env.HOSTINGER_SMTP_USER && process.env.HOSTINGER_SMTP_PASSWORD);
}
