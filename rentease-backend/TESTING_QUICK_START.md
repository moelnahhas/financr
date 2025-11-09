# 🚀 Quick Start: Testing DocuSeal Integration

## Test with One Command

```bash
npm run test:docuseal
```

Or use the helper script:

```bash
./run-docuseal-test.sh
```

---

## What Gets Tested

The automated test creates this complete workflow:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Create Test Landlord                                 │
│    ✉️  landlord.test@example.com                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Create Test Tenant                                   │
│    ✉️  mohamed.elnahhas@icloud.com  ← YOUR EMAIL        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Landlord Creates Rent Plan                           │
│    💰 Monthly Rent: $1,500                              │
│    💵 Deposit: $3,000                                   │
│    📅 Duration: 12 months                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. DocuSeal Sends PDF Automatically                     │
│    📄 File: tenan.pdf                                   │
│    📧 To: mohamed.elnahhas@icloud.com                   │
│    🔗 Generates signing URL                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Simulate: Tenant Views Document                      │
│    Status: pending → viewed                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Simulate: Tenant Signs Document                      │
│    Status: viewed → signed                              │
│    Timestamp recorded                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Verify Database Updates                              │
│    ✅ Rent plan created                                 │
│    ✅ DocuSeal tracking fields populated                │
│    ✅ Status history recorded                           │
└─────────────────────────────────────────────────────────┘
```

---

## Expected Test Output

```bash
╔═══════════════════════════════════════════════════════════╗
║     DOCUSEAL WORKFLOW TEST SUITE                          ║
║     Testing with: mohamed.elnahhas@icloud.com             ║
╚═══════════════════════════════════════════════════════════╝

✅ Health Check
✅ Create Landlord
✅ Create Tenant
✅ Create Rent Plan (Triggers DocuSeal)
   📄 DocuSeal integration triggered!
   📧 Signing email sent to: mohamed.elnahhas@icloud.com
✅ Get Signing Status
✅ Simulate Webhook: Document Viewed
✅ Simulate Webhook: Document Signed
✅ Verify Rent Plans

============================================================
  TEST SUMMARY
============================================================
✅ Passed:  8
❌ Failed:  0
📊 Total:   8

🎉 All tests passed!
```

---

## After Tests Run

### 1. Check Your Email 📧

**Email:** mohamed.elnahhas@icloud.com

**Look for:**
- **From:** DocuSeal (no-reply@docuseal.com)
- **Subject:** "Please sign: Tenancy Agreement - John Landlord"
- **Contains:** Link to sign the document

**If not in inbox:**
- ✉️ Check spam/junk folder
- ⏰ Wait 2-3 minutes for delivery
- 🔍 Search for "DocuSeal" or "tenancy"

### 2. Sign the Real Document ✍️

1. Click the link in the email
2. Review the PDF (tenan.pdf)
3. Add your signature
4. Click "Submit"
5. DocuSeal sends webhook automatically
6. Database updates to "signed" status

### 3. Verify It Worked ✅

Check the database:
```bash
npm run db:studio
```

Or via API:
```bash
# Get the plan ID from test output, then:
curl http://localhost:5001/api/docuseal/status/PLAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Prerequisites

Before running tests:

### 1. Server Must Be Running ✓
```bash
# Terminal 1: Start server
cd rentease-backend
npm start
```

### 2. DocuSeal API Key (Optional but Recommended) ✓
```bash
# Add to .env
DOCUSEAL_API_KEY=your_key_here
```

Get your key: https://console.docuseal.com/api

**Without API Key:**
- Tests will still run ✓
- Rent plan will be created ✓
- But PDF won't actually be sent ✗
- Status will show warning ⚠️

---

## Running the Tests

### Option 1: NPM Script (Recommended)
```bash
npm run test:docuseal
```

### Option 2: Direct Node
```bash
node test-docuseal-workflow.js
```

### Option 3: Shell Script
```bash
./run-docuseal-test.sh
```

---

## Test Data Used

```javascript
Landlord Account:
  Email: landlord.test@example.com
  Username: landlord_test
  Password: Test123!@#
  Role: landlord

Tenant Account:
  Email: mohamed.elnahhas@icloud.com  ← YOUR EMAIL
  Username: mohamed_tenant
  Password: Test123!@#
  Role: tenant

Rent Plan:
  Monthly Rent: $1,500
  Deposit: $3,000
  Duration: 12 months
  Start Date: December 1, 2025
```

