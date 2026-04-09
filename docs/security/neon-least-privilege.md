# Neon least privilege (free-tier friendly)

## 1) Tạo roles tách biệt

```sql
-- App runtime role: chỉ quyền cần thiết cho CRUD.
CREATE ROLE ecolingua_app LOGIN PASSWORD '<strong-password>';

-- Migration role: dùng riêng cho prisma migrate deploy.
CREATE ROLE ecolingua_migrator LOGIN PASSWORD '<strong-password>';
```

## 2) Cấp quyền tối thiểu

```sql
GRANT CONNECT ON DATABASE <db_name> TO ecolingua_app, ecolingua_migrator;
GRANT USAGE ON SCHEMA public TO ecolingua_app, ecolingua_migrator;

-- App role chỉ thao tác dữ liệu.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ecolingua_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ecolingua_app;

-- Migrator có quyền DDL.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecolingua_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecolingua_migrator;
GRANT CREATE ON SCHEMA public TO ecolingua_migrator;
```

## 3) Default privileges cho bảng mới

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecolingua_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO ecolingua_app;
```

## 4) Env tách riêng

- App runtime (`POSTGRES_PRISMA_URL`) dùng `ecolingua_app`.
- Pipeline migration (`pnpm prisma:deploy`) dùng `ecolingua_migrator`.
- Luôn dùng `sslmode=require`.

## 5) Vận hành

- Rotate password role định kỳ (ít nhất mỗi quý).
- Nếu nghi lộ secret: rotate ngay + revoke session + redeploy.
- Kiểm tra backup/PITR khả dụng theo free plan hiện tại.
