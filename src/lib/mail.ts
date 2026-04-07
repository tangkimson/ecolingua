import { Resend } from "resend";

type LeadEmailPayload = {
  to: string;
  fullName: string;
  email: string;
  phone: string;
  sourcePage: string;
  message?: string;
};

export async function sendLeadEmail(payload: LeadEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("RESEND_API_KEY chưa cấu hình. Bỏ qua gửi email.");
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "EcoLingua <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: payload.to,
    subject: `Lead mới từ ${payload.sourcePage} - ${payload.fullName}`,
    html: `
      <h2>Lead mới từ website</h2>
      <p><strong>Họ tên:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>SĐT:</strong> ${payload.phone}</p>
      <p><strong>Trang gửi:</strong> ${payload.sourcePage}</p>
      <p><strong>Nội dung:</strong> ${payload.message || "Không có"}</p>
    `
  });
}