---

## Customizing Test Data

Edit `test-docuseal-workflow.js`:

```javascript
const MOCK_DATA = {
  tenant: {
    email: 'your-email@example.com',  // ← Change this
    username: 'your_username',
    name: 'Your Name',
  },
  rentPlan: {
    monthlyRent: 2000,                // ← Change amounts
    deposit: 4000,
    duration: 6,                      // ← Change duration
  }
};
```

---

## Troubleshooting

### ❌ "Server is not running"
```bash
# Start the server first
npm start
```

### ❌ "DOCUSEAL_API_KEY not configured"
```bash
# Option 1: Add API key to .env
DOCUSEAL_API_KEY=your_key_here

# Option 2: Run without it (limited features)
# Tests will still pass but won't send real PDFs
```

### ❌ "User already exists"
**Solution:** Script automatically logs in with existing accounts

Or clean database:
```bash
rm dev.db
npm run db:push
```

### 📧 Email not received
1. Check spam folder
2. Verify API key is valid
3. Check DocuSeal dashboard: https://console.docuseal.com/submissions
4. Resend from dashboard if needed

---

## What Gets Created in Database

After tests run, your database will have:

**Users:**
- 1 Landlord (landlord.test@example.com)
- 1 Tenant (mohamed.elnahhas@icloud.com)

**Rent Plans:**
- 1 Rent plan with DocuSeal fields populated:
  - `docusealSubmissionId`
  - `docusealSubmitterId`
  - `docusealSigningUrl`
  - `docusealStatus`
  - `docusealSignedAt`

View in Prisma Studio:
```bash
npm run db:studio
```

---

## Clean Up Test Data

Remove test accounts and rent plans:

```bash
# Option 1: Delete database and recreate
rm dev.db
npm run db:push

# Option 2: Use Prisma Studio
npm run db:studio
# Manually delete test records
```

---

## Integration Testing Flow

### Complete Real-World Test:

1. **Run automated test** ✓
   ```bash
   npm run test:docuseal
   ```

2. **Check email** ✓
   - Open: mohamed.elnahhas@icloud.com
   - Find DocuSeal email

3. **Sign document** ✓
   - Click link in email
   - Add signature
   - Submit

4. **Verify webhook fired** ✓
   - Check server logs
   - Look for: "📨 DocuSeal webhook received"
   - Should see: "✅ Document signed!"

5. **Check database** ✓
   ```bash
   npm run db:studio
   ```
   - Navigate to RentPlan
   - Find your test plan
   - Verify `docusealStatus = "signed"`
   - Verify `docusealSignedAt` has timestamp

---

## Useful Commands

```bash
# Run tests
npm run test:docuseal

# Start server
npm start

# View database
npm run db:studio

# Check server logs
tail -f server.log

# Clean database
rm dev.db && npm run db:push
```

---

## DocuSeal Dashboard

Monitor everything at: https://console.docuseal.com

**You can:**
- 📊 View all submissions
- 📧 Resend emails
- 📥 Download signed PDFs
- 🔔 See webhook events
- ❌ Void submissions

---

## Support

- **Test Issues:** Check `test-docuseal-workflow.js` comments
- **Setup Help:** Read `DOCUSEAL_SETUP.md`
- **Complete Docs:** Read `DOCUSEAL_INTEGRATION_COMPLETE.md`
- **DocuSeal API:** https://www.docuseal.com/docs/api

---

## Test Results Location

After running tests, you can find:

- **Console Output:** Shows test results
- **Server Logs:** Shows API calls and DocuSeal responses
- **Database:** Check with `npm run db:studio`
- **DocuSeal Dashboard:** https://console.docuseal.com/submissions

---

## Next Steps After Successful Tests

1. ✅ Tests pass locally
2. ✅ Email received and signed
3. ✅ Webhook updates database
4. → **Deploy to staging**
5. → **Setup production webhook URL**
6. → **Test with real users**
7. → **Monitor DocuSeal dashboard**

---

**Happy Testing! 🎉**

Questions? Check the other documentation files:
- `DOCUSEAL_SETUP.md` - Initial setup
- `DOCUSEAL_INTEGRATION_COMPLETE.md` - Full documentation
- `README_DOCUSEAL_TESTING.md` - Detailed testing guide

