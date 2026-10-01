# Nature’s Nectar Wellness

> **Natural Wellness & Herbal Apothecary Platform**  
> Engineered for real-world Kenyan operations: semi-manual delivery pricing (Bolt / Matatu / CBD Pickup), M-Pesa Buy Goods verification, and core WhatsApp-driven commerce.

---

## 🌿 Overview

**Nature’s Nectar Wellness** is a production-grade herbal wellness e-commerce platform built to solve the operational realities of natural health commerce in Kenya.

Rather than forcing unrealistic rigid automation or arbitrary delivery calculations, the platform implements a transparent, human-centered commerce model:
- **Dynamic Delivery Quoting**: Accommodates variable transport costs (Bolt riders in Nairobi, Matatu parcels across Kenya, and free pickup at Bazaar Plaza CBD).
- **Core WhatsApp Integration**: 1-click consultation on remedies, automated order summary dispatch, and direct owner status updates to customers.
- **M-Pesa Buy Goods Workflow**: Built-in verification workflow for Till `9823412` with reference logging and automated stock deduction.
- **Zero-Friction Ordering**: No mandatory customer accounts; mobile-first UX optimized for fast loading and low friction.
- **Owner Admin Portal**: PIN-protected operational dashboard (`2540`) for reviewing delivery routes, managing inventory, and sending pre-formatted WhatsApp updates.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend / API**: Express 4 mounted via Vite middleware in dev (`server.ts`)
- **Database / Persistence**: Layered Architecture (Database $\to$ Repository $\to$ Service $\to$ API) with disk-backed state and transparent client cache synchronization
- **Design System**: Domain-native herbal aesthetic (Fraunces Display Serif + Plus Jakarta Sans, soft botanical greens, zero-pill metadata discipline)
- **Legal Compliance**: Full statutory herbal disclaimer and non-absolute wellness claim phrasing (*"supports wellness"*, *"traditionally used for"*)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/kennedy-labs/Nectar-wellness.git
cd Nectar-wellness
npm install
```

### 2. Run Locally
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📱 Core Customer & Admin Workflows

1. **Browse & Inquire**: Customers explore curated remedies (Shilajit resin, organic Moringa powder, Ashwagandha tinctures, forest teas) with full ingredient transparency.
2. **Submit Order Request**: Customer inputs phone, delivery preference, and address without needing an account.
3. **Continue on WhatsApp**: Instant pre-filled message with order ID and items is generated for 1-click transmission to the apothecary's WhatsApp.
4. **Owner Review & Dispatch**: The owner logs in via the **Owner Portal** (PIN `2540`), inputs the exact transport fee, confirms payment, and dispatches via rider or matatu.
5. **Real-Time Tracking**: Customers can check live fulfillment status at any time using their Order Reference (`NNW-XXXX`).

---

## 📄 License
Apache-2.0
