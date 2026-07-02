# DosuMart - Hệ thống bán lẻ Omnichannel

Hệ thống gồm 3 ứng dụng frontend + 1 backend API:

| Ứng dụng | URL dev | Mô tả |
|----------|---------|-------|
| Storefront | http://localhost:5173 | Website bán hàng cho khách |
| Admin | http://localhost:5174 | Trang quản trị |
| POS | http://localhost:5175 | Bán hàng tại quầy |
| API + Swagger | http://localhost:3000/api/docs | Backend NestJS |

## Yêu cầu hệ thống

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 15+ (cài trực tiếp trên máy, **không dùng Docker**)
- Redis (tùy chọn, cho cache/queue sau này)

## Cài đặt

### 1. Cài PostgreSQL

Tạo database:

```sql
CREATE DATABASE dosumart;
```

### 2. Cấu hình backend

```bash
cd apps/backend
cp .env.example .env
# Sửa DATABASE_URL trong .env cho đúng PostgreSQL của bạn
```

### 3. Cài dependencies

```bash
# Từ thư mục gốc dự án
pnpm install
```

### 4. Đồng bộ schema DB & Seed

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

`db:push` đồng bộ schema Prisma thẳng lên PostgreSQL (không dùng migration files).

### 5. Chạy development

```bash
# Chạy tất cả (backend + 3 frontend)
pnpm dev

# Hoặc chạy riêng từng phần
pnpm dev:backend      # API :3000
pnpm dev:storefront   # :5173
pnpm dev:admin        # :5174
pnpm dev:pos          # :5175
```

## Tài khoản demo (sau seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Quản trị | admin@dosumart.vn | 123456 |
| Thu ngân | thungan@dosumart.vn | 123456 |
| Khách hàng | khach@dosumart.vn | 123456 |

## Cấu trúc dự án

```
dosumart/
├── apps/
│   ├── backend/          # NestJS + Prisma
│   ├── storefront/       # React + Vite
│   ├── admin/            # React + Vite
│   └── pos/              # React + Vite
├── packages/
│   ├── api/              # Axios client
│   ├── types/            # TypeScript types
│   ├── constants/        # Hằng số
│   ├── utils/            # Tiện ích
│   ├── stores/           # Zustand stores
│   └── ui/               # UI components dùng chung
└── package.json          # Monorepo root
```

## Kiến trúc

- **Backend**: NestJS Modular Monolith, Domain-driven
- **Database**: PostgreSQL + Prisma, soft delete, inventory qua `InventoryTransaction`
- **Auth**: JWT access (15 phút) + refresh token (7 ngày, httpOnly cookie)
- **Events**: EventEmitter2 (order.created → cập nhật báo cáo)
- **Frontend**: React 19 + Vite, TanStack Query, Zustand, Tailwind CSS

## Triển khai production (không Docker)

1. Build frontend: `pnpm build`
2. Build backend: `pnpm --filter @dosumart/backend build`
3. Dùng PM2 hoặc Windows Service chạy `node dist/main`
4. Nginx reverse proxy phục vụ static files + proxy `/api` tới backend
5. PostgreSQL và Redis chạy native trên server

## Biến môi trường frontend

Tạo file `.env` trong mỗi app frontend:

```
VITE_API_URL=http://localhost:3000/api
```
