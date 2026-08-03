import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: parseInt(process.env['SMTP_PORT'] ?? '587'),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  });
}

export async function sendEmail(to: string, subject: string, text: string): Promise<{ ok: boolean; reason?: string }> {
  const from = process.env['SMTP_FROM'] ?? process.env['SMTP_USER'];
  if (!from) return { ok: false, reason: 'SMTP tidak dikonfigurasi' };

  try {
    await getTransporter().sendMail({ from, to, subject, text });
    return { ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Gagal mengirim email';
    console.error('SMTP error:', reason);
    return { ok: false, reason };
  }
}
