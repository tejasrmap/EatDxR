# Privacy Policy for ApecERP Mobile Application

**Effective Date:** September 2026  
**Application Name:** ApecERP  
**Package Name:** com.apec.erp / ApecERP  
**Developer Contact:** [tejag.vijay@gmail.com](mailto:tejag.vijay@gmail.com) | [admin@apecerp.com](mailto:admin@apecerp.com)

---

## 1. Overview & Purpose
This Privacy Policy outlines how **ApecERP** ("we", "our", or "the App") collects, uses, stores, and protects user data. ApecERP is an Enterprise Resource Planning (ERP) platform developed for educational institutions, faculty, students, and administrative staff to manage academic schedules, attendance, assignments, and campus notices.

We strictly comply with the **Google Play Developer Program Policies**, including the **User Data Policy** and global data privacy standards (such as GDPR and the Digital Personal Data Protection Act).

---

## 2. Information We Collect

### A. Personal & Academic Information
- **Identity Data:** Full name, institutional roll number, employee ID, and assigned department/branch.
- **Contact Details:** Email address and mobile phone number for verification and communication.
- **Profile Data:** Profile picture (voluntarily uploaded by the user or institutional administrator).
- **Academic Records:** Attendance status, marks, timetable, fee receipts, and assignment submissions.

### B. Device & Technical Diagnostics
- **Device Details:** Hardware model, manufacturer, and Android/iOS OS version.
- **Push Notification Token:** Firebase Cloud Messaging (FCM) token to send institutional alerts.
- **Diagnostics & Logs:** Anonymized crash logs and connection status to maintain app stability.

---

## 3. Device Permissions & Usage

ApecERP requests device permissions strictly at runtime and only when required by a user action:

| Permission | Purpose |
| :--- | :--- |
| **`CAMERA`** | Used exclusively to scan digital attendance QR codes or take a profile picture. The camera is never accessed in the background. |
| **`READ_MEDIA_IMAGES` / `STORAGE`** | Used to select documents and assignment images for upload, or save grade cards and fee receipts to local storage. |
| **`POST_NOTIFICATIONS`** | Used to deliver urgent academic circulars, fee reminders, timetable changes, and examination notifications. |
| **`ACCESS_FINE_LOCATION`** *(Optional)* | Only accessed if your institution has enabled geofenced on-campus attendance. Checked once at the moment of check-in and never tracked continuously. |

---

## 4. Third-Party Services
To provide notification services and ensure stability, ApecERP integrates with:
- **Google Play Services**: For app distribution, security verification, and standard Android libraries.
- **Firebase Cloud Messaging (FCM)**: For encrypted, real-time push notification delivery.
- **Firebase Crashlytics / Analytics**: For anonymous crash reporting and performance optimization.

We do **not** sell, rent, or trade your personal data to third-party advertisers or data brokers.

---

## 5. Data Security & Storage
- All network communications between the mobile application and institutional backend servers are encrypted using **HTTPS and TLS 1.3**.
- User authentication tokens are securely encrypted using standard hardware-backed storage (Android Keystore).
- Access to student and faculty records is strictly guarded by Role-Based Access Control (RBAC).

---

## 6. Data Retention & Account Deletion (Google Play Compliance)
Users have the right to request deletion of their mobile app account and personal data at any time:
1. **In-App:** Go to *Settings > Account > Request Data Deletion*.
2. **Via Email:** Send an email from your registered address to [admin@apecerp.com](mailto:admin@apecerp.com) or [tejag.vijay@gmail.com](mailto:tejag.vijay@gmail.com) with the subject line *"Account Deletion Request - [Your Roll/ID Number]"*. 

Upon receipt, user credentials, device tokens, and personal telemetry will be permanently deleted within 7 business days.

---

## 7. Children’s Privacy
ApecERP is built for educational institutions. If minors under 18 use the app, their accounts are created and overseen by authorized institutional administrators or guardians solely for academic purposes.

---

## 8. Contact Information
If you have any questions or concerns regarding this Privacy Policy:
- **Support Email:** [admin@apecerp.com](mailto:admin@apecerp.com)
- **Developer Email:** [tejag.vijay@gmail.com](mailto:tejag.vijay@gmail.com)
- **App:** ApecERP Mobile ERP Suite
