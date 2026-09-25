# PulseFlow

## ✨ Features & Usecases

PulseFlow is designed to optimize emergency department workflows and triage accuracy. Here are the core use cases supported:

1. **Rapid Patient Intake & Triage**
   - **Feature**: Clinical staff can check-in patients quickly, recording vital signs and chief complaints.
   - **AI Integration**: Powered by the **Groq API**, triage nurses can request an AI-generated Emergency Severity Index (ESI) prediction (1-5) based on the patient's vitals and symptoms, complete with clinical rationale.
   
2. **Real-time Queue & Bed Management**
   - **Feature**: The live queue automatically recalculates wait times across different departments based on patient acuity, available providers, and bed saturation.
   - **Real-time Sync**: Uses **Socket.io** to instantly push queue updates, room assignments, and clinical status changes to all connected devices without refreshing.

3. **Clinical Priority Override (Admin)**
   - **Feature**: Authorized administrators and charge nurses can manually override a patient's ESI level or priority score for critical edge-cases, with mandatory justification logging for compliance.

4. **Exam Bay Assignments**
   - **Feature**: Seamlessly transition patients from the waiting room directly into available clinical bays or exam suites, updating the status of both the patient and the room in real-time.

5. **HIPAA-Compliant Displays**
   - **Feature**: Patient information is automatically scrubbed or masked for public-facing waiting room views, only displaying a token ID (e.g., PT-4190). Detailed PHI is hidden by default for staff views and requires explicit action to reveal.

6. **Throughput Analytics**
   - **Feature**: Integrated analytics dashboard tracking metrics like Door-to-Doctor time, LWBS (Left Without Being Seen) rate, bed turnover, and hourly surge data.

7. **Secure Clinical Authentication**
   - **Feature**: JWT-based session management with role-based access control (RBAC). Protected frontend routes and robust backend API middleware to enforce compliance and restrict sensitive actions (e.g., priority overrides) to authorized personnel only.
   - **Onboarding Flow**: Multi-step clinical registration guiding staff through role selection, identity verification, and facility assignment.

## 🔐 Authentication Workflow

The application implements a strict zero-trust authentication barrier:
- **Public Routes**: `/login`, `/onboarding` and its sub-routes are publicly accessible.
- **Protected Routes**: The entire operational dashboard (`/dashboard`, `/queue`, `/patients`, etc.) is hidden behind a React `ProtectedRoute` guard. Unauthenticated visitors are automatically redirected to `/login`, preserving their intended destination for post-login redirection.
- **Backend API Protection**: All clinical and administrative endpoints are guarded by `authMiddleware` enforcing valid Bearer tokens. High-risk actions (e.g., overriding patient priority) use `roleMiddleware` to verify the actor is an Administrator or Clinical Supervisor. 401 Unauthorized responses trigger automatic frontend session purging.

## 🏗️ Tech Stack

The project is structured into a streamlined Monorepo for rapid development:
- **Frontend**: React.js (via Vite) configured as an SPA, styled with TailwindCSS, utilizing Lucide React for iconography, and **React Router v6** for complex page navigation and route guarding.
- **Backend**: A robust Node.js/Express.js server handling REST APIs, Socket.io for real-time WebSockets, and secure session management via **jsonwebtoken** (JWT).
- **Database**: Fully persistent **MongoDB** database using **Mongoose** schemas (`db-mongo.js`). The entire application is architected around asynchronous, non-blocking I/O, seamlessly querying actual MongoDB collections for scaling.
- **AI Integration**: **Groq API** (`groq-sdk`) for lightning-fast LLM-based intelligent triage predictions and clinical justifications.

## 🔑 Demo Credentials

To test the application, you can use the following pre-seeded demo accounts (any password will work):
- **Admin**: `admin@mediqueue.com` (Full Access & Priority Overrides)
- **Staff**: `staff@mediqueue.com` (Clinical Dashboard)
- **Patient**: `patient@mediqueue.com` (Public View)
- **New Account**: You can also click the "Register for access" link on the login page to create a brand new account and test the full onboarding flow!

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A groq api

### Installation

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add your configurations. If you do not provide a MongoDB URI, the application will default to connecting to a local MongoDB instance.
   ```env
   GROQ_API_KEY=your_actual_groq_api_key_here
   MONGODB_URI=mongodb://127.0.0.1:27017/pulseflow
   JWT_SECRET=your_secure_jwt_secret
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The backend Express server handles both the API and the Vite frontend middleware. 
   - It will automatically bind to `http://localhost:3000` (or dynamically find the next available port).
   - Click the link printed in your terminal to view the application!

### Building for Production

To create an optimized production build:
```bash
npm run build
```
This builds the React application into the `client/dist` directory, which the Express server will statically serve when `NODE_ENV=production`. You can test it by running:
```bash
NODE_ENV=production npm run start
```
