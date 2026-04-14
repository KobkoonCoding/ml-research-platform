# Web Application Redesign & Feature Expansion Blueprint

## 🎯 1. Project Objective
เป้าหมายของโปรเจกต์นี้คือการ Redesign เว็บแอปพลิเคชันเดิม และเพิ่มฟีเจอร์ใหม่ โดยต้องการยกระดับ UI/UX ให้มีความสวยงาม ใช้งานง่าย และดูเป็นมืออาชีพระดับโลก (World-class) ระบบหลังบ้านเดิมทำงานได้ดีแล้วบางส่วน แต่ต้องการขยายขีดความสามารถและจัดระเบียบโครงสร้างใหม่ทั้งหมด
กฎสำคัญคือ: ให้เลือกใช้สกิลให้เหมาะกับงานนั้นๆ โดยเข้าไปหา skill ได้ที่ \.agents\skills


## 📐 2. Architecture & UI/UX Guidelines
* **Independent Modules:** ทุก Module ต้องแยกการทำงานออกจากกันอย่างเด็ดขาด (Routing, State) การทำงานใน Module หนึ่งต้องไม่กระทบกับ Module อื่น
* **Landing Page:** สร้างหน้าแรกสำหรับเป็นศูนย์กลาง นำเสนอภาพรวมของแต่ละ Module อย่างโดดเด่น และให้ผู้ใช้คลิกเลือกเข้าสู่หมวดที่ต้องการ เช่น
• Hero Section: นำเสนอภาพรวมของแพลตฟอร์มด้วยกราฟิกที่ดูทันสมัย (Modern Minimalist) หรือ Interactive 3D เบาๆ
• Module Navigation: การ์ดเมนู 3 ใบที่ออกแบบให้โดดเด่น กดคลิกเพื่อไปยังแต่ละ Module ได้ทันที (แยก URL Path ชัดเจน) มี animation สวยๆ framer motion การ์ดขยับแบบ stunning ตอนเลื่อนลง
• มีการอธิบายแต่ละอัน นำเสนอ ดีๆ ผมใช้ คณิตศาสตร์มาผสมกับ machine learning present ดีๆ

* **UI/UX:** อัปเกรดหน้าตาให้ทันสมัย โดยยังคงใช้ React เป็นแกนหลัก แต่สามารถนำ Tailwind CSS หรือ UI Components สมัยใหม่มาประยุกต์ใช้ร่วมกับ Vanilla CSS เดิมได้ 

---

## 🧩 3. Module Specifications

### 📍 Landing Page
* หน้าแรกสำหรับต้อนรับผู้ใช้งาน
* มีเมนูหรือการ์ดสำหรับอธิบายและนำทางไปยัง Module 1, 2 และ 3

### 📊 Module 1: Data Preparation & Basic Model (ระบบเดิม)
* **เป้าหมาย:** สำหรับทำความสะอาดข้อมูล (Data Cleaning) และทดสอบโมเดลเบื้องต้น
* **Features:**
* อัปโหลดไฟล์ `.csv`, `.xlsx`
* Preprocessing ข้อมูล
* ทดสอบนำข้อมูลไปรันกับโมเดลพื้นฐานเพื่อดูประสิทธิภาพ
* *หมายเหตุ:* ใช้โครงสร้างเดิมที่มีอยู่แล้ว นำมาจัดวางใน UI ใหม่

### 🧠 Module 2: ELM Studio (ระบบใหม่)
* **เป้าหมาย:** ระบบ Train และ Predict โดยใช้ Extreme Learning Machine (ELM)
* **Step 1: Data Input & Setup**
* ผู้ใช้อัปโหลด Dataset (`.csv`, `.xlsx`) แยกต่างหากจาก Module 1
* แสดง Preview Dataset และสรุปข้อมูลเบื้องต้น
* ฟีเจอร์ Auto-fill missing values
* ให้ผู้ใช้สามารถเลือกตัด Column ที่ไม่ต้องการ และเลือก Column ที่จะเป็น Target (สำหรับการทำ Predict)
* **Step 2: Model Training**
* UI สำหรับปรับตั้งค่า `Number of hidden nodes` ของ ELM
* เมนู `Advanced Settings` สำหรับการตั้งค่าเชิงลึก (สามารถกดซ่อน/แสดงได้)
* เมื่อกดปุ่ม "Train": ระบบจะต้องนำข้อมูลไปทำ Min-Max Scaler ให้เหมาะสมก่อนนำเข้าโมเดล
* **Step 3: Evaluation & Prediction**
* หลัง Train เสร็จ แสดงผลลัพธ์ประสิทธิภาพโมเดล: `Accuracy`, `F1-Score`, `Recall`, `Precision`
* แสดง Input Box อัตโนมัติ (ตามจำนวน Column ของ Dataset ที่ใช้ Train)
* เมื่อกรอกข้อมูลและกดปุ่ม "Predict":
1. นำข้อมูล Input ไปผ่าน Min-Max Scaler (ใช้ค่าเดิมจากตอน Train)
2. นำเข้าโมเดล (ใช้ Weight ที่ Train ไว้แล้วจาก Step 2)
3. แสดงผลคำทำนายว่าข้อมูลนี้อยู่ Class อะไร พร้อมแสดงค่าความน่าจะเป็น (Probability)

### 🔬 Module 3: Deep Learning & Future Work (ระบบใหม่)
* **เป้าหมาย:** สำหรับนำ Research Paper มาประยุกต์ใช้กับ Deep Learning แบ่งเป็น 2 ส่วนย่อย
* **3.1 Image Classification (Future Work):**
* รองรับโมเดลเช่น CNN, EfficientNetV2
* ผู้ใช้อัปโหลดรูปภาพ ระบบจะทำนายว่าเป็นภาพอะไร (เช่น การจำแนก Cat, Dog, Other แบบง่ายๆ)
* **3.2 Tabular Health Data (Future Work):**
* รองรับข้อมูลแบบ User Input ด้านสุขภาพ
* ใช้สำหรับทำนายโรค (เช่น โรคความดันโลหิตสูง - Hypertension)

---

ให้แบ่งเป็น 4 phase 
phase 1 ทำ landing page (ใช้ skill อยากให้มี 3d หรือ motion สวยๆ)
phase 2 ปรับ module 1 (redesign ใหม่ ให้มันดูใช้ง่าย ไม่ซับซ้อน)
phase 3 ทำ Module 2: ELM Studio (ระบบใหม่) 
phase 4 ทำ Module 3: Deep Learning & Future Work (ระบบใหม่) 

ทุก phase ต้องมี animation, 3d, motion ระดับ high class และใช้ง่าย 

ให้ทำทีละ phase พอจบ แต่ละ phase ให้คุณตรวจ และ อธิบายฉัน รอฉัน approve ก่อนไป phase อื่น

