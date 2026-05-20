# 🥗 NutriTrack — ระบบบันทึกโภชนาการ

เว็บแอปพลิเคชันบันทึกข้อมูลโภชนาการและการออกกำลังกายประจำวัน สร้างด้วย Vue 3 + Vuetify 3 (Frontend) และ Node.js + Express (Backend)

---

## 📁 โครงสร้างโปรเจค

```
nutrition-tracker/
├── frontend/          ← Vue 3 + Vuetify 3 (Vite)
│   ├── src/
│   │   ├── views/     ← หน้าต่างๆ (Dashboard, FoodLog, Activity, Reports, Goals)
│   │   ├── components/
│   │   ├── stores/    ← Pinia state management
│   │   ├── router/    ← Vue Router
│   │   └── plugins/   ← Axios instance
│   └── vite.config.js
│
├── backend/           ← Node.js + Express REST API
│   ├── src/
│   │   ├── server.js  ← Entry point
│   │   ├── routes/    ← auth, foodLogs, activities, goals
│   │   ├── middleware/ ← JWT authentication
│   │   └── database/  ← lowdb JSON database
│   └── .env.example
│
└── data/              ← JSON database (สร้างอัตโนมัติ)
```

---

## 🚀 วิธีติดตั้งและรัน

### ข้อกำหนด
- Node.js v18+ (แนะนำ v20+)
- npm v9+

### 1. ติดตั้ง dependencies

```bash
# ติดตั้ง backend
cd backend
npm install

# ติดตั้ง frontend
cd ../frontend
npm install
```

### 2. ตั้งค่า Environment Variables (Backend)

```bash
cd backend
cp .env.example .env
# แก้ไข JWT_SECRET ใน .env
```

### 3. รันระบบ (แยก 2 terminal)

**Terminal 1 — Backend API (port 3001)**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend Dev Server (port 5173)**
```bash
cd frontend
npm run dev
```

### 4. เปิดเบราว์เซอร์

```
http://localhost:5173
```

**Demo account:** `demo@nutritrack.com` / `password123`

---

## ✨ ฟีเจอร์หลัก

### 🍽️ บันทึกอาหาร (Food Log)
- แบ่งมื้ออาหาร: เช้า / กลางวัน / เย็น / อาหารว่าง
- ค้นหาจากฐานข้อมูลอาหารไทย (10+ รายการ) หรือกรอกเอง
- บันทึกสารอาหารครบทุกตัว:
  - พลังงาน (kcal)
  - คาร์โบไฮเดรต, โปรตีน, ไขมัน (g)
  - น้ำตาล, โซเดียม (mg), คอเลสเตอรอล (mg)
- ตารางรายการอาหารในแต่ละมื้อ

### 🏃 กิจกรรมออกกำลังกาย (Activity)
- บันทึกชื่อกิจกรรม, ประเภท, ความเข้มข้น, ระยะเวลา
- คำนวณแคลอรี่ที่เผาผลาญ
- กิจกรรมสำเร็จรูป 8 รายการ (วิ่ง, ว่ายน้ำ, ยกน้ำหนัก ฯลฯ)
- กราฟโดนัทแสดงสัดส่วนการเผาผลาญตามประเภท

### 📊 แดชบอร์ด (Dashboard)
- สรุปแคลอรี่: รับเข้า / เผาผลาญ / สุทธิ / เป้าหมาย
- Progress bar สารอาหารทุกตัว เทียบกับเป้าหมาย
- Doughnut chart สัดส่วน macro nutrients
- สรุปมื้ออาหารและกิจกรรมในวันนั้น

### 📈 รายงานและกราฟ (Reports)
- เลือกช่วงเวลา: 7 / 14 / 30 วัน
- Bar chart: แคลอรี่รับเข้า vs เผาผลาญ + เส้นเป้าหมาย
- Line chart: แนวโน้มสารอาหารหลัก (คาร์บ / โปรตีน / ไขมัน)
- ตารางสรุปรายวัน พร้อมค่าสุทธิ
- วิเคราะห์การบรรลุเป้าหมายเป็น %

### 🎯 เป้าหมาย (Goals)
- ตั้งค่าเป้าหมายสารอาหารทุกตัวต่อวัน
- Doughnut preview สัดส่วน macro ตามเป้าหมาย
- แนวทางอ้างอิงจาก WHO

---

## 🔌 API Endpoints

```
POST   /api/auth/register       สมัครสมาชิก
POST   /api/auth/login          เข้าสู่ระบบ

GET    /api/goals               ดึงเป้าหมายปัจจุบัน
POST   /api/goals               บันทึกเป้าหมาย

GET    /api/food-logs?date=     ดึงบันทึกอาหารตามวันที่
POST   /api/food-logs           เพิ่มรายการอาหาร
DELETE /api/food-logs/:id       ลบรายการอาหาร
GET    /api/food-logs/summary   สรุปรายวัน (ช่วงวันที่)

GET    /api/activities?date=    ดึงกิจกรรมตามวันที่
POST   /api/activities          เพิ่มกิจกรรม
DELETE /api/activities/:id      ลบกิจกรรม
GET    /api/activities/summary  สรุปรายวัน (ช่วงวันที่)

GET    /api/food-items?q=       ค้นหาอาหาร
POST   /api/food-items          เพิ่มอาหารใหม่
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Vue 3 (Composition API) |
| UI Library | Vuetify 3 (Material Design) |
| State Management | Pinia |
| Router | Vue Router 4 |
| Build Tool | Vite |
| Charts | Chart.js + vue-chartjs |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| Database | lowdb (JSON file-based) |
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |

---

## 📝 หมายเหตุ

- ฐานข้อมูลเก็บในไฟล์ `data/db.json` (เหมาะสำหรับ development)
- สำหรับ production ควรเปลี่ยนไปใช้ PostgreSQL หรือ MySQL
- เปลี่ยน `JWT_SECRET` ใน `.env` ก่อนใช้งานจริง
