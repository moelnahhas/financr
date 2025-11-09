/**
 * DocuSeal API Integration for PDF Signing
 * Sends rent plan agreements for tenant signatures
 */

import fs from 'fs';

const API_KEY = process.env.DOCUSEAL_API_KEY;
const API_URL = 'https://api.docuseal.com';

/**
 * Send PDF directly for signing (one-time use)
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} signerEmail - Email of the person who will sign
 * @param {string} signerName - Full name of the signer
 * @param {string} documentName - Name of the document
 * @returns {Promise<Object>} DocuSeal submission result
 */
export async function sendPDFForSigning(pdfBuffer, signerEmail, signerName, documentName = 'Rent Plan Agreement') {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    console.log('📄 Converting PDF to base64...');
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Split name into first and last
    const nameParts = signerName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    console.log(`📧 Sending document "${documentName}" to ${signerEmail} for signing...`);
    
    const response = await fetch(`${API_URL}/submissions/init`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: documentName,
        send_email: true, // AUTOMATICALLY SENDS EMAIL TO SIGNER
        documents: [{
          name: `${documentName}.pdf`,
          file: pdfBase64
        }],
        submitters: [{
          role: 'Signer',
          email: signerEmail,
          name: signerName
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DocuSeal API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Document sent successfully via DocuSeal!');
    console.log('📧 Email sent to:', signerEmail);
    console.log('🔗 Signing URL:', result[0].slug ? `https://docuseal.com/s/${result[0].slug}` : 'Check email');
    console.log('📄 Submission ID:', result[0].submission_id);
    
    return {
      submissionId: result[0].submission_id,
      submitterId: result[0].id,
      signingUrl: result[0].slug ? `https://docuseal.com/s/${result[0].slug}` : null,
      status: result[0].status || 'pending',
      email: result[0].email
    };
    
  } catch (error) {
    console.error('❌ Error sending PDF via DocuSeal:', error.message);
    throw error;
  }
}

/**
 * Create a template from PDF (for reuse with multiple tenants)
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} templateName - Name of the template
 * @returns {Promise<string>} Template ID
 */
export async function createTemplateFromPDF(pdfBuffer, templateName = 'Rent Plan Agreement Template') {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    console.log('📝 Creating template from PDF...');
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const response = await fetch(`${API_URL}/templates/pdf`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: templateName,
        documents: [{
          name: `${templateName}.pdf`,
          file: pdfBase64
        }],
        // Define signature fields (adjust coordinates as needed for your PDF)
        fields: [
          {
            name: 'Tenant Signature',
            role: 'Signer',
            type: 'signature',
            required: true,
            areas: [{
              x: 100,      // X position in pixels
              y: 500,      // Y position in pixels
              w: 200,      // Width
              h: 50,       // Height
              page: 0      // Page number (0-indexed)
            }]
          },
          {
            name: 'Date',
            role: 'Signer',
            type: 'date',
            required: true,
            areas: [{
              x: 100,
              y: 560,
              w: 150,
              h: 30,
              page: 0
            }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Template creation failed: ${response.status} - ${errorText}`);
    }

    const template = await response.json();
    console.log('✅ Template created with ID:', template.id);
    return template.id;
    
  } catch (error) {
    console.error('❌ Error creating template:', error.message);
    throw error;
  }
}

/**
 * Send document from existing template
 * @param {string} templateId - The template ID
 * @param {string} signerEmail - Email of the signer
 * @param {string} signerName - Full name of the signer
 * @returns {Promise<Object>} Submission result
 */
export async function sendFromTemplate(templateId, signerEmail, signerName) {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    console.log('📧 Sending document from template...');
    
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        send_email: true, // AUTOMATICALLY SENDS EMAIL
        submitters: [{
          role: 'Signer',
          email: signerEmail,
          name: signerName
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Submission failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Document sent from template!');
    console.log('📧 Email sent to:', signerEmail);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error sending from template:', error.message);
    throw error;
  }
}

/**
 * Download signed PDF after completion
 * @param {string} submissionId - The DocuSeal submission ID
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function downloadSignedPDF(submissionId) {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    console.log('📥 Downloading signed PDF from DocuSeal...');
    
    const response = await fetch(`${API_URL}/submissions/${submissionId}/documents`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const documents = await response.json();
    
    if (documents.length > 0) {
      const pdfUrl = documents[0].url;
      
      // Download the PDF
      const pdfResponse = await fetch(pdfUrl);
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      
      console.log('✅ Signed PDF downloaded successfully');
      return pdfBuffer;
    } else {
      throw new Error('No documents found for this submission');
    }
    
  } catch (error) {
    console.error('❌ Error downloading signed PDF:', error.message);
    throw error;
  }
}

/**
 * Get submission status
 * @param {string} submissionId - The DocuSeal submission ID
 * @returns {Promise<Object>} Submission details
 */
export async function getSubmissionStatus(submissionId) {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get submission: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error getting submission status:', error.message);
    throw error;
  }
}

/**
 * Send PDF with custom email message
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} signerEmail - Email of the signer
 * @param {string} signerName - Full name of the signer
 * @param {string} documentName - Name of the document
 * @param {Object} customMessage - Custom email subject and body
 * @returns {Promise<Object>} Submission result
 */
export async function sendWithCustomEmail(pdfBuffer, signerEmail, signerName, documentName = 'Rent Plan Agreement', customMessage = null) {
  try {
    if (!API_KEY) {
      throw new Error('DOCUSEAL_API_KEY not configured in environment variables');
    }

    const pdfBase64 = pdfBuffer.toString('base64');
    
    const payload = {
      name: documentName,
      send_email: true,
      documents: [{
        name: `${documentName}.pdf`,
        file: pdfBase64
      }],
      submitters: [{
        role: 'Signer',
        email: signerEmail,
        name: signerName
      }]
    };

    // Add custom message if provided
    if (customMessage) {
      payload.message = {
        subject: customMessage.subject || `Please sign: ${documentName}`,
        body: customMessage.body || `Hi {{submitter.name}},\n\nPlease review and sign the attached ${documentName}.\n\nBest regards`
      };
    }
    
    const response = await fetch(`${API_URL}/submissions/init`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DocuSeal API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Document sent with custom email!');
    console.log('📧 Email sent to:', signerEmail);
    
    return {
      submissionId: result[0].submission_id,
      submitterId: result[0].id,
      signingUrl: result[0].slug ? `https://docuseal.com/s/${result[0].slug}` : null,
      status: result[0].status || 'pending'
    };
    
  } catch (error) {
    console.error('❌ Error sending PDF with custom email:', error.message);
    throw error;
  }
}

export default {
  sendPDFForSigning,
  createTemplateFromPDF,
  sendFromTemplate,
  downloadSignedPDF,
  getSubmissionStatus,
  sendWithCustomEmail
};

