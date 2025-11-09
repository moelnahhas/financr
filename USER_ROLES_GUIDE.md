# User Roles & Permissions Guide

## 🎭 User Roles

### 👤 Tenant Role
**What Tenants Can Do:**
- ✅ View and track personal expenses
- ✅ Create expense entries
- ✅ Set and manage budgets
- ✅ View bills assigned by their landlord
- ✅ Pay bills via Stripe
- ✅ **Accept** or **Reject** rent plans sent by landlords
- ✅ Pay rent plan deposit via Stripe
- ✅ Earn points for on-time payments
- ✅ Redeem points in the shop
- ✅ Use AI chat for financial insights

**What Tenants CANNOT Do:**
- ❌ Create rent plans (only landlords can create them)
- ❌ Create bills for others
- ❌ Manage properties
- ❌ View other tenants' data

### 🏢 Landlord Role
**What Landlords Can Do:**
- ✅ Create and manage properties
- ✅ **Create** rent plans for tenants
- ✅ Create bills for tenants (rent, utilities, etc.)
- ✅ View all their tenants
- ✅ Track payments received
- ✅ Cancel pending rent plans
- ✅ Assign tenants to properties
- ✅ View tenant payment history

**What Landlords CANNOT Do:**
- ❌ Accept rent plans (only tenants accept them)
- ❌ Track personal expenses (property expense tracking coming soon)
- ❌ Earn reward points
- ❌ Shop rewards (tenant-only feature)

## 🔄 Typical Workflow

### Rent Plan Process:
1. **Landlord** creates a rent plan for a tenant (using tenant's username)
2. **Tenant** receives the plan in their dashboard
3. **Tenant** can either Accept or Reject the plan
4. If **Tenant** accepts → they pay the deposit via Stripe
5. Upon payment → tenant is linked to landlord and plan is completed

### Bill Payment Process:
1. **Landlord** creates a bill for a tenant
2. **Tenant** sees the bill in their dashboard
3. **Tenant** pays the bill via Stripe
4. **Tenant** earns points for on-time payment
5. **Landlord** sees payment received

## 🚨 Common Errors & Solutions

### "Only tenants can accept rent plans"
**Problem:** You're logged in as a **landlord** trying to accept a rent plan.
**Solution:** 
- Landlords CREATE rent plans, they don't accept them
- Log in as a tenant to accept rent plans
- Or create a new tenant account

### "Only tenants can add expenses"
**Problem:** You're logged in as a **landlord** trying to add personal expenses.
**Solution:**
- Current version: Expenses are for tenant financial tracking
- Workaround: Create a tenant account for personal expense tracking
- Coming soon: Landlord property expense tracking

### "Only landlords can create rent plans"
**Problem:** You're logged in as a **tenant** trying to create a rent plan.
**Solution:**
- Tenants can only ACCEPT or REJECT rent plans
- Log in as a landlord to create rent plans
- Or create a landlord account

## 🔧 How to Fix Your Account

### If you need to be a different role:
1. Sign out of your current account
2. Go to `/signup`
3. Select the correct role (Tenant or Landlord)
4. Create a new account

### If you need both roles:
- Create two separate accounts (one tenant, one landlord)
- Use different email addresses
- Switch between them as needed

## 📝 Testing the App

### To test as a Tenant:
1. Sign up with role = "Tenant"
2. Username example: `t-john-abc123`
3. Wait for landlord to send you a rent plan
4. Accept the plan and pay deposit
5. Add your personal expenses
6. Set up budgets
7. Pay bills when landlord creates them

### To test as a Landlord:
1. Sign up with role = "Landlord"  
2. Username example: `l-jane-xyz789`
3. Create a property
4. Create a rent plan for a tenant (use their username)
5. Create bills for tenants
6. View payments received

## 🎯 Quick Reference

| Feature | Tenant | Landlord |
|---------|--------|----------|
| Create Expenses | ✅ | ❌ |
| View Expenses | ✅ | ❌ |
| Set Budgets | ✅ | ❌ |
| Accept Rent Plans | ✅ | ❌ |
| Reject Rent Plans | ✅ | ❌ |
| Create Rent Plans | ❌ | ✅ |
| Cancel Rent Plans | ❌ | ✅ |
| Create Bills | ❌ | ✅ |
| Pay Bills | ✅ | ❌ |
| Manage Properties | ❌ | ✅ |
| Earn Points | ✅ | ❌ |
| Redeem Points | ✅ | ❌ |
| AI Chat | ✅ | ❌ |

## 🛠️ Current Limitation Note

The current version requires separate accounts for different roles. This is intentional to keep clear separation between tenant and landlord activities. If you need to test both roles, create two accounts.

