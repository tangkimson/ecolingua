import { Resend } from "resend";

type LeadEmailPayload = {
  to: string | string[];
  fullName: string;
  email: string;
  phone: string;
  sourcePage: string;
  address?: string;
  birthYear?: string;
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
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const cleanedRecipients = recipients.map((entry) => entry.trim()).filter(Boolean);

  if (!cleanedRecipients.length) {
    console.info("Không có email nhận thông báo lead. Bỏ qua gửi email.");
    return;
  }

  await resend.emails.send({
    from,
    to: cleanedRecipients,
    subject: `Lead mới từ ${payload.sourcePage} - ${payload.fullName}`,
    html: `
      <h2>Lead mới từ website</h2>
      <p><strong>Họ tên:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>SĐT:</strong> ${payload.phone}</p>
      <p><strong>Trang gửi:</strong> ${payload.sourcePage}</p>
      <p><strong>Năm sinh:</strong> ${payload.birthYear || "Không có"}</p>
      <p><strong>Địa chỉ:</strong> ${payload.address || "Không có"}</p>
      <p><strong>Nội dung:</strong> ${payload.message || "Không có"}</p>
    `,
    text: [
      "Lead mới từ website",
      `Họ tên: ${payload.fullName}`,
      `Email: ${payload.email}`,
      `SĐT: ${payload.phone}`,
      `Trang gửi: ${payload.sourcePage}`,
      `Năm sinh: ${payload.birthYear || "Không có"}`,
      `Địa chỉ: ${payload.address || "Không có"}`,
      `Nội dung: ${payload.message || "Không có"}`
    ].join("\n")
  });
}
