import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const port = Number(process.env.SMTP_PORT ?? 587);
const from = process.env.SMTP_FROM ?? (user ? `Опитування <${user}>` : "Опитування");

const transporter =
  host && user && pass
    ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
    : null;

export function renderVerificationEmail(url: string) {
  // Table layout + inline styles for email-client compatibility (Gmail, Outlook, Apple Mail).
  return `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#e6e9e1;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">Підтвердіть пошту, щоб продовжити заповнення анкети.</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e6e9e1;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#f6f7f2;border:1px solid #c6ccbf;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <tr><td style="background:#3d5233;padding:22px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:#2f3f28;border-radius:9px;text-align:center;vertical-align:middle;">
              <div style="width:16px;height:5px;background:#f2c230;border-radius:99px;margin:0 auto;"></div>
            </td>
            <td style="padding-left:12px;color:#f6f7f2;font-size:16px;font-weight:700;letter-spacing:-0.2px;">Опитування особового складу</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <div style="width:44px;height:6px;background:#f2c230;border-radius:99px;margin-bottom:20px;"></div>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#1d271c;">Підтвердіть свою пошту</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#566251;">Ви майже готові почати. Натисніть кнопку нижче, щоб підтвердити пошту й перейти до анкети.</p>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#3d5233;border-radius:12px;">
            <a href="${url}" style="display:inline-block;padding:14px 30px;color:#f6f7f2;font-size:15px;font-weight:600;text-decoration:none;">Підтвердити пошту</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px 4px;">
          <p style="margin:0 0 6px;font-size:12px;color:#566251;">Якщо кнопка не працює, скопіюйте посилання:</p>
          <p style="margin:0;font-size:12px;line-height:1.5;"><a href="${url}" style="color:#3d5233;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;">
          <div style="border-top:1px solid #c6ccbf;padding-top:16px;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#566251;">Посилання дійсне 1 годину. Якщо ви не реєструвалися — просто проігноруйте цей лист.</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendVerificationEmail(to: string, url: string) {
  // Without SMTP configured (e.g. local dev) print the link so verification still works.
  if (!transporter) {
    console.log(`\n[email verification] ${to}\n${url}\n`);
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject: "Підтвердження пошти — Опитування особового складу",
    text: `Підтвердіть свою пошту, щоб продовжити заповнення анкети:\n${url}\n\nПосилання дійсне 1 годину. Якщо ви не реєструвалися — проігноруйте цей лист.`,
    html: renderVerificationEmail(url),
  });
}
