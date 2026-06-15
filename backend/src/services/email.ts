import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function getTransporter() {
  if (!env.smtpEmail || !env.smtpPassword) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: env.smtpEmail, pass: env.smtpPassword },
  });
}

export async function sendWelcomeEmail(
  to: string,
  displayName: string,
  tempPassword: string,
  role: string,
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP not configured — welcome email would go to ${to}`);
    return;
  }

  const roleLabel =
    role === "signage"   ? "Digital Signage"
    : role === "occupancy" ? "Room Occupancy"
    : role === "both"      ? "Digital Signage & Room Occupancy"
    : "Platform";

  const loginUrl = `${env.appUrl}/login`;

  await transporter.sendMail({
    from: `"AIM4IT Platform" <${env.smtpEmail}>`,
    to,
    subject: "Your AIM4IT account is ready",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:#042B19;padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">AIM4IT Platform</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#042B19;margin-top:0;">Welcome, ${displayName}!</h2>
    <p style="color:#555;line-height:1.6;">Your account has been activated. Here are your login credentials:</p>
    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#042B19;"><strong>Email:</strong> ${to}</p>
      <p style="margin:0 0 8px;color:#042B19;"><strong>Temporary Password:</strong> <code style="background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #ddd;">${tempPassword}</code></p>
      <p style="margin:0;color:#042B19;"><strong>Access:</strong> ${roleLabel}</p>
    </div>
    <p style="color:#e05252;font-size:13px;"><strong>Important:</strong> You will be required to change your password on first login.</p>
    <a href="${loginUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;margin-top:8px;">Login to AIM4IT</a>
  </div>
  <div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
    <p style="color:#9CA3AF;font-size:12px;margin:0;">If you didn't request this account, please ignore this email.</p>
  </div>
</div>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(to: string, displayName: string, token: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP not configured — reset email would go to ${to} with token ${token}`);
    return;
  }

  const resetUrl = `${env.appUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"AIM4IT Platform" <${env.smtpEmail}>`,
    to,
    subject: "AIM4IT – Password reset request",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:#042B19;padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">AIM4IT Platform</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#042B19;margin-top:0;">Password Reset Request</h2>
    <p style="color:#555;line-height:1.6;">Hi ${displayName}, we received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;margin-top:8px;">Reset Password</a>
    <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</div>
</body>
</html>`,
  });
}
