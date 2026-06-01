# Antigravity Phase Documentation (ต่อจาก Cross)

เอกสารนี้สรุปรายละเอียดทั้งหมดที่ได้ดำเนินการแก้ไขและพัฒนาเพิ่มเติมในโปรเจกต์ `stock-vision` โดยทีม Antigravity (รับช่วงต่อจาก Cross) เพื่อให้สามารถนำไปพัฒนาต่อยอดได้ทันที

---

## 1. ฟีเจอร์ใหม่: DCA Calculator (เครื่องมือคำนวณดอกเบี้ยทบต้น)
**ไฟล์ที่แก้ไข/สร้างใหม่:** `src/pages/DcaCalculatorPage.jsx`, `src/App.jsx`

**รายละเอียดการทำงาน:**
- เป็นหน้าเว็บสำหรับจำลองผลลัพธ์การลงทุนแบบถัวเฉลี่ยต้นทุน (Dollar Cost Averaging - DCA) แบบรายเดือน 
- เพิ่มฟังก์ชันให้ผู้ใช้สามารถปรับแต่งตัวเลขได้ 2 แบบ:
  1. เลื่อนสไลเดอร์ (Range Slider)
  2. พิมพ์ตัวเลขลงไปตรงๆ (Number Input) ซึ่งรองรับการอัปเดตแบบ Real-time ตามที่พิมพ์
- มีกราฟิกหลอดสี (Progress Bar) แสดงสัดส่วนระหว่าง "เงินต้น" (Principal) กับ "กำไรทบต้น" (Interest)
- **ปรับ UI:** เปลี่ยนสีพื้นหลังของแถบ Slider ให้มีคอนทราสต์ชัดเจนขึ้น และใช้ดีไซน์กล่อง Glassmorphism

**สูตรการคำนวณ (Compound Interest Formula):**
ในฟังก์ชัน `useEffect` ใช้สูตรดอกเบี้ยทบต้นรายเดือนดังนี้:
```javascript
// P = เงินลงทุนต่อเดือน (monthly)
// r = อัตราผลตอบแทนต่อปีในรูปทศนิยม (rate / 100)
// n = จำนวนครั้งที่ทบต้นต่อปี (12 ครั้ง)
// t = จำนวนปีที่ลงทุน (years)

// 1. คำนวณเงินต้นทั้งหมด
const principal = P * n * t;

// 2. คำนวณมูลค่าในอนาคต (Future Value) 
// สูตร: FV = P * (((1 + r/n)^(nt) - 1) / (r/n))
let futureValue = 0;
if (r === 0) {
  futureValue = principal;
} else {
  futureValue = P * ((Math.pow(1 + r/n, n * t) - 1) / (r/n));
}

// 3. คำนวณกำไร
const interest = futureValue - principal;
```

---

## 2. การอัปเกรดระบบ Profile & Community
**ไฟล์ที่แก้ไข:** `server/db.js`, `server/routes/auth.js`, `server/routes/portfolio.js`, `src/pages/PortfolioPage.jsx`, `src/pages/CommunityPage.jsx`

**รายละเอียดการทำงาน:**
- **Database Migration:** เพิ่มคอลัมน์ `theme_color` และ `avatar_emoji` ลงในตาราง `users` เพื่อให้ผู้ใช้สามารถตกแต่งพอร์ตของตัวเองได้
- **Backend API:**
  - สร้าง Endpoint `PUT /api/auth/profile` สำหรับอัปเดตข้อมูลสีและอิโมจิ
  - อัปเดต `GET /api/portfolio/community` และ `GET /api/portfolio/share/:token` ให้ส่งข้อมูลสีและอิโมจิกลับไปแสดงผล
- **Frontend UI:**
  - สร้างปุ่ม "โปรไฟล์" ในหน้า `PortfolioPage.jsx` ซึ่งเปิด Modal ให้ออกแบบสีและการ์ดได้
  - ในหน้า `CommunityPage.jsx` เปลี่ยนการแสดงผลให้ใช้สี `theme_color` ตามที่ผู้ใช้เลือก 
  - ลบปุ่ม "ดูพอร์ต" อันเล็กๆ ออก และแก้ให้ **คลิกที่การ์ดได้ทั้งใบ** เพื่อเข้าสู่พอร์ต (เหมือนการ์ด CEO)
  - ลบอิโมจิแนว AI ออก และเปลี่ยนไปใช้ไอคอนแบบทางการจากไลบรารี `lucide-react` (เช่น `<FolderOpen>`, `<Users>`, `<ImageOff>`)

