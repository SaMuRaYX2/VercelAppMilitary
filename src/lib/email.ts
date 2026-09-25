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

export async function sendVerificationEmail(to: string, url: string) {
  // Without SMTP configured (e.g. local dev) print the link so verification still works.
  if (!transporter) {
    console.log(`\n[email verification] ${to}\n${url}\n`);
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject: "Підтвердження пошти — Опитування",
    text: `Вітаємо!\n\nПідтвердіть свою пошту, щоб продовжити заповнення анкети:\n${url}\n\nПосилання діє 1 годину. Якщо ви не реєструвалися — просто проігноруйте цей лист.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1d271c">
        <h2 style="font-size:20px;margin:0 0 12px">Підтвердження пошти</h2>
        <p style="margin:0 0 16px;line-height:1.6">Підтвердіть свою пошту, щоб продовжити заповнення анкети.</p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#3d5233;color:#f6f7f2;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Підтвердити пошту</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#566251;line-height:1.6">Або скопіюйте посилання:<br><span style="word-break:break-all">${url}</span></p>
        <p style="margin:16px 0 0;font-size:13px;color:#566251">Посилання діє 1 годину. Якщо ви не реєструвалися — проігноруйте цей лист.</p>
      </div>`,
  });
}
