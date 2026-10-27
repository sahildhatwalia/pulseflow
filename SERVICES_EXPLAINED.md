# 🏥 PulseFlow — What Does Our Website Actually Do?
### (Written for someone who is NOT from a tech background)

---

## What is PulseFlow?

PulseFlow is a **digital management system for hospital emergency departments**.

Think of it like an **air traffic control center, but for a hospital's waiting room and emergency department**. Instead of tracking planes, it tracks patients — who is waiting, how sick they are, who sees a doctor next, and how long everyone has to wait.

It is used by **three types of people**:
- 🧑‍⚕️ **Doctors & Nurses** — to manage and treat patients
- 🛡️ **Hospital Administrators** — to oversee everything and make special decisions
- 🧑‍🤝‍🧑 **Patients** — to check in and track their own wait time

---

## 📋 Services We Provide

---

### 1. 🚪 Self Check-In Kiosk
**What it does:**
When a patient arrives at the hospital, instead of standing in a long line at the front desk, they can **check themselves in directly on the website** — like checking in for a flight online.

They enter:
- Their name
- Date of birth
- Phone number
- What problem/symptoms they have (e.g., "chest pain")
- How much pain they are feeling on a scale of 0–10

**What happens next:**
The system gives them a **secret ticket number** (like `PT-5120`). This ticket is their identity on the public waiting room screen — it protects their privacy because their real name is never shown in public.

---

### 2. 📺 Live Waiting Room Board
**What it does:**
Think of the **departure boards you see at airports**. PulseFlow shows a real-time screen in the waiting room that tells every patient:
- Their ticket number (e.g., `PT-5120`)
- What stage they are at (e.g., "In Triage", "Waiting for Bed")
- **How many minutes they are estimated to wait**
- Whether their wait time is going up ⬆️ or down ⬇️

The screen updates **automatically every few seconds** — nobody needs to refresh it. It's always live.

---

### 3. 🔍 My Queue Tracker (Personal Wait Time Lookup)
**What it does:**
If a patient wants to know specifically **where THEY are in the queue**, they can enter their ticket number (the one they got at check-in) and see a personal progress tracker.

It shows a step-by-step journey:
1. ✅ Registration done
2. 🔄 Being triaged (nurse checking vitals)
3. ⏳ Waiting for a bed/exam room
4. 🏥 In the exam room with the doctor
5. 🏠 Ready to go home

It also shows a **red alert warning** if their symptoms worsen — reminding them to immediately tell the nurse.

---

### 4. 🤖 AI-Powered Triage Prediction
**What it does:**
When a nurse or doctor enters a patient's vitals and symptoms into the system, **an Artificial Intelligence instantly analyzes the data** and gives a recommended severity score called an **ESI Level (1–5)**.

- **ESI 1** = Immediate life-threatening emergency (e.g., heart attack)
- **ESI 5** = Minor issue (e.g., a small cut)

The AI also explains **why** it gave that score, in plain clinical language — so the nurse knows what the machine is thinking and can agree or disagree.

**Why this helps:**
It helps nurses make faster, more accurate decisions, especially when the hospital is very busy and there are many patients at once.

---

### 5. 👩‍⚕️ Staff Triage Dashboard
**What it does:**
This is the **main control panel for nurses and clinical staff**. It shows all patients currently in the department with full details:
- Patient name and age
- Their vital signs (heart rate, blood pressure, oxygen levels, etc.)
- Their symptoms and pain level
- Their ESI priority score
- Which doctor/nurse is assigned to them
- Which exam room they are in

Staff can **change a patient's status** (e.g., move them from "Waiting" to "In Treatment") and assign them to specific rooms — all from this one screen.

---

### 6. 🛡️ Admin Priority Override
**What it does:**
Sometimes in emergencies, a patient needs to **jump the queue** — for example, someone who walked in looking okay but is actually very critical.

The **Administrator or Charge Nurse** can manually change a patient's priority level using this tool. However, the system requires them to **write a reason** (called a "clinical justification") before making the change. This is to prevent misuse and to keep a record for legal compliance.

---

### 7. 🏨 Room & Bed Management
**What it does:**
The system tracks **every exam room and bed** in the department — which ones are empty, which are occupied, and which are being cleaned.

When a patient is ready to be moved from the waiting room to an exam bay, the nurse can **assign them to a specific room directly from the screen**, and the patient's name (or rather, their ticket number) automatically disappears from the waiting board and gets marked as "Now Serving."

---

### 8. 📊 Analytics Dashboard
**What it does:**
This is a **report card for the hospital's performance**. It tracks important numbers like:
- **Door-to-Doctor Time** — how long on average does it take from when a patient arrives to when they see a doctor?
- **LWBS Rate (Left Without Being Seen)** — how many patients got frustrated and left before being treated?
- **Bed Turnover Rate** — how quickly are beds becoming available after a patient leaves?
- **Hourly Surge Data** — which hours of the day are the busiest?

Hospital managers use these numbers to make better decisions, like scheduling more staff on busy hours.

---

### 9. 🔒 HIPAA Compliance & Audit Log
**What it does:**
In the USA, there is a law called **HIPAA** that protects patient medical information. PulseFlow is built to follow this law strictly.

Here's how we protect patient privacy:
- **Public screens** (visible to everyone in the waiting room) only show ticket numbers — **never real names, birthdates, or medical info**.
- **Staff screens** show full details, but every single time someone views or changes patient data, it is **automatically recorded in an audit log** (like a security camera for data).
- Every record in the audit log has a **tamper-proof code** (called a SHA-256 hash) — if anyone tries to secretly edit or delete a record, the system will detect it.

