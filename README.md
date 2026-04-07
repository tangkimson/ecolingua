# EcoLingua - Clone phong cach Xanh Viet Nam

Du an Next.js 14 (App Router) clone giao dien/luong trang cong khai theo xanhvietnam.org, kem Admin Dashboard de quan ly bai viet + lead form.

## 1) Cong nghe su dung

- Next.js 14 + TypeScript
- Tailwind CSS + component kieu shadcn/ui
- Prisma ORM
  - Local: SQLite (`prisma/schema.prisma`)
  - Production: PostgreSQL (`prisma/schema.postgres.prisma`)
- NextAuth.js (Credentials) cho trang admin
- Resend de gui email thong bao lead

## 2) Tinh nang da co

### Public pages

- `/` Trang chu
- `/gioi-thieu`
- `/tham-gia` (co form dang ky)
- `/tin-tuc`
- `/tin-tuc/[slug]`
- `/lien-he` (co form lien he)
- `/quyen-gop`

### Admin dashboard

- `/admin/login` dang nhap email/password
- `/admin` tong quan + thong bao lead moi
- `/admin/posts` CRUD bai viet
- `/admin/leads` xem danh sach lead
- `/admin/settings` doi email nhan thong bao form

### Form lead

- Submit tu trang public -> luu DB bang Prisma
- Tao thong bao trong bang `AdminNotification`
- Gui email qua Resend den email admin trong `AdminSetting`

### Bao mat co ban

- Password hash bang `bcryptjs`
- Route `/admin/*` (tru `/admin/login`) duoc bao ve bang middleware + token
- Rate limiting cho API lead (chong spam)
- Input validation voi `zod`
- Sanitize text de giam nguy co XSS
- Security headers trong `middleware.ts`
- Kiem tra `origin` cho cac API mutation de giam nguy co CSRF

---

## 3) Chay local tu dau (cho newbie)

### Yeu cau

- Node.js 18.18+ (khuyen nghi Node 20 neu co the)
- pnpm (`npm i -g pnpm`)

### Buoc 1 - cai package

```bash
pnpm install
```

```

Sau do mo `.env` va kiem tra:

- `DATABASE_URL="file:./prisma/dev.db"`
- `NEXTAUTH_SECRET` dat chuoi bat ky dai va kho doan

### Buoc 3 - tao DB va seed du lieu mau

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm prisma:seed
```

### Buoc 4 - chay dev server

```bash
pnpm dev
```

Mo [http://localhost:3000](http://localhost:3000)

### Tai khoan admin seed san

- Email: `admin@xanhvietnam.local`
- Password: `Admin@12345`

Dang nhap tai [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 4) Cau truc thu muc quan trong

```text
src/
  app/
    (public)/...           # Trang cong khai
    admin/...              # Dashboard admin
    api/...                # API route
  components/
    layout/...             # Header/Footer/Topbar
    sections/...           # Section trang chu
    forms/...              # Form contact/volunteer
    admin/...              # Component cho admin
    ui/...                 # UI component tai su dung
  lib/
    auth.ts
    prisma.ts
    validations.ts
    mail.ts
    rate-limit.ts
    security.ts
prisma/
  schema.prisma            # SQLite local
  schema.postgres.prisma   # PostgreSQL production
  seed.ts
middleware.ts
```

---

## 5) Deploy Vercel mien phi (PostgreSQL)

Huong dan theo cach de nhat cho newbie.

### Buoc A - tao database PostgreSQL

Ban co the dung:

- Neon
- Supabase
- Railway

Lay connection string PostgreSQL dang:

`postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`

### Buoc B - push code len GitHub

```bash
git init
git add .
git commit -m "Initial production-ready clone"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

### Buoc C - tao project tren Vercel

1. Dang nhap Vercel
2. Import tu GitHub repo
3. Framework chon Next.js (tu nhan)

### Buoc D - khai bao Environment Variables tren Vercel

Them cac bien:

- `POSTGRES_PRISMA_URL` = connection string PostgreSQL
- `NEXTAUTH_URL` = domain cua ban, vi du `https://your-app.vercel.app`
- `NEXTAUTH_SECRET` = chuoi dai random
- `ADMIN_NOTIFICATION_EMAIL` = email nhan lead
- `RESEND_API_KEY` = key Resend
- `RESEND_FROM_EMAIL` = sender da verify tren Resend
- `NEXT_PUBLIC_SITE_URL` = domain production

### Buoc E - Build command cho production schema PostgreSQL

Trong Vercel project settings, dat Build Command:

```bash
pnpm prisma:generate:prod && pnpm prisma:deploy:prod && pnpm build
```

Install Command:

```bash
pnpm install
```

### Buoc F - deploy

Bam Deploy. Sau khi thanh cong:

- Vao `/admin/login` dang nhap admin seed neu da seed production
- Neu production chua co data, ban can tao admin user moi bang script hoac seed data tren DB production

---

## 6) Lenh hay dung

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm prisma:generate
pnpm prisma:migrate --name <ten_migration>
pnpm prisma:seed
```

Production:

```bash
pnpm prisma:generate:prod
pnpm prisma:deploy:prod
```

---

## 7) Luu y quan trong

- Du an hien tai uu tien de hoc va de maintain.
- Neu muon "pixel-perfect" hon nua, tiep tuc tinh chinh spacing, typo, image crop va animation theo screenshot thuc te.
- Neu can chong spam manh hon, co the doi sang Upstash Redis cho rate limit phan tan.

Chuc ban setup thanh cong.
