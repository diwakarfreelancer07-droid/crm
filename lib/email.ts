import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Inter CRM Admin" <admin@intercrm.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return null;
    }
}

// ─── LIFECYCLE EMAIL TEMPLATE ─────────────────────────────────────────────────

interface LifecycleEmailOptions {
    title: string;
    body: string;
    details?: { label: string; value: string }[];
    note?: string;
    cta?: { label: string; url: string };
}

/**
 * Builds a rich branded HTML email for lifecycle event notifications.
 * Used by lib/lifecycle-notifications.ts.
 */
export function buildLifecycleEmail({
    title,
    body,
    details = [],
    note,
    cta,
}: LifecycleEmailOptions): string {
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const ctaUrl = cta
        ? cta.url.startsWith("http")
            ? cta.url
            : `${appUrl}${cta.url}`
        : null;

    const detailRows = details
        .map(
            ({ label, value }) => `
        <tr>
          <td style="padding:6px 12px;color:#6b7280;font-weight:600;white-space:nowrap;width:140px;">${label}</td>
          <td style="padding:6px 12px;color:#111827;">${value}</td>
        </tr>`
        )
        .join("");

    const detailTable =
        details.length > 0
            ? `<table style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;border-collapse:collapse;">${detailRows}</table>`
            : "";

    const noteHtml = note
        ? `<p style="margin:16px 0;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;color:#92400e;font-size:13px;">${note}</p>`
        : "";

    const ctaHtml = ctaUrl
        ? `<div style="text-align:center;margin:28px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 32px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">${cta!.label}</a>
      </div>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">InterEd CRM</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${body}</p>
            ${detailTable}
            ${noteHtml}
            ${ctaHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">This is an automated notification from InterEd CRM. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
