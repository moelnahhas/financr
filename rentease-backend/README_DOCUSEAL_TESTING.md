# DocuSeal Workflow Testing Guide

This guide explains how to test the DocuSeal PDF signing integration using the automated test script.

---

## Quick Start

### 1. Make sure server is running
```bash
npm start
```

### 2. Run the test script
```bash
npm run test:docuseal
```

That's it! The script will automatically:
- ✅ Create test landlord and tenant accounts
- ✅ Create a rent plan (triggers PDF sending)
- ✅ Simulate DocuSeal webhook events
- ✅ Verify database updates
- ✅ Check signing status

---

## What the Test Does

### Test Flow

```
1. Health Check
   └─> Verifies server is running

2. Create Landlord Account
   └─> Email: landlord.test@example.com
   └─> Role: landlord

3. Create Tenant Account
   └─> Email: mohamed.elnahhas@icloud.com ← Your email
   └─> Role: tenant

4. Create Rent Plan
   └─> Landlord proposes plan to tenant
   └─> tenan.pdf sent via DocuSeal
   └─> Email sent to mohamed.elnahhas@icloud.com
   └─> Returns submission ID and signing URL

5. Check Signing Status
   └─> Verifies DocuSeal tracking data

6. Simulate Webhook: Document Viewed
   └─> Simulates tenant opening the document
   └─> Updates status to "viewed"

7. Simulate Webhook: Document Signed
   └─> Simulates tenant signing the document
   └─> Updates status to "signed"
   └─> Records timestamp

8. Verify Rent Plans
   └─> Checks both landlord and tenant can see the plan
```

---

## Expected Output

### Successful Run (with DocuSeal API Key)

```
╔═══════════════════════════════════════════════════════════╗
║     DOCUSEAL WORKFLOW TEST SUITE                          ║
║     Testing with: mohamed.elnahhas@icloud.com             ║
╚═══════════════════════════════════════════════════════════╝

🔧 API Base URL: http://localhost:5001
🔑 DocuSeal API Key: ✓ Configured

============================================================
  1. Health Check
============================================================

✅ Server is running

============================================================
  2. Create Landlord Account
============================================================

✅ Landlord account created

============================================================
  3. Create Tenant Account
============================================================

✅ Tenant account created
📧 Tenant email: mohamed.elnahhas@icloud.com

============================================================
  4. Create Rent Plan (Triggers DocuSeal)
============================================================

✅ Rent plan created successfully
📄 DocuSeal integration triggered!
{
  "submissionId": "sub_abc123xyz",
  "submitterId": "submitter_456",
  "signingUrl": "https://docuseal.com/s/abc123",
  "status": "pending"
}
📧 Signing email should be sent to: mohamed.elnahhas@icloud.com

============================================================
  5. Check Signing Status
============================================================

✅ Signing status retrieved

============================================================
  6. Simulate Webhook: Document Viewed
============================================================

✅ Webhook "form.viewed" processed
👁️ Document marked as viewed

============================================================
  7. Simulate Webhook: Document Signed
============================================================

✅ Webhook "form.completed" processed
✍️ Document marked as signed

============================================================
  8. Verify Rent Plan in Database
============================================================

✅ Landlord can see 1 rent plan(s)
✅ Tenant can see 1 rent plan(s)

============================================================
  TEST SUMMARY
============================================================
✅ Passed:  8
❌ Failed:  0
⏭️  Skipped: 0
📊 Total:   8

🎉 All tests passed!

============================================================
  NEXT STEPS
============================================================
1. Check the tenant email: mohamed.elnahhas@icloud.com
   - Look for email from DocuSeal with signing link
   - Check spam folder if not in inbox

2. Visit DocuSeal dashboard:
   https://console.docuseal.com/submissions
   - View submission status
   - Resend email if needed

3. Test actual signing:
   - Click the link in the email
   - Sign the document
   - Webhook will automatically update the database

4. Check signing status via API:
   GET http://localhost:5001/api/docuseal/status/plan_123abc
```

### Without DocuSeal API Key

If `DOCUSEAL_API_KEY` is not set in `.env`, the test will still pass but skip DocuSeal-specific features:

```
============================================================
  4. Create Rent Plan (Triggers DocuSeal)
============================================================

✅ Rent plan created successfully
⚠️ DocuSeal integration did not trigger (check DOCUSEAL_API_KEY in .env)
ℹ️ This is expected if DocuSeal API key is not configured
```

---

## Manual Testing After Automated Tests

### 1. Check Your Email

**To:** mohamed.elnahhas@icloud.com  
**Subject:** Please sign: Tenancy Agreement - John Landlord  
**From:** DocuSeal (no-reply@docuseal.com)

