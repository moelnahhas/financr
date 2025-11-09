/**
 * Simple DocuSeal Test - Just Send PDF for Signing
 * 
 * This script:
 * 1. Logs into existing landlord and tenant accounts
 * 2. Creates a rent plan (generates PDF)
 * 3. Sends PDF to DocuSeal to make it signable
 * 4. Sends signing link to tenant email
 * 
 * Usage: node test-docuseal-simple.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// Use existing account credentials
const CREDENTIALS = {
  landlord: {
    email: 'landlord@demo.com',
    password: 'landlord123'
  },
  tenant: {
    email: 'mohamed.elnahhas@icloud.com',
    username: 'mo_demo'
  }
};

// Rent plan data for PDF generation
const RENT_PLAN_DATA = {
  monthlyRent: 1800,
  deposit: 3600,
  duration: 12,
  startDate: '2025-12-15',
  description: 'Modern 2BR apartment - DocuSeal signing test'
};

// Test state
const state = {
  landlordToken: null,
  rentPlanId: null,
  docusealSubmissionId: null,
  signingUrl: null
};

// Utility functions
function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
      ...options.headers
    }
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

// Main workflow
async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     SIMPLE DOCUSEAL TEST - PDF SIGNING                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  log('🔧', `API: ${API_BASE_URL}`);
  log('🔑', `DocuSeal: ${process.env.DOCUSEAL_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  log('📧', `Tenant email: ${CREDENTIALS.tenant.email}`);
  console.log('');

  try {
    // Step 1: Login as landlord
    logSection('1. Login as Landlord');
    const loginData = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: CREDENTIALS.landlord.email,
        password: CREDENTIALS.landlord.password
      }
    });
    
    state.landlordToken = loginData.token;
    log('✅', 'Logged in as landlord', {
      name: loginData.user.name,
      email: loginData.user.email
    });

    // Step 2: Create rent plan (this will trigger DocuSeal)
    logSection('2. Create Rent Plan & Send to DocuSeal');
    log('📄', 'Creating rent plan for tenant...');
    
    const rentPlanData = await apiRequest('/api/rent-plans', {
      method: 'POST',
      token: state.landlordToken,
      body: {
        tenantUsername: CREDENTIALS.tenant.username,
        ...RENT_PLAN_DATA
      }
    });
    
    state.rentPlanId = rentPlanData.plan.id;
    state.docusealSubmissionId = rentPlanData.plan.docusealSubmissionId;
    state.signingUrl = rentPlanData.plan.docusealSigningUrl;
    
    log('✅', 'Rent plan created!', {
      planId: rentPlanData.plan.id,
      status: rentPlanData.plan.status,
      monthlyRent: `$${rentPlanData.plan.monthlyRent}`,
      deposit: `$${rentPlanData.plan.deposit}`,
      duration: `${rentPlanData.plan.duration} months`
    });

    // Step 3: Check DocuSeal integration
    logSection('3. DocuSeal Integration Status');
    
    if (rentPlanData.plan.docusealSubmissionId) {
      log('🎉', 'PDF sent to DocuSeal successfully!');
      log('📧', `Signing email sent to: ${CREDENTIALS.tenant.email}`);
      console.log('');
      log('🔗', 'Signing URL:', {
        url: rentPlanData.plan.docusealSigningUrl
      });
      console.log('');
      log('📊', 'DocuSeal Details:', {
        submissionId: rentPlanData.plan.docusealSubmissionId,
        submitterId: rentPlanData.plan.docusealSubmitterId,
        status: rentPlanData.plan.docusealStatus
      });
    } else {
      log('⚠️', 'DocuSeal integration did not trigger');
      log('ℹ️', 'Check DOCUSEAL_API_KEY in .env file');
      console.log('');
      console.log('To enable DocuSeal:');
      console.log('1. Get API key from https://console.docuseal.com/api');
      console.log('2. Add to .env: DOCUSEAL_API_KEY=your_key_here');
      console.log('3. Restart the server');
    }

    // Step 4: Get current signing status
    logSection('4. Check Signing Status');
    
    const statusData = await apiRequest(`/api/docuseal/status/${state.rentPlanId}`, {
      token: state.landlordToken
    });
    
    log('📋', 'Current Status:', {
      planId: statusData.planId,
      status: statusData.status,
      signedAt: statusData.signedAt || 'Not signed yet',
      viewedAt: statusData.viewedAt || 'Not viewed yet'
    });

    // Success summary
    logSection('✅ SUCCESS - PDF SENT FOR SIGNING');
    
    console.log('📧 NEXT STEPS:\n');
    console.log(`1. Check email: ${CREDENTIALS.tenant.email}`);
    console.log('   - Look for email from DocuSeal');
    console.log('   - Check spam/junk folder if not in inbox\n');
    
    console.log('2. Sign the document:');
    console.log('   - Click the signing link in the email');
    console.log('   - Complete the signature');
    console.log('   - Submit the form\n');
    
    console.log('3. Check DocuSeal dashboard:');
    console.log('   https://console.docuseal.com/submissions');
    console.log('   - View submission status');
    console.log('   - Resend email if needed\n');
    
    console.log('4. Verify in database:');
    console.log(`   GET ${API_BASE_URL}/api/docuseal/status/${state.rentPlanId}`);
    console.log(`   Authorization: Bearer ${state.landlordToken?.substring(0, 30)}...\n`);
    
    if (state.signingUrl) {
      console.log('🔗 Direct Signing URL (for testing):');
      console.log(`   ${state.signingUrl}\n`);
    }
    
    console.log('═'.repeat(60));
    console.log('\n');
    
  } catch (error) {
    logSection('❌ ERROR');
    console.error('Message:', error.message);
    console.log('\n');
    console.log('Troubleshooting:');
    console.log('1. Make sure the backend server is running:');
    console.log('   cd rentease-backend && npm start\n');
    console.log('2. Check that the landlord account exists:');
    console.log(`   Email: ${CREDENTIALS.landlord.email}`);
    console.log(`   Password: ${CREDENTIALS.landlord.password}\n`);
    console.log('3. Check that the tenant account exists:');
    console.log(`   Username: ${CREDENTIALS.tenant.username}`);
    console.log(`   Email: ${CREDENTIALS.tenant.email}\n`);
    console.log('4. Verify DOCUSEAL_API_KEY in .env file\n');
    console.log('═'.repeat(60));
    console.log('\n');
    process.exit(1);
  }
}

// Run the test
main();

