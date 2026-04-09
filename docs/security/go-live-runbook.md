# Security go-live runbook

## Pre-launch checklist

- [ ] Không còn hardcoded secrets/password mặc định trong code.
- [ ] `CAPTCHA_BYPASS` không được bật ở production.
- [ ] `NEXTAUTH_SECRET`, `TOTP_ENCRYPTION_KEY`, `TURNSTILE_SECRET_KEY` đã rotate.
- [ ] Cloudinary env đầy đủ và upload route hoạt động.
- [ ] Upstash env đầy đủ, rate-limit và lockout hoạt động.
- [ ] Đã chạy `pnpm lint && pnpm typecheck && pnpm test:security && pnpm build`.
- [ ] CI + CodeQL + Dependabot đã bật trên GitHub.
- [ ] Branch protection đã bật cho `main`.
- [ ] Database dùng role app tối thiểu, migration role tách riêng.

## Incident response (quick steps)

1. Xác định phạm vi ảnh hưởng (auth, DB, upload, XSS, secret leak).
2. Rotate ngay các secrets liên quan.
3. Revoke session admin bằng cách đổi `NEXTAUTH_SECRET` và redeploy.
4. Nếu ảnh hưởng DB: tạm khóa writes, kiểm tra logs, restore nếu cần.
5. Nếu ảnh hưởng upload: vô hiệu hóa upload endpoint tạm thời.
6. Mở issue nội bộ với timeline + root cause + action items.

## Routine maintenance

- Hàng tuần: xem Dependabot/CodeQL alerts.
- Hàng tuần: kiểm tra quota Cloudinary + log webhook.
- Hàng tháng: rotate ít nhất 1 nhóm secret nhạy cảm.
- Hàng tháng: chạy lại checklist brute-force/XSS/upload abuse.
