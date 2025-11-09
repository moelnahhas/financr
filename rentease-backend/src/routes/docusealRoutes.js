/**
 * DocuSeal Routes
 * Handles DocuSeal webhook events and signing status
 */

import express from 'express';
import { handleDocusealWebhook, getSigningStatus } from '../controllers/docusealController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/docuseal/webhook
 * Webhook endpoint for DocuSeal events
 * No authentication required (webhooks come from DocuSeal servers)
 */
router.post('/webhook', handleDocusealWebhook);

/**
 * GET /api/docuseal/status/:planId
 * Get signing status for a rent plan
 * Requires authentication
 */
router.get('/status/:planId', authenticate, getSigningStatus);

export default router;

