/**
 * Email Service — 邮件发送服务
 * Uses Nodemailer with configurable SMTP (Gmail, QQ, 163, etc.)
 */
import nodemailer from "nodemailer";
import { createTransport } from "nodemailer";

// RFC2047 encode Chinese sender name
function encodeHeader(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text).toString('base64')}?=`;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    throw new Error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in Secrets.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const fromName = process.env.SMTP_FROM_NAME || "猫眼增长引擎";
    const fromEmail = process.env.SMTP_USER || "";

    await transporter.sendMail({
      from: `${encodeHeader(fromName)} <${fromEmail}>`,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Send in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((email) => sendEmail({ to: email, subject, html, text }))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) success++;
      else failed++;
    }
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { success, failed };
}

/**
 * Generate HTML template for contact form confirmation email (sent to visitor)
 */
export function generateContactConfirmationHtml(name: string, company: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>感谢您的咨询申请 — 猫眼增长引擎</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 32px 40px; border-bottom: 2px solid #C9A84C; }
    .logo-text { color: #C9A84C; font-size: 22px; font-weight: 700; letter-spacing: 0.1em; }
    .logo-sub { color: #ffffff55; font-size: 11px; letter-spacing: 0.2em; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 20px; }
    .content { color: #cccccc; font-size: 15px; line-height: 1.8; }
    .highlight { color: #C9A84C; font-weight: 600; }
    .box { background: #0A0A0A; border: 1px solid #C9A84C33; padding: 24px 28px; margin: 24px 0; }
    .box-label { color: #C9A84C; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
    .box-value { color: #ffffff; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #ffffff11; margin: 32px 0; }
    .cta { display: inline-block; background: #C9A84C; color: #000; padding: 14px 32px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-decoration: none; margin-top: 8px; }
    .footer { background: #0A0A0A; padding: 24px 40px; border-top: 1px solid #ffffff11; }
    .footer-text { color: #ffffff33; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">猫眼增长引擎</div>
      <div class="logo-sub">MC&MAMOO BRAND MANAGEMENT</div>
    </div>
    <div class="body">
      <div class="greeting">尊敬的 ${name}，</div>
      <div class="content">
        <p>感谢您向猫眼增长引擎提交品牌战略咨询申请。我们已收到您的信息，我们的首席战略专家团队将在 <span class="highlight">1-2个工作日内</span> 与您联系。</p>
        <div class="box">
          <div class="box-label">您的申请信息</div>
          <div class="box-value">姓名：${name}</div>
          <div class="box-value" style="margin-top:6px">公司：${company}</div>
        </div>
        <p>在等待期间，您可以访问我们的官网了解更多标杆案例，或关注我们的最新战略洞察。</p>
      </div>
      <hr class="divider" />
      <a href="https://www.mcmamoo.com" class="cta">查看标杆案例 →</a>
    </div>
    <div class="footer">
      <div class="footer-text">
        猫眼增长引擎 Mc&Mamoo Brand Management Inc.<br/>
        上海 · 品牌显贵 · 利润倍增 · 全域增长<br/>
        联系电话：+86 137 6459 7723
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML template for contact form admin notification
 */
export function generateContactAdminHtml(name: string, company: string, phone: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>新咨询申请 — 猫眼增长引擎后台</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 24px 32px; border-bottom: 2px solid #C9A84C; }
    .title { color: #C9A84C; font-size: 18px; font-weight: 700; }
    .body { padding: 32px; }
    .field { margin-bottom: 16px; }
    .label { color: #ffffff55; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #ffffff; font-size: 15px; }
    .msg { color: #cccccc; font-size: 14px; line-height: 1.7; background: #0A0A0A; padding: 16px; border-left: 2px solid #C9A84C; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><div class="title">🔔 新咨询申请</div></div>
    <div class="body">
      <div class="field"><div class="label">姓名</div><div class="value">${name}</div></div>
      <div class="field"><div class="label">公司</div><div class="value">${company}</div></div>
      <div class="field"><div class="label">联系电话</div><div class="value">${phone}</div></div>
      <div class="field"><div class="label">咨询需求</div><div class="msg">${message || '（未填写）'}</div></div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML template for strategic newsletter
 */
export function generateNewsletterHtml(subject: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111111; }
    .header { background: #0A0A0A; padding: 32px 40px; border-bottom: 1px solid #C9A84C33; }
    .logo-text { color: #C9A84C; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; }
    .logo-sub { color: #ffffff55; font-size: 11px; letter-spacing: 0.2em; margin-top: 4px; }
    .body { padding: 40px; }
    .subject { color: #C9A84C; font-size: 22px; font-weight: 700; margin-bottom: 24px; line-height: 1.4; }
    .content { color: #cccccc; font-size: 15px; line-height: 1.8; white-space: pre-wrap; }
    .divider { border: none; border-top: 1px solid #ffffff11; margin: 32px 0; }
    .cta { display: inline-block; background: #C9A84C; color: #000; padding: 12px 28px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-decoration: none; margin-top: 8px; }
    .footer { background: #0A0A0A; padding: 24px 40px; border-top: 1px solid #ffffff11; }
    .footer-text { color: #ffffff33; font-size: 12px; line-height: 1.6; }
    .footer-link { color: #C9A84C55; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">猫眼增长引擎</div>
      <div class="logo-sub">MC&MAMOO BRAND MANAGEMENT</div>
    </div>
    <div class="body">
      <div class="subject">${subject}</div>
      <div class="content">${content.replace(/\n/g, "<br/>")}</div>
      <hr class="divider" />
      <a href="https://www.mcmamoo.com" class="cta">访问官网 →</a>
    </div>
    <div class="footer">
      <div class="footer-text">
        您收到此邮件是因为您订阅了猫眼增长引擎战略简报。<br/>
        如需退订，请回复此邮件并注明"退订"。<br/>
        © 2025 猫眼增长引擎 Mc&Mamoo Brand Management Inc. 保留所有权利。
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
