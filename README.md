# EcoLingua

Du an Next.js 14 (App Router) co Public Website + Admin Dashboard, da chuan hoa PostgreSQL cho ca local va production.

## 1) Stack chinh

- Next.js 14 + TypeScript
- Prisma ORM + PostgreSQL
- NextAuth (Credentials)
- 2FA TOTP (Google Authenticator)
- Tailwind CSS + UI components

## 2) Tinh nang chinh

- Public pages: trang chu, gioi thieu, tham gia, tin tuc, lien he, quyen gop
- Admin dashboard: login, quan ly bai viet, FAQ, cai dat
- Bao mat admin:
  - Password hash (`bcryptjs`)
  - CAPTCHA (Cloudflare Turnstile) truoc khi vao buoc 2FA
  - 2FA TOTP (secret ma hoa truoc khi luu DB)
  - Middleware bao ve route `/admin/*` (tru `/admin/login`)

---

## 3) Demo local cho newbie (PostgreSQL-only)

### 3.1 Yeu cau

- Node.js 18.18+ (khuyen nghi Node.js 20)
- pnpm (`npm i -g pnpm`)
- Docker Desktop (de chay PostgreSQL nhanh nhat)

### 3.2 Tao PostgreSQL local bang Docker

```bash
docker run --name ecolingua-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=ecolingua ^
  -p 5432:5432 ^
  -d postgres:16
```

Neu container da ton tai, dung 2 lenh sau:

```bash
docker start ecolingua-postgres
docker ps
```

### 3.3 Cai package

```bash
pnpm install
```

### 3.4 Tao file `.env`

Copy `.env.example` thanh `.env`, sau do dam bao cac bien toi thieu:

```env
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/ecolingua?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-long-random-secret"
PRECHECK_HMAC_SECRET="another-long-random-secret"
TOTP_ENCRYPTION_KEY="another-long-random-secret"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
TRUST_PROXY="false"
```

Tuỳ chon (seed):

```env
SEED_ADMIN_EMAIL="admin@xanhvietnam.local"
SEED_ADMIN_PASSWORD="your-strong-password"
SEED_ALLOW_PASSWORD_RESET="false"
```

### 3.5 Khoi tao DB + seed

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init_postgres
pnpm prisma:seed
```

### 3.6 Chay app local

```bash
pnpm dev
```

Mo [http://localhost:3000](http://localhost:3000) va dang nhap admin tai [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

### 3.7 Test nhanh 2FA

1. Dang nhap admin.
2. Vao `/admin/settings`.
3. Bam "Thiet lap 2FA".
4. Quet QR bang Google Authenticator.
5. Nhap ma 6 so de kich hoat.
6. Dang xuat va dang nhap lai kem ma 2FA.

### 3.8 Login flow admin (moi)

1. Nhap email admin + mat khau.
2. Hoan thanh CAPTCHA.
3. Server xac minh password + CAPTCHA thanh cong moi cho qua buoc OTP.
4. Neu account bat 2FA, nhap ma OTP de vao admin.

### 3.9 Lenh kiem tra truoc khi push

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## 4) Commit va push len GitHub

Neu repo chua co remote:

```bash
git init
git add .
git commit -m "feat: migrate project to postgresql-only and add admin 2fa"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

Neu da co remote:

```bash
git add .
git commit -m "feat: migrate project to postgresql-only and add admin 2fa"
git push
```

---

## 5) Deploy Vercel (tu GitHub)

### 5.1 Tao database production

Dung Neon/Supabase/Railway va lay connection string PostgreSQL.

### 5.2 Import repo vao Vercel

1. Dang nhap Vercel
2. New Project -> Import GitHub repo
3. Framework: Next.js

### 5.3 Khai bao Environment Variables tren Vercel

- `POSTGRES_PRISMA_URL`
- `NEXTAUTH_URL` (vd: `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`
- `PRECHECK_HMAC_SECRET`
- `TOTP_ENCRYPTION_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `TRUST_PROXY` (`true` tren Vercel/reverse proxy)
- (tuỳ chon) `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
- (tuỳ chon) `SEED_ALLOW_PASSWORD_RESET` (mac dinh `false`)

### 5.4 Build settings

- Install Command: `pnpm install`
- Build Command: `pnpm prisma:generate && pnpm build`

### 5.5 Chay migration production (tach rieng khoi build)

Khong nen chay `prisma migrate deploy` trong Build Command vi build co the fail neu DB tam thoi khong ket noi duoc.

Chay migration bang may local/CI khi can:

```bash
pnpm prisma:deploy
```

Dam bao env `POSTGRES_PRISMA_URL` trung voi database production truoc khi chay lenh.

### 5.6 Deploy

Bam Deploy. Sau khi xong:

- Mo `/admin/login`
- Dang nhap admin
- Kiem tra CRUD post + FAQ
- Kiem tra bat/tat 2FA

---

## 6) Commands hay dung

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm prisma:generate
pnpm prisma:migrate --name <migration_name>
pnpm prisma:deploy
pnpm prisma:seed
```

---

## 7) Security hardening checklist (production)

### 7.1 Bat buoc truoc khi go-live

- Khong de `CAPTCHA_BYPASS=true` tren production.
- Su dung secret rieng cho tung muc:
  - `NEXTAUTH_SECRET`
  - `PRECHECK_HMAC_SECRET`
  - `TOTP_ENCRYPTION_KEY`
- Bat buoc 2FA cho tat ca tai khoan admin.
- Khong cho phep data URL trong noi dung bai viet/anh bia.
- Neu deploy tren Vercel (filesystem read-only), endpoint upload local se tra loi 503.

### 7.2 Backup & restore target (Vercel + Neon)

- Muc tieu da chot: **RPO 4h / RTO 2h**.
- De xuat van hanh:
  - Chay backup DB moi 4 gio.
  - Luu it nhat 7 ngay backup gan nhat.
  - Drill restore toi thieu 1 lan/thang.
- Neu dung upload local tren runtime co disk, backup them `public/uploads/posts`.

### 7.3 Log retention

- Luu log bao mat toi thieu **90 ngay**.
- Uu tien giu cac su kien:
  - Dang nhap that bai/lien tiep
  - Lockout rate limit
  - Bat/tat 2FA
  - Sua/xoa bai viet va FAQ

### 7.4 Incident runbook (uu tien)

1. **Immediate lockdown**: tam khoa dang nhap admin.
2. **Force logout**: doi `NEXTAUTH_SECRET` de invalidate toan bo admin session.
3. **Forensic-first**: dong bang log, xac dinh timeline, IP, account anh huong.
4. Sau khi khoi phuc: rotate `PRECHECK_HMAC_SECRET`, danh gia lai 2FA va mat khau admin.

### 7.5 Release gate moi lan deploy

```bash
pnpm lint
pnpm typecheck
pnpm build
```

- Xac nhan env production day du va hop le truoc khi deploy.
- Khong chay seed voi `SEED_ALLOW_PASSWORD_RESET=true` neu khong co phe duyet ro rang.
