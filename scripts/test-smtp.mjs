/**
 * SMTP connection test script
 * Run: node scripts/test-smtp.mjs
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const host = process.env.SMTP_HOST || "smtp.qq.com";
const port = parseInt(process.env.SMTP_PORT || "587");
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";

console.log(`Testing SMTP connection to ${host}:${port} as ${user}...`);

if (!user || !pass) {
  console.error("❌ SMTP_USER or SMTP_PASS not set in environment");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("✅ SMTP connection successful! Ready to send emails.");
  
  // Send a test email to the sender
  const info = await transporter.sendMail({
    from: `"猫眼咨询测试" <${user}>`,
    to: user,
    subject: "猫眼咨询 SMTP 测试邮件",
    text: "SMTP 配置成功！邮件群发功能已就绪。",
    html: "<p>✅ <strong>SMTP 配置成功！</strong>邮件群发功能已就绪。</p>",
  });
  console.log(`✅ Test email sent! Message ID: ${info.messageId}`);
} catch (err) {
  console.error("❌ SMTP connection failed:", err.message);
  process.exit(1);
}