Administrators can also **download the full audit log as a file** for legal reporting purposes.

---

### 10. 🔐 Secure Login & Role-Based Access
**What it does:**
Not everyone who uses PulseFlow gets to see the same things. The system has **three levels of access**:

| Role | What They Can Do |
|------|-----------------|
| **Patient / Public** | See the waiting board, check in, track their ticket |
| **Staff / Nurse** | Full patient details, triage tools, room assignments |
| **Admin / Charge Nurse** | Everything above + priority overrides + department settings |

When you log in, the system recognizes **who you are** and shows only the tools appropriate for your role. This protects sensitive medical information from being seen by the wrong people.

---

### 11. ⚡ Real-Time Live Updates (No Page Refresh Needed)
**What it does:**
All screens in PulseFlow **update automatically and instantly** — like a live sports scoreboard.

When a nurse updates a patient's status on her computer, **every other screen in the hospital** (the waiting room display, another nurse's tablet, the admin dashboard) updates within seconds — **without anyone pressing a refresh button**.

This is powered by a technology called **WebSockets** — imagine it like a phone call that stays open 24/7 between all devices in the hospital.

---

### 12. 🏥 Multi-Department Support
**What it does:**
Hospitals have multiple departments — Emergency, Cardiology, Pediatrics, etc. PulseFlow can **manage all of them separately** from one system.

Administrators can switch between departments and see each one's:
- Current queue of patients
- Average wait times
- Bed availability
- Staff count (active doctors and nurses)
- **Surge Status** — whether the department is Normal, Moderate, or at Critical capacity

If a department is completely full, administrators can activate **Ambulance Diversion** — which alerts incoming ambulances to go to a different hospital.

---

## 🧩 Summary in One Sentence

> **PulseFlow is a real-time, AI-assisted hospital emergency room management system that helps patients check in easily, helps nurses triage faster and smarter, helps doctors track all their patients in one place, helps administrators make better decisions, and does all of this while keeping every patient's personal information 100% private and legally protected.**

---

*This document was written in plain English for non-technical stakeholders, investors, and hospital administrators.*


<!-- for me  -->
What PulseFlow is

PulseFlow is an emergency department (ER) workflow tool. It handles patient check-in and triage, a live queue and bed management, exam bay assignment, admin priority overrides, privacy-masked waiting room displays, and an analytics dashboard.

Stack and architecture (from your files)
Frontend: React 19 with Vite and TailwindCSS 4, plus lucide-react icons and motion animations.
Backend: Node and Express, started from server/src/server.js. In dev, Express serves the API and also hosts the Vite frontend as middleware. In production it serves client/dist statically.
Real-time: Socket.io pushes queue, room and status changes to every connected device.
AI: @google/genai (Gemini 2.5 Flash) predicts the ESI triage level. groq-sdk is also installed, but the README never mentions it.
Config: dotenv loads GEMINI_API_KEY. If the key is missing, the AI features fall back instead of crashing the server.
Algorithms and key factors

1. AI triage (ESI 1-5). This is an LLM call, not a hand-written algorithm.

The server probably builds a prompt from vitals and complaint, sends it to Gemini, and parses a score and rationale from the response.
The important points are prompt design, forcing structured JSON output, validating the result is between 1 and 5, and the fallback path.
The AI should only suggest. The nurse should always be able to override it.

2. Queue priority and wait-time estimation. This is likely the core logic.

It is probably a priority queue sorted by ESI level first, then arrival time (FIFO within the same level).
Sorting is O(n log n). A heap would give O(log n) per insert.
Wait time is likely estimated from queue position, department, available providers and bed saturation. That is a heuristic rather than a proven algorithm, so its assumptions matter.
A common problem to watch for is starvation, where low-acuity patients wait forever. Systems often add an aging boost to the score over time.

3. Real-time sync. Server events are broadcast to all clients. Look at whether you use rooms or namespaces, and what happens when a client reconnects.

4. Bed and bay assignment. A state transition on both the patient and the room. The main risk is a race condition, where two nurses assign the same bay at once. Check whether the check-and-assign is atomic.

5. Override with audit logging. A role check, a mandatory justification, and a log entry. This is a compliance feature, so the log should be append-only.

6. PHI masking. A token ID like PT-4190 replaces the patient’s identity in public views. The key question is whether masking happens on the server or only in the UI. It must be server-side, otherwise the data is still in the network response.

7. Analytics. Door-to-Doctor time, LWBS rate, bed turnover and hourly surge. These are aggregations over timestamps.

Issues I noticed
Merge conflict markers in the README. It contains leftover <<<<<<< HEAD, ======= and >>>>>>> lines. Clean those up before showing the repo to anyone.
Name and scripts. The package is still named react-example, and "lint" just runs vite build, so it doesn’t lint anything.
Unused or undocumented dependency. groq-sdk is installed but not documented.
Healthcare data. If you present this as HIPAA-compliant, expect questions about authentication, role-based access, encryption and storage. A student demo can say “HIPAA-inspired” rather than compliant.
What I need to go deeper

Paste these files here and I’ll do a line-by-line explanation with complexity analysis and a worked example for each algorithm:

server/src/server.js
The files where the queue and triage logic live (probably under server/src/, such as routes, services or utils)
Any file with the Gemini prompt

Once I have them, I can also prepare interview questions and answers for the project.