If you don't see it:
- ✉️ Check spam/junk folder
- ⏰ Wait a few minutes (email may be delayed)
- 🔍 Search for "DocuSeal" in your email

### 2. Sign the Document

1. Click the signing link in the email
2. Review the tenancy agreement (tenan.pdf)
3. Add your signature
4. Submit the form
5. Webhook will fire automatically

### 3. Verify Webhook Updated Database

Run this to check the updated status:
```bash
# Get the rent plan ID from the test output
curl http://localhost:5001/api/docuseal/status/PLAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response after signing:
```json
{
  "planId": "plan_123abc",
  "submissionId": "sub_xyz123",
  "signingUrl": "https://docuseal.com/s/xyz123",
  "status": "signed",
  "signedAt": "2025-11-09T15:30:00Z",
  "signedPdfUrl": null
}
```

---

## Customizing Test Data

Edit `test-docuseal-workflow.js` to customize:

```javascript
const MOCK_DATA = {
  landlord: {
    email: 'your-landlord@example.com',    // Change landlord email
    username: 'your_landlord',
    name: 'Your Name',
  },
  tenant: {
    email: 'your-tenant@example.com',      // Change tenant email
    username: 'your_tenant',
    name: 'Tenant Name',
  },
  rentPlan: {
    monthlyRent: 2000,                     // Change rent amount
    deposit: 4000,                         // Change deposit
    duration: 6,                           // Change duration (months)
    startDate: '2025-12-01',              // Change start date
  }
};
```

---

## Troubleshooting

### Test fails at "Create Rent Plan"

**Error:** `DOCUSEAL_API_KEY not configured`

**Solution:**
```bash
# Add to .env file
DOCUSEAL_API_KEY=your_api_key_here
```

Get your key from: https://console.docuseal.com/api

---

### Test fails at "Create Landlord" or "Create Tenant"

**Error:** `User already exists`

**Solution:** The script automatically logs in if users exist. If login fails:
```bash
# Delete test users from database
rm rentease-backend/dev.db
npm run db:push
```

Or manually update passwords in the script to match existing accounts.

---

### Email not received

**Possible causes:**
1. DocuSeal API key invalid or expired
2. Email is in spam folder
3. Email address has typo
4. DocuSeal account out of credits

**Solutions:**
- Check DocuSeal dashboard: https://console.docuseal.com/submissions
- Resend email from dashboard
- Verify API key is correct

---

### Webhook simulation doesn't update status

**Error:** Webhook receives 404 or 500

**Check:**
1. Server is running: `npm start`
2. Webhook route exists: `GET http://localhost:5001/api/docuseal/webhook`
3. Check server logs for errors

---

## Running Individual Tests

You can also test parts of the workflow using curl:

### Create Rent Plan
```bash
# Login as landlord first
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord.test@example.com","password":"Test123!@#"}' \
  | jq -r '.token')

# Create rent plan
curl -X POST http://localhost:5001/api/rent-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "tenantUsername": "mohamed_tenant",
    "monthlyRent": 1500,
    "deposit": 3000,
    "duration": 12,
    "startDate": "2025-12-01"
  }' | jq
```

### Simulate Webhook
```bash
curl -X POST http://localhost:5001/api/docuseal/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "form.completed",
    "data": {
      "submission_id": "YOUR_SUBMISSION_ID",
      "email": "mohamed.elnahhas@icloud.com"
    }
  }'
```

### Check Signing Status
```bash
curl http://localhost:5001/api/docuseal/status/PLAN_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Clean Up Test Data

To remove test accounts and rent plans:

```bash
# Option 1: Delete and recreate database
rm rentease-backend/dev.db
npm run db:push

# Option 2: Manually delete via Prisma Studio
npm run db:studio
# Navigate to User and RentPlan tables, delete test records
```

---

## Integration with CI/CD

To run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test DocuSeal Integration
  env:
    DOCUSEAL_API_KEY: ${{ secrets.DOCUSEAL_API_KEY }}
  run: |
    npm start &
    sleep 5
    npm run test:docuseal
```

---

## Next Steps

After tests pass:

1. ✅ **Add real API key** to production `.env`
2. ✅ **Setup webhook URL** in DocuSeal console
3. ✅ **Test with real emails** in staging environment
4. ✅ **Monitor DocuSeal dashboard** for submissions
5. ✅ **Implement S3 storage** for signed PDFs (optional)

---

## Support

- **Test Script Issues**: Check `test-docuseal-workflow.js` comments
- **DocuSeal API**: https://www.docuseal.com/docs/api
- **DocuSeal Dashboard**: https://console.docuseal.com
- **Backend Logs**: Check terminal where `npm start` is running

---

**Happy Testing!** 🎉

