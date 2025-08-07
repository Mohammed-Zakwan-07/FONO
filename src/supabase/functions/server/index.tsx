import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.supabase.co'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Voice transcription endpoint
app.post('/make-server-8200c55f/transcribe', async (c) => {
  try {
    const { audioData } = await c.req.json();
    
    // Mock transcription (in production, integrate with OpenAI Whisper or similar)
    const mockTranscriptions = [
      "I'd like to schedule an appointment for next Tuesday at 2 PM",
      "What are your business hours today?",
      "I need to cancel my appointment for tomorrow",
      "Do you accept walk-in customers?",
      "Can I speak to someone about your services?",
      "I'm having trouble with my recent order",
      "What's the wait time for appointments?",
      "Is Dr. Smith available this week?"
    ];
    
    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    
    return c.json({ 
      success: true, 
      transcription,
      confidence: 0.95
    });
  } catch (error) {
    console.log(`Transcription error: ${error}`);
    return c.json({ success: false, error: 'Transcription failed' }, 500);
  }
});

// AI conversation processing
app.post('/make-server-8200c55f/process-conversation', async (c) => {
  try {
    const { message, sessionId, customerInfo } = await c.req.json();
    
    // Store conversation
    const conversationKey = `conversation:${sessionId}:${Date.now()}`;
    await kv.set(conversationKey, {
      message,
      timestamp: new Date().toISOString(),
      customerInfo,
      type: 'customer_input'
    });

    // AI processing logic (mock intelligent responses)
    let response = '';
    let action = null;
    let formData = null;

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('book')) {
      // Extract appointment details
      const timeMatch = lowerMessage.match(/(\d{1,2})\s*(pm|am|o'clock)/i);
      const dayMatch = lowerMessage.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)/i);
      
      const time = timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : '2:00 PM';
      const day = dayMatch ? dayMatch[1] : 'Tuesday';
      
      formData = {
        type: 'appointment',
        customerName: customerInfo?.name || 'New Customer',
        customerEmail: customerInfo?.email || 'customer@example.com',
        customerPhone: customerInfo?.phone || '(555) 123-4567',
        appointmentDate: day,
        appointmentTime: time,
        service: 'General Consultation',
        status: 'confirmed'
      };

      response = `Perfect! I've scheduled your appointment for ${day} at ${time}. You'll receive a confirmation email shortly with all the details. Is there anything else I can help you with today?`;
      action = 'book_appointment';

    } else if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('close')) {
      response = "We're open Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 4:00 PM. We're closed on Sundays. Is there a specific time you'd like to visit?";
      
    } else if (lowerMessage.includes('cancel')) {
      response = "I can help you cancel your appointment. Could you please provide your name or appointment confirmation number so I can locate your booking?";
      action = 'cancel_request';
      
    } else if (lowerMessage.includes('insurance') || lowerMessage.includes('payment') || lowerMessage.includes('cost')) {
      response = "We accept most major insurance plans including Blue Cross Blue Shield, Aetna, Cigna, and UnitedHealthcare. We also offer flexible payment options. Would you like me to verify your specific insurance coverage?";
      
    } else if (lowerMessage.includes('wait time') || lowerMessage.includes('how long')) {
      response = "Current wait times are approximately 15-20 minutes for walk-ins. However, I'd be happy to schedule you an appointment to avoid any wait. What time works best for you?";
      
    } else {
      response = "Thank you for reaching out! I'd be happy to help you with that. Let me connect you with the right person who can assist you further. In the meantime, is there anything else I can help you with?";
      action = 'transfer_to_human';
    }

    // Store AI response
    const responseKey = `conversation:${sessionId}:${Date.now() + 1}`;
    await kv.set(responseKey, {
      message: response,
      timestamp: new Date().toISOString(),
      action,
      formData,
      type: 'ai_response'
    });

    return c.json({
      success: true,
      response,
      action,
      formData,
      confidence: 0.92
    });

  } catch (error) {
    console.log(`Conversation processing error: ${error}`);
    return c.json({ success: false, error: 'Failed to process conversation' }, 500);
  }
});

