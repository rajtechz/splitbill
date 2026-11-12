# SplitMate — Production & Google Play Store Launch Requirements

This document contains the complete checklist of all third-party services, API keys, credentials, and regulatory requirements needed to take **SplitMate** from local development to production deployment and release on the **Google Play Store**.

---

## 1. Mandatory Third-Party Backend Services

### ① Production Cloud Database (MongoDB Atlas) — [COMPLETED ✅]
* **Status:** **CONNECTED & LIVE**
* **Cluster:** `Cluster0` (AWS Mumbai `ap-south-1`)
* **Database:** `splitmate`
* **URI:** Configured in `backend/.env`

---

### ② Push Notifications (Firebase Cloud Messaging - FCM) — [COMPLETED ✅]
* **Status:** **CONNECTED & LIVE**
* **Project ID:** `splitmate-b8562`
* **Android:** `android/app/google-services.json` installed & Gradle configured.
* **iOS:** `ios/SplitMate/GoogleService-Info.plist` installed & Xcode linked.
* **Backend:** `firebase-admin` v13 initialized with `backend/service-account.json`.

---

### ③ Cloud File & Receipt Storage (Cloudinary) — [COMPLETED ✅]
* **Status:** **CONNECTED & LIVE**
* **Cloud Name:** `qlwqbojz`
* **Test Verification:** Verified live base64 receipt upload returning CDN URL (`https://res.cloudinary.com/...`).
* **Environment:** Configured in `backend/.env`.

---

### ④ 24/7 Production Server Hosting & SSL Domain — [COMPLETED ✅]
* **Status:** **DEPLOYED & LIVE**
* **Primary URL:** `https://splitbill-backend-o2on.onrender.com`
* **Health Check:** `https://splitbill-backend-o2on.onrender.com/health` (verified active!)
* **Base API Endpoint:** `https://splitbill-backend-o2on.onrender.com/api/v1`
* **Hosting Provider:** Render.com (Free Tier)

  CLOUDINARY_API_SECRET=your_api_secret
  ```
  *(Alternative if using AWS S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`)*

---

### ⑤ Real Phone Number SMS & OTP Verification
* **Purpose:** Verifies real phone numbers via SMS OTP during onboarding and login (replacing development bypass PIN `123456`).
* **Recommended Providers:**
  * **[Twilio Verify](https://www.twilio.com/en-us/verify)** (Global, simplest setup with zero carrier registration headaches).
  * **[Fast2SMS](https://www.fast2sms.com) or [Msg91](https://msg91.com)** (Recommended for India — lower SMS rates ₹0.15–₹0.20 per SMS with DLT approval).
* **How to Get (Twilio):**
  1. Create an account at [twilio.com](https://www.twilio.com).
  2. Navigate to **Verify** $\to$ **Services** $\to$ Create a Verify Service named "SplitMate".
  3. Copy your Account SID, Auth Token, and Verify Service SID.
* **Environment Variables:**
  ```env
  OTP_PROVIDER=twilio
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

---

## 2. Optional / Business Expansion Services

### ⑥ Live Multi-Currency Exchange Rates API
* **Purpose:** Automatically updates real-time exchange rates (USD, EUR, GBP, AED, INR, JPY, etc.) for international trips rather than relying on static estimates.
* **Provider:** [ExchangeRate-API](https://www.exchangerate-api.com) or [Open Exchange Rates](https://openexchangerates.org)
* **Pricing:** Free tier provides 1,500 requests/month (more than enough for daily cached exchange rate refreshes).
* **Environment Variable:**
  ```env
  EXCHANGE_RATE_API_KEY=your_api_key_here
  ```

---

### ⑦ Payment Gateways
* **Friend-to-Friend Settlements (Already Built & 100% Free):**
  * SplitMate uses direct UPI intent deep links (`upi://pay?pa=...&am=...&pn=...`). This works directly with PhonePe, Google Pay, Paytm, and BHIM with **zero transaction fees and zero setup requirements**.
* **SplitMate Pro Subscription / Card Payments (Optional):**
  * **[Razorpay](https://razorpay.com)** (for India credit cards, debit cards, netbanking).
  * **[Stripe](https://stripe.com)** (for international subscribers).
  * Environment Variables (if enabled):
    ```env
    RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
    RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
    ```

---

## 3. Google Play Store Submission Checklist

To publish on Google Play without rejection, Google requires specific assets, policies, and configurations:

| # | Item | Details | Action Required |
| :--- | :--- | :--- | :--- |
| **1** | **Google Play Console Account** | One-time \$25 registration fee at [play.google.com/console](https://play.google.com/console). | Register developer account |
| **2** | **Release Keystore** | Digital key to sign the Android App Bundle (`.aab`). Keystore must be backed up securely. | Generate via keytool |
| **3** | **Target SDK Version** | Android 14 / 15 (`targetSdkVersion = 34` or `35`). | Configured in `android/app/build.gradle` |
| **4** | **Public Privacy Policy URL** | Active HTTPS web page explaining how Contacts, Camera, Location, and Storage data are collected and protected. | Host on GitHub Pages, Notion, or your domain |
| **5** | **Account & Data Deletion** | Google Play Data Safety policy mandates that users must be able to delete their account and associated data inside the app and via a public URL. | Handled via `DELETE /api/v1/users/me` & public form |
| **6** | **Data Safety Form** | Questionnaire in Play Console declaring that contact data and camera captures are used strictly for in-app bill splitting and never sold to 3rd-party ad networks. | Fill out in Play Console |
| **7** | **Store Listing Graphics** | • App Icon: 512 x 512 px PNG<br>• Feature Graphic: 1024 x 500 px PNG<br>• Phone Screenshots: Minimum 2 (1080 x 2400 px or 16:9 / 9:16) | Prepare marketing visuals |

---

## 4. Master Production `.env` Template

Create this file as `backend/.env.production` when deploying your backend to your cloud server:

```env
# ==========================================
# SplitMate Backend — Production Configuration
# ==========================================

# 1. Server Environment
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*

# 2. Authentication & JWT Security
# TIP: Generate secure random keys using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace_with_a_super_secret_64_character_hex_key
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=replace_with_another_secret_64_character_hex_key
JWT_REFRESH_EXPIRES_IN=30d

# 3. Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/splitmate?retryWrites=true&w=majority

# 4. Push Notifications (Firebase FCM)
PUSH_PROVIDER=fcm
FIREBASE_PROJECT_ID=splitmate-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@splitmate-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# 5. Cloud Storage (Receipts & Avatars)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 6. Phone SMS / OTP Verification (Twilio)
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 7. Currency Exchange Rates (Optional)
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key
```

---

## 5. Next Steps to Prepare for Launch

1. **Sign up for MongoDB Atlas** $\to$ Replace `MONGODB_URI` with your cloud database string.
2. **Create a Firebase Project** $\to$ Download `google-services.json` and generate your Admin Service Account key.
3. **Sign up for Cloudinary** $\to$ Copy Cloud Name, API Key, and API Secret.
4. **Deploy Backend to Render/Railway** $\to$ Test live `https://` endpoint.
5. **Generate Signed Android App Bundle (`.aab`)** and upload to Google Play Console.

