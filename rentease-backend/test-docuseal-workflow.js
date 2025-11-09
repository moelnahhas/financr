/**
 * DocuSeal Workflow Test Script
 * 
 * This script tests the complete DocuSeal integration workflow:
 * 1. Creates test landlord and tenant accounts
 * 2. Landlord proposes rent plan (triggers PDF sending)
 * 3. Simulates DocuSeal webhook events
 * 4. Verifies signing status updates
 * 
 * Usage: node test-docuseal-workflow.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';

// Test data
const MOCK_DATA = {
  landlord: {
    email: 'landlord.test@example.com',
    username: 'landlord_test',
    password: 'Test123!@#',
    name: 'John Landlord',
    role: 'landlord'
  },
  tenant: {
    email: 'mohamed.elnahhas@icloud.com',
    username: 'mohamed_tenant',
    password: 'Test123!@#',
    name: 'Mohamed Elnahhas',
    role: 'tenant'
  },
  rentPlan: {
    monthlyRent: 1500,
    deposit: 3000,
    duration: 12,
    startDate: '2025-12-01',
    description: 'Test rent plan for DocuSeal integration'
  }
};

// Store test state
const testState = {
  landlordToken: null,
  tenantToken: null,
  rentPlanId: null,
  docusealSubmissionId: null
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

function logError(message, error) {
  console.error(`❌ ${message}`);
  if (error.response) {
    console.error('Response:', error.response.status, error.response.statusText);
    console.error('Data:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
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

// Test functions
async function testHealthCheck() {
  logSection('1. Health Check');
  try {
    const data = await apiRequest('/health');
    log('✅', 'Server is running', data);
    return true;
  } catch (error) {
    logError('Server health check failed', error);
    return false;
  }
}

async function testCreateLandlord() {
  logSection('2. Create Landlord Account');
  try {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: MOCK_DATA.landlord
    });
    
    testState.landlordToken = data.token;
    log('✅', 'Landlord account created', {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role
    });
    return true;
  } catch (error) {
    // If user already exists, try to login
    if (error.message.includes('already exists')) {
      log('ℹ️', 'Landlord already exists, attempting login...');
      try {
        const loginData = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: {
            email: MOCK_DATA.landlord.email,
            password: MOCK_DATA.landlord.password
          }
        });
        testState.landlordToken = loginData.token;
        log('✅', 'Landlord logged in successfully');
        return true;
      } catch (loginError) {
        logError('Login failed', loginError);
        return false;
      }
    }
    logError('Failed to create landlord', error);
    return false;
  }
}

async function testCreateTenant() {
  logSection('3. Create Tenant Account');
  try {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: MOCK_DATA.tenant
    });
    
    testState.tenantToken = data.token;
    log('✅', 'Tenant account created', {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role
    });
    log('📧', `Tenant email: ${MOCK_DATA.tenant.email}`);
    return true;
  } catch (error) {
    // If user already exists, try to login
    if (error.message.includes('already exists')) {
      log('ℹ️', 'Tenant already exists, attempting login...');
      try {
        const loginData = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: {
            email: MOCK_DATA.tenant.email,
            password: MOCK_DATA.tenant.password
          }
        });
        testState.tenantToken = loginData.token;
        log('✅', 'Tenant logged in successfully');
        return true;
      } catch (loginError) {
        logError('Login failed', loginError);
        return false;
      }
    }
    logError('Failed to create tenant', error);
    return false;
  }
}

async function testCreateRentPlan() {
  logSection('4. Create Rent Plan (Triggers DocuSeal)');
  try {
    const data = await apiRequest('/api/rent-plans', {
      method: 'POST',
      token: testState.landlordToken,
      body: {
        tenantUsername: MOCK_DATA.tenant.username,
        ...MOCK_DATA.rentPlan
      }
    });
    
    testState.rentPlanId = data.plan.id;
    testState.docusealSubmissionId = data.plan.docusealSubmissionId;
    
    log('✅', 'Rent plan created successfully', {
      planId: data.plan.id,
      status: data.plan.status,
      monthlyRent: data.plan.monthlyRent,
      deposit: data.plan.deposit,
      duration: data.plan.duration
    });
    
    if (data.plan.docusealSubmissionId) {
      log('📄', 'DocuSeal integration triggered!', {
        submissionId: data.plan.docusealSubmissionId,
        submitterId: data.plan.docusealSubmitterId,
        signingUrl: data.plan.docusealSigningUrl,
        status: data.plan.docusealStatus
      });
      log('📧', `Signing email should be sent to: ${MOCK_DATA.tenant.email}`);
    } else {
      log('⚠️', 'DocuSeal integration did not trigger (check DOCUSEAL_API_KEY in .env)');
      log('ℹ️', 'This is expected if DocuSeal API key is not configured');
    }
    
    return true;
  } catch (error) {
    logError('Failed to create rent plan', error);
    return false;
  }
}

async function testGetSigningStatus() {
  logSection('5. Check Signing Status');
  
  if (!testState.rentPlanId) {
    log('⚠️', 'No rent plan ID available, skipping status check');
    return false;
  }
  
  try {
    const data = await apiRequest(`/api/docuseal/status/${testState.rentPlanId}`, {
      token: testState.landlordToken
    });
    
    log('✅', 'Signing status retrieved', {
      planId: data.planId,
      submissionId: data.submissionId,
      signingUrl: data.signingUrl,
      status: data.status,
      signedAt: data.signedAt
    });
    return true;
  } catch (error) {
    logError('Failed to get signing status', error);
    return false;
  }
}

async function testSimulateWebhookViewed() {
  logSection('6. Simulate Webhook: Document Viewed');
  
  if (!testState.docusealSubmissionId) {
    log('⚠️', 'No submission ID available, skipping webhook simulation');
    log('ℹ️', 'This is expected if DocuSeal API key is not configured');
    return false;
  }
  
  try {
    const webhookPayload = {
      event_type: 'form.viewed',
      data: {
        submission_id: testState.docusealSubmissionId,
        email: MOCK_DATA.tenant.email,
        viewed_at: new Date().toISOString()
      }
    };
    
    await apiRequest('/api/docuseal/webhook', {
      method: 'POST',
      body: webhookPayload
    });
    
    log('✅', 'Webhook "form.viewed" processed');
    log('👁️', `Document marked as viewed by ${MOCK_DATA.tenant.email}`);
    
    // Wait a bit then check status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusData = await apiRequest(`/api/docuseal/status/${testState.rentPlanId}`, {
      token: testState.landlordToken
    });
    
    log('📊', 'Updated status:', { status: statusData.status });
    return true;
  } catch (error) {
    logError('Failed to simulate webhook', error);
    return false;
  }
}

async function testSimulateWebhookSigned() {
  logSection('7. Simulate Webhook: Document Signed');
  
  if (!testState.docusealSubmissionId) {
    log('⚠️', 'No submission ID available, skipping webhook simulation');
    log('ℹ️', 'This is expected if DocuSeal API key is not configured');
    return false;
  }
  
  try {
    const webhookPayload = {
      event_type: 'form.completed',
      data: {
        submission_id: testState.docusealSubmissionId,
        email: MOCK_DATA.tenant.email,
        signed_at: new Date().toISOString()
      }
    };
    
    await apiRequest('/api/docuseal/webhook', {
      method: 'POST',
      body: webhookPayload
    });
    
    log('✅', 'Webhook "form.completed" processed');
    log('✍️', `Document marked as signed by ${MOCK_DATA.tenant.email}`);
    
    // Wait a bit then check status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusData = await apiRequest(`/api/docuseal/status/${testState.rentPlanId}`, {
      token: testState.landlordToken
    });
    
    log('📊', 'Final status:', {
      status: statusData.status,
      signedAt: statusData.signedAt
    });
    return true;
  } catch (error) {
    logError('Failed to simulate webhook', error);
    return false;
  }
}

async function testGetRentPlans() {
  logSection('8. Verify Rent Plan in Database');
  try {
    // Check as landlord
    const landlordData = await apiRequest('/api/rent-plans', {
      token: testState.landlordToken
    });
    
    log('✅', `Landlord can see ${landlordData.plans.length} rent plan(s)`);
    
    if (landlordData.plans.length > 0) {
      const plan = landlordData.plans[0];
      log('📋', 'Latest rent plan:', {
        id: plan.id,
        status: plan.status,
        docusealStatus: plan.docusealStatus,
        monthlyRent: plan.monthlyRent,
        tenant: plan.tenant.name
      });
    }
    
    // Check as tenant
    const tenantData = await apiRequest('/api/rent-plans', {
      token: testState.tenantToken
    });
    
    log('✅', `Tenant can see ${tenantData.plans.length} rent plan(s)`);
    
    return true;
  } catch (error) {
    logError('Failed to get rent plans', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     DOCUSEAL WORKFLOW TEST SUITE                          ║');
  console.log('║     Testing with: mohamed.elnahhas@icloud.com             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  log('🔧', `API Base URL: ${API_BASE_URL}`);
  log('🔑', `DocuSeal API Key: ${process.env.DOCUSEAL_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Create Landlord', fn: testCreateLandlord },
    { name: 'Create Tenant', fn: testCreateTenant },
    { name: 'Create Rent Plan', fn: testCreateRentPlan },
    { name: 'Get Signing Status', fn: testGetSigningStatus },
    { name: 'Simulate Webhook (Viewed)', fn: testSimulateWebhookViewed },
    { name: 'Simulate Webhook (Signed)', fn: testSimulateWebhookSigned },
    { name: 'Verify Rent Plans', fn: testGetRentPlans }
  ];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`\n❌ Test "${test.name}" threw error:`, error.message);
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  logSection('TEST SUMMARY');
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.\n');
  }
  
  // Print next steps
  logSection('NEXT STEPS');
  console.log('1. Check the tenant email: mohamed.elnahhas@icloud.com');
  console.log('   - Look for email from DocuSeal with signing link');
  console.log('   - Check spam folder if not in inbox');
  console.log('');
  console.log('2. Visit DocuSeal dashboard:');
  console.log('   https://console.docuseal.com/submissions');
  console.log('   - View submission status');
  console.log('   - Resend email if needed');
  console.log('');
  console.log('3. Test actual signing:');
  console.log('   - Click the link in the email');
  console.log('   - Sign the document');
  console.log('   - Webhook will automatically update the database');
  console.log('');
  
  if (testState.rentPlanId) {
    console.log('4. Check signing status via API:');
    console.log(`   GET ${API_BASE_URL}/api/docuseal/status/${testState.rentPlanId}`);
    console.log(`   Authorization: Bearer ${testState.landlordToken?.substring(0, 20)}...`);
    console.log('');
  }
  
  console.log('═'.repeat(60));
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

