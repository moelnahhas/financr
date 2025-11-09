/**
 * DocuSeal Webhook Controller
 * Handles webhook events from DocuSeal for document signing
 */

import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { downloadSignedPDF } from '../utils/docuseal.js';

/**
 * Handle DocuSeal webhook events
 * Webhook events:
 * - form.completed: Document has been signed
 * - form.viewed: Document has been viewed
 * - form.declined: Signer declined to sign
 */
export const handleDocusealWebhook = asyncHandler(async (req, res) => {
    console.log('📨 DocuSeal webhook received');
    
    const event = req.body;
    const eventType = event.event_type;
    
    if (!eventType) {
        console.error('❌ No event_type in webhook payload');
        return res.status(400).json({ error: 'Missing event_type' });
    }
    
    console.log(`📋 Event type: ${eventType}`);
    console.log(`📄 Data:`, JSON.stringify(event.data, null, 2));
    
    try {
        switch(eventType) {
            case 'form.completed':
                await handleFormCompleted(event.data);
                break;
                
            case 'form.viewed':
                await handleFormViewed(event.data);
                break;
                
            case 'form.declined':
                await handleFormDeclined(event.data);
                break;
                
            default:
                console.log(`ℹ️ Unhandled event type: ${eventType}`);
        }
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ Error processing DocuSeal webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle form completed event (document signed)
 */
async function handleFormCompleted(data) {
    console.log('✅ Document signed!');
    console.log(`📧 Signed by: ${data.email}`);
    console.log(`📄 Submission ID: ${data.submission_id}`);
    
    // Find the rent plan by submission ID
    const rentPlan = await prisma.rentPlan.findFirst({
        where: { docusealSubmissionId: data.submission_id },
        include: {
            tenant: true,
            landlord: true,
        },
    });
    
    if (!rentPlan) {
        console.warn(`⚠️ No rent plan found for submission ID: ${data.submission_id}`);
        return;
    }
    
    console.log(`📋 Found rent plan: ${rentPlan.id}`);
    
    try {
        // Download the signed PDF
        const signedPdfBuffer = await downloadSignedPDF(data.submission_id);
        
        // In a production app, you'd upload this to S3 or similar
        // For now, we'll just log that we got it
        console.log(`📥 Downloaded signed PDF (${signedPdfBuffer.length} bytes)`);
        
        // Update rent plan with signing information
        await prisma.rentPlan.update({
            where: { id: rentPlan.id },
            data: {
                docusealStatus: 'signed',
                docusealSignedAt: new Date(),
                // In production, store the S3 URL here
                // docusealSignedPdfUrl: s3Url,
            },
        });
        
        console.log(`✅ Rent plan ${rentPlan.id} updated with signing information`);
        console.log(`👤 Tenant ${rentPlan.tenant.name} has signed the agreement`);
        
        // TODO: Optionally notify the landlord that the document was signed
        // You could send an email or push notification here
        
    } catch (error) {
        console.error('❌ Error processing signed document:', error);
        
        // Update status even if download fails
        await prisma.rentPlan.update({
            where: { id: rentPlan.id },
            data: {
                docusealStatus: 'signed',
                docusealSignedAt: new Date(),
            },
        });
    }
}

/**
 * Handle form viewed event
 */
async function handleFormViewed(data) {
    console.log('👁️ Document viewed');
    console.log(`📧 Viewed by: ${data.email}`);
    console.log(`📄 Submission ID: ${data.submission_id}`);
    
    // Find and update the rent plan
    const rentPlan = await prisma.rentPlan.findFirst({
        where: { docusealSubmissionId: data.submission_id },
    });
    
    if (!rentPlan) {
        console.warn(`⚠️ No rent plan found for submission ID: ${data.submission_id}`);
        return;
    }
    
    // Update status to 'viewed' if still pending
    if (rentPlan.docusealStatus === 'pending') {
        await prisma.rentPlan.update({
            where: { id: rentPlan.id },
            data: {
                docusealStatus: 'viewed',
            },
        });
        
        console.log(`✅ Rent plan ${rentPlan.id} status updated to 'viewed'`);
    }
}

/**
 * Handle form declined event
 */
async function handleFormDeclined(data) {
    console.log('❌ Document declined');
    console.log(`📧 Declined by: ${data.email}`);
    console.log(`📄 Submission ID: ${data.submission_id}`);
    
    // Find and update the rent plan
    const rentPlan = await prisma.rentPlan.findFirst({
        where: { docusealSubmissionId: data.submission_id },
        include: {
            tenant: true,
            landlord: true,
        },
    });
    
    if (!rentPlan) {
        console.warn(`⚠️ No rent plan found for submission ID: ${data.submission_id}`);
        return;
    }
    
    // Update status to declined
    await prisma.rentPlan.update({
        where: { id: rentPlan.id },
        data: {
            docusealStatus: 'declined',
            // Optionally also update the rent plan status
            // status: 'rejected',
        },
    });
    
    console.log(`✅ Rent plan ${rentPlan.id} status updated to 'declined'`);
    console.log(`👤 Tenant ${rentPlan.tenant.name} declined to sign the agreement`);
    
    // TODO: Notify the landlord that the tenant declined
}

/**
 * Get signing status for a rent plan
 */
export const getSigningStatus = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    
    const rentPlan = await prisma.rentPlan.findUnique({
        where: { id: planId },
        select: {
            id: true,
            tenantId: true,
            landlordId: true,
            docusealSubmissionId: true,
            docusealSigningUrl: true,
            docusealStatus: true,
            docusealSignedAt: true,
            docusealSignedPdfUrl: true,
        },
    });
    
    if (!rentPlan) {
        const error = new Error('Rent plan not found');
        error.status = 404;
        throw error;
    }
    
    // Check authorization
    if (req.user.role === 'tenant' && rentPlan.tenantId !== req.user.id) {
        const error = new Error('Unauthorized');
        error.status = 403;
        throw error;
    }
    
    if (req.user.role === 'landlord' && rentPlan.landlordId !== req.user.id) {
        const error = new Error('Unauthorized');
        error.status = 403;
        throw error;
    }
    
    res.json({
        planId: rentPlan.id,
        submissionId: rentPlan.docusealSubmissionId,
        signingUrl: rentPlan.docusealSigningUrl,
        status: rentPlan.docusealStatus,
        signedAt: rentPlan.docusealSignedAt,
        signedPdfUrl: rentPlan.docusealSignedPdfUrl,
    });
});

export default {
    handleDocusealWebhook,
    getSigningStatus,
};