---

## 3. ระบบโลโก้บริษัท (Company Logos)
**ไฟล์ที่แก้ไข/สร้างใหม่:** `src/components/LogoAvatar.jsx`, `src/pages/CommunityPage.jsx`, `src/pages/InvestorsPage.jsx`, `src/pages/CeoPortfolioDetail.jsx`

**รายละเอียดการทำงาน:**
- สร้างคอมโพเนนต์ `<LogoAvatar />` ที่ใช้ดึงรูปโลโก้จริงจากบริการฟรี `https://logo.clearbit.com/[domain]`
- มีระบบ Mapping ภายในโค้ดเพื่อแมป Ticker ดังๆ เข้ากับโดเมน (เช่น AAPL -> apple.com)
- **ระบบ Fallback:** มีฟังก์ชันตรวจสอบภาพ ถ้าโหลดภาพไม่ได้ (ไม่มีโดเมนในระบบ หรือเป็นบริษัทเล็ก) หรือเกิด Error จะสลับกลับไปแสดงตัวอักษร 2 ตัวแรก (Initials) พร้อมสีพื้นหลังแบบพรีเมียมโดยอัตโนมัติ

---

## 4. ฐานข้อมูลนักลงทุนระดับโลก (Legendary Investors)
**ไฟล์ที่แก้ไข:** `server/routes/investors.js`

**รายละเอียดการทำงาน:**
- เพิ่มข้อมูลจำลองของนักลงทุนระดับโลกให้ครบ 10 คน (จากเดิม 5 คน) 
- รายชื่อที่เพิ่มใหม่:
  1. Carl Icahn (Activist)
  2. George Soros (Macro)
  3. Stanley Druckenmiller (Macro/Growth)
  4. David Tepper (Distressed/Value)
  5. Seth Klarman (Deep Value)
- ข้อมูลของแต่ละคนจะมี Holding (พอร์ตจำลอง), สไตล์การลงทุน, สัดส่วน (% Weight), และประวัติสั้นๆ (Bio) 

---

## 5. การแก้บั๊ก และ UX/UI อื่นๆ ที่ผ่านมา
- **แก้บั๊กแสดงผล `$NaN`:** ในไฟล์ `CeoPortfolioDetail.jsx` มีการดึงฟิลด์ `avg_cost` ผิด จึงแก้ไขให้ดึง `pos.cost` แทน ทำให้ข้อมูล Cost และ P&L กลับมาแสดงตัวเลขได้อย่างถูกต้อง
- **แปลภาษา & จัด Layout `LearnPage.jsx`:** รื้อโครงสร้างใหม่ ทำเนื้อหาความรู้ทางการเงินเป็นภาษาไทยล้วน และใช้ระบบ Accordion ขยายเนื้อหาเพื่อไม่ให้หน้าเว็บรก
- **Call-To-Action (CTA) Boxes:** เพิ่มกล่องเชิญชวน (Gradient Box) สีสันพรีเมียมในหน้า Dashboard, Investors, และ Community เพื่อไกด์ผู้ใช้ (User Flow) เช่น ชวนไปคำนวณ DCA หรือชวนไปเปิดพอร์ตเป็น Public
- **Navigation Menu:** เปลี่ยนชื่อเมนูจาก "เรียนรู้" เป็น "Investment Education" ตามรีเควส และเพิ่มแท็บเชื่อมโยงไปหน้า DCA Calculator ใน `Header.jsx`

> **Note สำหรับคนทำต่อ:** ระบบส่วนใหญ่รองรับการ Scale และใช้ตัวแปร CSS Variable เป็นหลัก (ใน `index.css`) หากจะแก้โทนสีภาพรวม ให้ไปแก้ที่ `index.css` ได้เลย ส่วนของฐานข้อมูลถูกตั้งไว้ให้ทำ Migration อัตโนมัติเมื่อเพิ่ม Schema ใหม่ใน `server/db.js`
