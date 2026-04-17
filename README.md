# 📱 Instagram CRM — Lead Manager

Instagram комментарийлерден автоматтык лид табуу системасы.

---

## 🏗 Архитектура

```
instagram-crm/
├── backend/     → Node.js + Express REST API
├── frontend/    → React + Vite Admin Panel
├── parser/      → Playwright Instagram Scraper
├── database/    → SQL схемасы
└── docker-compose.yml
```

---

## 🚀 Тез Баштоо

### Вариант 1: Docker (сунушталат)

```bash
# 1. Репо клондоо / папкага кирүү
cd instagram-crm

# 2. .env файлдарды түзүү
cp backend/.env.example backend/.env
cp parser/.env.example parser/.env

# 3. Баарын иштетүү
docker-compose up -d

# 4. Браузерде ачуу
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### Вариант 2: Кол менен

#### 1. PostgreSQL базасын түзүү

```bash
createdb instagram_crm
psql -U postgres -d instagram_crm -f database/init.sql
```

#### 2. Backend

```bash
cd backend
cp .env.example .env
# .env файлды редактирлеп, DB маалыматтарын киргизиңиз

npm install
npm run dev
# → http://localhost:5000
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

#### 4. Parser

```bash
cd parser
cp .env.example .env
npm install
npx playwright install chromium

npm run dev
# Ар 8 мүнөт сайын автоматтык иштейт
```

---

## 🔐 Default Кирүү

| Email | Сырсөз | Ролу |
|-------|--------|------|
| admin@crm.com | admin123 | Admin |

> ⚠️ Биринчи кирүүдөн кийин сырсөздү өзгөртүңүз!

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/login        → { email, password }
GET  /api/auth/me           → текущий пользователь
```

### Comments
```
GET  /api/comments          → список с фильтрами
GET  /api/comments/stats    → статистика
POST /api/comments/bulk     → парсер жөнөтөт
PATCH /api/comments/:id/process → иштелди белгилөө
```

### Accounts
```
GET  /api/accounts/targets         → target тизмеси
POST /api/accounts/targets         → кошуу
PATCH /api/accounts/targets/:id/toggle → on/off
DELETE /api/accounts/targets/:id   → өчүрүү

GET  /api/accounts/parsers         → parser тизмеси
POST /api/accounts/parsers         → кошуу
DELETE /api/accounts/parsers/:id   → өчүрүү
```

### Users (Admin)
```
GET    /api/users     → тизме
POST   /api/users     → кошуу
DELETE /api/users/:id → өчүрүү
```

---

## 🔍 Лид аныктоо логикасы

Комментарий лид болот эгер:

**1. Keyword табылса:**
- цена, цену, сколько, почём
- в директ, в лс, директ
- ответьте, напишите
- dm me, how much, price
- баасы, канча, директке, жазыңыз

**2. No reply** (V2де кошулат):
- посттун автору жооп бербесе

**Статустар:**
- `new` → жаңы комментарий
- `lead` → лид аныкталды
- `processed` → менеджер иштеди

---

## 🛡️ Safety (Бан коргоо)

- Random delay: посттор арасы 3–7 сек, аккаунттар арасы 2–5 сек
- Cookie reuse: ар бир сессия сакталат
- Proxy колдоо: `ip:port:user:pass` форматы
- Media блокировка: сүрөт/видео жүктөлбөйт (ылдамдык)
- Schedule: 8 мүнөт аралыгы

---

## 📊 Frontend Барактары

| Барак | Жол | Сүрөттөмө |
|-------|-----|----------|
| Dashboard | `/` | Статистика + акыркы лиддер |
| Комментарии | `/comments` | Бардык комментарий + фильтр |
| Лиды | `/leads` | Лиддер карточкалары |
| Аккаунттар | `/accounts` | Target + Parser аккаунттар |
| Пользователи | `/users` | Admin гана |

---

## 🔧 .env Конфигурация

### backend/.env
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=instagram_crm
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=minimum_32_char_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### parser/.env
```env
BACKEND_URL=http://localhost:5000/api
PARSER_SECRET=parser_internal_secret
```

---

## 📦 Технологиялар

| Бөлүм | Технология |
|-------|-----------|
| Backend | Node.js, Express, Sequelize, PostgreSQL |
| Frontend | React 18, Vite, Zustand, Axios |
| Parser | Playwright (Chromium), node-cron |
| Auth | JWT + bcrypt |
| Deploy | Docker, docker-compose |

---

## 🚀 V2 Планы

- [ ] Telegram уведомления (жаңы лид → сигнал)
- [ ] Direct automation
- [ ] Instagram Graph API интеграция
- [ ] Авто-жооп шаблондору
- [ ] Аналитика графиктери

---

## ⚠️ Эскертүү

Instagram парсинг Terms of Service'ге каршы. Коммерциялык максатта колдонуу коркунуч жаратышы мүмкүн. Бул проект окуу максатында гана.
