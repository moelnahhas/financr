# DocuSeal PDF Signing Setup Guide

This project uses DocuSeal API to handle PDF signing for tenancy agreements. When a landlord proposes a rent plan, the `tenan.pdf` is automatically sent to the tenant for electronic signature.

## Features Implemented

✅ **Automatic PDF Sending**: When landlord creates rent plan, tenant receives email with signing link  
✅ **Webhook Integration**: Tracks when document is viewed, signed, or declined  
✅ **Database Tracking**: Stores signing status and submission details  
✅ **Signed PDF Download**: Downloads completed PDF after signing  

---

## Quick Setup (3 Steps)

### Step 1: Get Your DocuSeal API Key

1. **Sign up for DocuSeal**: Go to [https://docuseal.com](https://docuseal.com)
2. **Get API Key**: Visit [https://console.docuseal.com/api](https://console.docuseal.com/api)
3. **Copy your API Key** (starts with `sk_`)

### Step 2: Add to .env File

Create a `.env` file in the `rentease-backend` directory (copy from `.env.template`):

```env
DOCUSEAL_API_KEY=your_docuseal_api_key_here
```

**Example:**
```env
DOCUSEAL_API_KEY=sk_1234567890abcdef
```

### Step 3: Setup Webhook (Optional but Recommended)

To receive notifications when documents are signed:

1. **Go to**: [https://console.docuseal.com/webhooks](https://console.docuseal.com/webhooks)
2. **Add Webhook URL**: `https://your-domain.com/api/docuseal/webhook`
   - For local testing: Use [ngrok](https://ngrok.com) to expose localhost
   - Example: `https://abc123.ngrok.io/api/docuseal/webhook`
3. **Select Events**:
   - ✅ `form.completed` (document signed)
   - ✅ `form.viewed` (document opened)
   - ✅ `form.declined` (signature declined)

---

## How It Works

### When Landlord Creates Rent Plan

```javascript
POST /api/rent-plans
{
  "tenantUsername": "johndoe",
  "monthlyRent": 1200,
  "deposit": 2400,
  "duration": 12,
  "startDate": "2025-01-01"
}
```

**What Happens:**
1. ✅ Rent plan created in database
2. 📄 `tenan.pdf` sent to tenant via DocuSeal
3. 📧 Tenant receives email with signing link
4. 💾 DocuSeal submission ID stored in database

**Response:**
```json
{
  "plan": {
    "id": "plan_123",
    "status": "pending",
    "docusealSubmissionId": "sub_abc123",
    "docusealSigningUrl": "https://docuseal.com/s/abc123",
    "docusealStatus": "pending",
    ...
  }
}
```

### When Tenant Signs Document

**Webhook Event Received:**
```json
{
  "event_type": "form.completed",
  "data": {
    "submission_id": "sub_abc123",
    "email": "tenant@example.com"
  }
}
```

**What Happens:**
1. 📥 Signed PDF downloaded from DocuSeal
2. 💾 Rent plan updated:
   - `docusealStatus` → `"signed"`
   - `docusealSignedAt` → current timestamp
3. ✅ Landlord can see tenant signed the agreement

---

## API Endpoints

### Get Signing Status

```bash
GET /api/docuseal/status/:planId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "planId": "plan_123",
  "submissionId": "sub_abc123",
  "signingUrl": "https://docuseal.com/s/abc123",
  "status": "signed",
  "signedAt": "2025-11-10T12:34:56Z",
  "signedPdfUrl": null
}
```

### Webhook Endpoint (Called by DocuSeal)

```bash
POST /api/docuseal/webhook
Content-Type: application/json

{
  "event_type": "form.completed",
  "data": {
    "submission_id": "sub_abc123",
    "email": "tenant@example.com"
  }
}
```

---

## Database Schema

The `RentPlan` model includes DocuSeal fields:

```prisma
model RentPlan {
  // ... other fields ...
  
  // DocuSeal Integration
  docusealSubmissionId String?       // DocuSeal submission ID
  docusealSubmitterId  String?       // DocuSeal submitter ID
  docusealSigningUrl   String?       // URL for tenant to sign
  docusealStatus       String?       // pending, viewed, signed, declined
  docusealSignedAt     DateTime?     // When document was signed
  docusealSignedPdfUrl String?       // URL to signed PDF
}
```

---

## Testing Locally with ngrok

### 1. Install ngrok
```bash
brew install ngrok
# or download from https://ngrok.com
```

### 2. Expose Local Server
```bash
ngrok http 5001
```

Output:
```
Forwarding https://abc123.ngrok.io -> http://localhost:5001
```

### 3. Set Webhook URL in DocuSeal
Use: `https://abc123.ngrok.io/api/docuseal/webhook`

### 4. Test the Flow
1. Start backend: `npm start`
2. Create rent plan as landlord
3. Check tenant email for signing link
4. Sign the document
5. Watch webhook logs in terminal

---

## File Structure

```
rentease-backend/
├── tenan.pdf                           # PDF sent for signing
├── src/
│   ├── controllers/
│   │   ├── rentPlanController.js       # Modified: sends PDF after creating plan
│   │   └── docusealController.js       # NEW: handles webhooks
│   ├── routes/
│   │   └── docusealRoutes.js          # NEW: webhook routes
│   ├── utils/
│   │   └── docuseal.js                # NEW: DocuSeal API functions
│   └── server.js                       # Modified: added docuseal routes
└── prisma/
    └── schema.prisma                   # Modified: added DocuSeal fields
```

---

## Troubleshooting

### Issue: "DOCUSEAL_API_KEY not configured"
**Solution:** Add `DOCUSEAL_API_KEY=your_key_here` to `.env` file

### Issue: Tenant not receiving email
**Possible Causes:**
- ✉️ Check spam folder
- 🔑 Verify API key is correct
- 👤 Verify tenant email is valid
- 💳 Check DocuSeal account has email credits

### Issue: Webhook not firing
**Possible Causes:**
- 🌐 Webhook URL not set in DocuSeal console
- 🔒 Webhook URL not accessible (use ngrok for localhost)
- ⚙️ Events not selected in DocuSeal webhook settings

### Issue: "tenan.pdf not found"
**Solution:** 
- Ensure `tenan.pdf` exists in `rentease-backend/` directory
- Check file path in controller

---

## DocuSeal Dashboard

Monitor all submissions: [https://console.docuseal.com/submissions](https://console.docuseal.com/submissions)

Features:
- 📊 View all sent documents
- 👁️ See who viewed/signed
- 📥 Download signed PDFs
- 🔔 Resend email reminders
- ❌ Void submissions

---

## Next Steps

1. ✅ **Add API Key** to `.env` file
2. ✅ **Run Migration**: `npx prisma migrate dev`
3. ✅ **Test Flow**: Create rent plan → Check tenant email
4. ✅ **Setup Webhook** (for production deployment)
5. Optional: Upload signed PDFs to S3/cloud storage

---

## Production Considerations

### 1. Store Signed PDFs
Currently, signed PDFs are downloaded but not stored permanently. For production:

```javascript
// In docusealController.js
const signedPdfBuffer = await downloadSignedPDF(data.submission_id);

// Upload to S3
const s3Url = await uploadToS3(signedPdfBuffer, `signed-contracts/${planId}.pdf`);

// Update database
await prisma.rentPlan.update({
  where: { id: rentPlan.id },
  data: { docusealSignedPdfUrl: s3Url }
});
```

### 2. Email Notifications
Add email to landlord when tenant signs:

```javascript
// In handleFormCompleted()
await sendEmail({
  to: rentPlan.landlord.email,
  subject: 'Tenant Signed Agreement',
  body: `${rentPlan.tenant.name} has signed the tenancy agreement.`
});
```

### 3. Webhook Security
Add webhook signature verification (DocuSeal supports HMAC):

```javascript
const signature = req.headers['x-docuseal-signature'];
// Verify signature matches
```

---

## Support

- **DocuSeal Documentation**: [https://www.docuseal.com/docs](https://www.docuseal.com/docs)
- **DocuSeal API Reference**: [https://www.docuseal.com/docs/api](https://www.docuseal.com/docs/api)
- **Support**: [support@docuseal.com](mailto:support@docuseal.com)

---

**Status**: ✅ Ready to use - just add your API key!

