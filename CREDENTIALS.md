# IoT-Berg Operational Access Credentials

> **Confidential Document**
> This file contains administrative and operational credentials for the IoT-Berg Operations Portal.
> **Note:** All test/demo credentials (`admin123`, `manager123`, `auditor123`) and quick-login pills have been completely removed from the live website interface for production security.

---

## 1. Access Portals

- **Production URL**: [https://iot-berg.vercel.app/admin/login](https://iot-berg.vercel.app/admin/login)
- **Local Development URL**: `http://localhost:5173/admin/login`

---

## 2. Active User Credentials

### Account 1: Primary Administrator (Team Lead)
*Full superuser privileges across all modules.*

| Field | Detail |
|---|---|
| **Full Name** | MD. Rezaul Karim |
| **Designation** | Project Manager & Team Lead |
| **System Role** | `admin` (Unrestricted Superuser) |
| **Primary Username** | `rksazid` |
| **Primary Email** | `rksazid@gmail.com` |
| **Accepted Alternate Emails** | `admin@iotberg.com`, `admin@iot-berg.com`, `lead@iotberg.com` |
| **Primary Production Password** | `IoTberg#2026@Lead` |
| **Accepted Alternative Passwords** | `IB@Admin#2026!`, `iotberg2026`, `rksazid` |

---

### Account 2: Finance & Operations Manager
*Operational management of work orders, payment vouchers, and employee rosters.*

| Field | Detail |
|---|---|
| **Full Name** | Finance & Ops Manager |
| **Designation** | Finance & Accounts Specialist |
| **System Role** | `manager` |
| **Primary Username** | `manager` |
| **Primary Email** | `finance@iotberg.com` |
| **Accepted Alternate Emails** | `finance@iotberg.cloud`, `manager@iotberg.com` |
| **Primary Production Password** | `IoTberg#2026@Finance` |
| **Accepted Alternative Passwords** | `IB@Manager#2026!`, `finance2026` |

---

### Account 3: Compliance Auditor
*Read-only compliance and verification access for accounting and legal audits.*

| Field | Detail |
|---|---|
| **Full Name** | Compliance Auditor |
| **Designation** | External Audit & Verification Specialist |
| **System Role** | `auditor` (Read-Only) |
| **Primary Username** | `auditor` |
| **Primary Email** | `auditor@iotberg.com` |
| **Accepted Alternate Emails** | `auditor@iotberg.cloud` |
| **Primary Production Password** | `IoTberg#2026@Audit` |
| **Accepted Alternative Passwords** | `IB@Audit#2026!`, `audit2026` |

---

## 3. Role Permissions Matrix

| Module / Action | `admin` (Team Lead) | `manager` (Finance/Ops) | `auditor` (Compliance) |
|---|:---:|:---:|:---:|
| **Admin Dashboard Overview** | Full Access | Full Access | View Only |
| **Client Work Orders** | Create, Edit, Delete | Create, Edit | View Only |
| **Payment Receipts** | Issue, Approve, Void, Download PDF | Issue, Edit, Download PDF | View & Download PDF |
| **Employee Directory** | Register, Edit, Delete, Issue Letter | Register, Edit, Issue Letter | View Only |
| **Trusted Partners Slider** | Add, Reorder, Toggle, Delete | Add, Reorder | View Only |
| **Document Studio (/convert)** | Full Access | Full Access | Full Access |
| **QR Verification Portal (/verify)** | Full Access | Full Access | Full Access |

---

## 4. How to Update or Rotate Credentials

User records and allowed password hashes are defined in:
- `src/context/AuthContext.jsx`

To rotate a password:
1. Update the password array under the relevant user in `src/context/AuthContext.jsx`.
2. Update the record in this `CREDENTIALS.md` file.
3. Commit and deploy (`npx vercel --prod --yes`).
