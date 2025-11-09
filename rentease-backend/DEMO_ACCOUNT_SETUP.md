# Demo Account Population Script

This script populates a demo account with comprehensive sample data to demonstrate all features of the Housr/RentEase application.

## Quick Start

```bash
# From the rentease-backend directory
./populate-demo.sh
```

Or run directly:
```bash
node populate-demo-account.js
```

## Account Credentials

- **Email**: mo@gmail.com
- **Password**: 123456
- **Role**: Tenant

## What Gets Created

The script creates a complete tenant experience with realistic data:

### 1. **User Accounts**
- Demo tenant account (mo@gmail.com)
- Demo landlord account
- 3 additional tenant accounts for the landlord

### 2. **Properties** (3 properties)
- Sunset Apartments (Miami, FL) - 12 units, $2,500/month
- Downtown Lofts (San Francisco, CA) - 8 units, $3,200/month
- Green Valley Homes (Seattle, WA) - 6 units, $2,800/month

### 3. **Bills** (8+ bills)
- **Past Bills**: 3 months of paid rent and utilities (with on-time payment history)
- **Current Bills**: Unpaid rent ($2,500) and utilities ($175) due this month
- **Future Bills**: Next month's rent already scheduled
- All past bills have associated payment dates showing on-time payment behavior

### 4. **Expenses** (50+ expenses)
- 3 months of transaction history
- Realistic amounts across all categories:
  - Food (groceries, restaurants, coffee shops, etc.)
  - Transportation (gas, rideshares, parking, etc.)
  - Entertainment (movies, streaming, events, etc.)
  - Shopping (clothing, electronics, home goods, etc.)
  - Healthcare (pharmacy, gym, medical visits, etc.)
  - Other (miscellaneous purchases)
- 15-25 expenses per month for realistic spending patterns

### 5. **Budgets** (2 budgets with category breakdowns)
- **Weekly Budget**: $500 with 5 category allocations
  - Shows progress tracking (8 days completed)
- **Monthly Budget**: $2,000 with 6 category allocations
  - Shows 15 days of staying under budget
- Both include detailed category budgets with percentages and amounts

### 6. **Rent Plans** (3 plans)
- **Completed**: Previous 12-month lease ($2,400/month)
- **Active**: Current 12-month lease ($2,500/month)
  - Signed and active with DocuSeal integration
  - Next payment due date set
- **Pending**: New lease renewal offer ($2,600/month)
  - Awaiting tenant review and acceptance

### 7. **Rewards** (6 rewards)
- Rewards for all on-time bill payments
- 100 points per rent payment
- 50 points per utilities payment
- Total of 850 points available to spend

### 8. **Shop Items** (8 items)
- $10 Amazon Gift Card (500 points)
- $25 Restaurant Voucher (1,000 points)
- Movie Tickets for 2 (750 points)
- $50 Rent Discount (2,000 points)
- Gym Membership - 1 Month (1,500 points)
- Coffee Shop Gift Card (600 points)
- Streaming Service - 3 Months (1,200 points)
- $100 Electronics Voucher (4,000 points)

### 9. **Redemptions** (3 past redemptions)
- Amazon gift card redeemed 30 days ago
- Coffee shop card redeemed 15 days ago
- Movie tickets redeemed 5 days ago

### 10. **AI Conversations** (3 conversations)
- **Budget Planning Help**: Multi-turn conversation about creating budgets and saving money
- **Rent Payment Questions**: Q&A about due dates and reward points
- **Expense Analysis**: Detailed spending pattern analysis with recommendations

## Features You Can Test

After running this script, you can immediately test:

✅ **Dashboard Views**
- View comprehensive tenant dashboard
- See upcoming and past bills
- Check reward points balance

✅ **Bill Management**
- View unpaid current bills
- See payment history
- Test Stripe payment integration with unpaid bills

✅ **Expense Tracking**
- Browse 3 months of categorized expenses
- View spending by category
- See expense trends over time

✅ **Budget Management**
- View active weekly and monthly budgets
- See category-wise budget allocations
- Check budget progress and days completed
- Visual budget charts and progress indicators

✅ **Rent Plans**
- View active lease details
- Review pending lease offers
- See completed lease history
- Test rent plan acceptance flow

✅ **Rewards System**
- View earned rewards history
- Check reward points for on-time payments
- See points balance

✅ **Shop/Redemption**
- Browse available rewards in shop
- View redemption history
- Test point redemption (if enough points)

✅ **AI Chatbot**
- View conversation history
- Continue existing conversations
- Ask new questions about finances, budgets, bills

✅ **Property Information**
- View assigned property details (Sunset Apartments)
- See landlord information

## Additional Accounts

The script also creates a demo landlord account for testing landlord features:

- **Email**: landlord@demo.com
- **Password**: landlord123
- **Role**: Landlord

This landlord account has:
- 3 properties
- 4 tenants (including mo@gmail.com)
- Bills associated with all tenants
- Rent plans for all tenants

## Running Multiple Times

The script uses `upsert` operations, so it's safe to run multiple times:
- It will update the existing mo@gmail.com account if it exists
- It will create new data each time (expenses, bills, etc. will accumulate)
- To start fresh, clear the database first:
  ```bash
  npx prisma migrate reset
  ```

## Data Realism

The script generates realistic data:
- Random expense amounts within category-appropriate ranges
- Varied expense descriptions
- Realistic payment patterns
- Progressive date ranges (past → present → future)
- Logical relationships between entities

## Troubleshooting

If you encounter errors:

1. **Database connection issues**
   ```bash
   # Check your .env file has DATABASE_URL set
   cat .env | grep DATABASE_URL
   ```

2. **Prisma not initialized**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Missing dependencies**
   ```bash
   npm install
   ```

4. **Permission errors**
   ```bash
   chmod +x populate-demo.sh
   ```

## Next Steps

After populating the demo account:

1. **Start the backend server**
   ```bash
   npm start
   # or
   node src/server.js
   ```

2. **Start the frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Login and explore**
   - Navigate to http://localhost:3000/login
   - Use mo@gmail.com / 123456
   - Explore all features!

## Notes

- The script maintains referential integrity (all foreign keys are valid)
- Dates are dynamically calculated relative to the current date
- The tenant has a positive points balance to test redemptions
- Past bills are marked as paid to establish payment history
- Current month bills are unpaid to allow payment testing
- Budget tracking shows realistic progress
- AI conversations demonstrate the chatbot's capabilities

---

**Created by**: Demo Account Population Script v1.0  
**Last Updated**: November 9, 2025

