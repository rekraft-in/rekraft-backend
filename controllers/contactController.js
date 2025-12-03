const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const contactController = {
  sendMessage: async (req, res) => {
    try {
      console.log('📧 Contact form received:', req.body);
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { name, email, phone, subject, message } = req.body;

      console.log('🔧 Creating email transporter...');
      
      // FIX: Use createTransport (not createTransporter)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify transporter configuration
      await transporter.verify();
      console.log('✅ Email transporter verified');

      // Email to admin
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Form: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      };

      // Auto-reply to user
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank you for contacting Rekraft',
        html: `
          <h2>Thank you for reaching out, ${name}!</h2>
          <p>We have received your message and our team will get back to you within 24 hours.</p>
          <p><strong>Your Message:</strong></p>
          <p>${message}</p>
          <hr>
          <p><strong>Rekraft Team</strong><br>
          Email: hello@rekraft.in</p>
        `,
      };

      console.log('📤 Sending emails...');
      
      // Send emails
      await transporter.sendMail(adminMailOptions);
      console.log('✅ Admin email sent to:', process.env.ADMIN_EMAIL);
      
      await transporter.sendMail(userMailOptions);
      console.log('✅ User auto-reply sent to:', email);

      res.json({
        success: true,
        message: 'Message sent successfully! We will get back to you soon.',
      });

    } catch (error) {
      console.error('❌ Contact controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
};

module.exports = contactController;