// Form submission and CRM integration
app.post('/make-server-8200c55f/submit-form', async (c) => {
  try {
    const formData = await c.req.json();
    
    // Store in CRM (using KV store as mock CRM)
    const recordId = `crm:${formData.type}:${Date.now()}`;
    await kv.set(recordId, {
      ...formData,
      id: recordId,
      createdAt: new Date().toISOString(),
      source: 'ai_receptionist',
      status: formData.status || 'active'
    });

    // Also store in Google Sheets format (mock structure)
    const sheetsData = {
      timestamp: new Date().toISOString(),
      customerName: formData.customerName,
      email: formData.customerEmail,
      phone: formData.customerPhone,
      service: formData.service,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      notes: formData.notes || '',
      source: 'AI Receptionist'
    };
    
    const sheetsKey = `sheets:appointments:${Date.now()}`;
    await kv.set(sheetsKey, sheetsData);

    console.log(`Form submitted successfully: ${recordId}`);
    
    return c.json({
      success: true,
      recordId,
      message: 'Form submitted and stored in CRM'
    });

  } catch (error) {
    console.log(`Form submission error: ${error}`);
    return c.json({ success: false, error: 'Failed to submit form' }, 500);
  }
});

// Send automated notifications
app.post('/make-server-8200c55f/send-notification', async (c) => {
  try {
    const { type, recipientEmail, recipientPhone, data } = await c.req.json();
    
    let emailContent = '';
    let smsContent = '';

    if (type === 'appointment_confirmation') {
      emailContent = `
        <h2>Appointment Confirmation</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your appointment has been confirmed for:</p>
        <ul>
          <li><strong>Date:</strong> ${data.appointmentDate}</li>
          <li><strong>Time:</strong> ${data.appointmentTime}</li>
          <li><strong>Service:</strong> ${data.service}</li>
        </ul>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing our services!</p>
      `;
      
      smsContent = `Appointment confirmed for ${data.appointmentDate} at ${data.appointmentTime}. Service: ${data.service}. Reply STOP to opt out.`;
    }

    // Store notification record
    const notificationId = `notification:${type}:${Date.now()}`;
    await kv.set(notificationId, {
      id: notificationId,
      type,
      recipientEmail,
      recipientPhone,
      emailContent,
      smsContent,
      sentAt: new Date().toISOString(),
      status: 'sent',
      data
    });

    console.log(`Notification sent: ${type} to ${recipientEmail}`);

    return c.json({
      success: true,
      notificationId,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.log(`Notification sending error: ${error}`);
    return c.json({ success: false, error: 'Failed to send notification' }, 500);
  }
});

// Get conversation history
app.get('/make-server-8200c55f/conversations/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const conversations = await kv.getByPrefix(`conversation:${sessionId}`);
    
    // Sort by timestamp
    const sortedConversations = conversations
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return c.json({
      success: true,
      conversations: sortedConversations,
      sessionId
    });

  } catch (error) {
    console.log(`Error fetching conversations: ${error}`);
    return c.json({ success: false, error: 'Failed to fetch conversations' }, 500);
  }
});

// Get CRM records
app.get('/make-server-8200c55f/crm-records', async (c) => {
  try {
    const type = c.req.query('type') || 'appointment';
    const limit = parseInt(c.req.query('limit') || '10');
    
    const records = await kv.getByPrefix(`crm:${type}`);
    const sortedRecords = records
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return c.json({
      success: true,
      records: sortedRecords,
      total: records.length
    });

  } catch (error) {
    console.log(`Error fetching CRM records: ${error}`);
    return c.json({ success: false, error: 'Failed to fetch CRM records' }, 500);
  }
});

// Health check
app.get('/make-server-8200c55f/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AI Receptionist Backend'
  });
});

console.log('AI Receptionist server starting...');
Deno.serve(app.fetch);