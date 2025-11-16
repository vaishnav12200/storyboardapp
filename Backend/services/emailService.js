const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `CineCore <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request - CineCore',
      html: this.getPasswordResetTemplate(firstName, resetURL)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  getPasswordResetTemplate(firstName, resetURL) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { width: 60px; height: 60px; margin: 0 auto 20px; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎬</div>
          <h1>CineCore</h1>
          <p>Professional Film Production Platform</p>
        </div>
        
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName || 'there'},</p>
          
          <p>We received a request to reset your password for your CineCore account. If you made this request, click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetURL}" class="button">Reset My Password</a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetURL}</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in <strong>10 minutes</strong></li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
            </ul>
          </div>
          
          <p>Need help? Reply to this email or contact our support team.</p>
          
          <p>Best regards,<br>The CineCore Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} CineCore. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: `CineCore <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to CineCore! 🎬',
      html: this.getWelcomeTemplate(firstName)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Welcome email sending failed:', error);
      // Don't throw error for welcome email failure
      return { success: false };
    }
  }

  getWelcomeTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .features { display: grid; gap: 15px; margin: 20px 0; }
        .feature { display: flex; align-items: center; }
        .feature-icon { margin-right: 10px; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 60px; margin-bottom: 20px;">🎬</div>
          <h1>Welcome to CineCore!</h1>
          <p>Professional Film Production Platform</p>
        </div>
        
        <div class="content">
          <h2>Welcome aboard, ${firstName}! 🎉</h2>
          
          <p>Thank you for joining CineCore, the professional film production platform trusted by creators worldwide.</p>
          
          <div class="features">
            <div class="feature">
              <span class="feature-icon">🎨</span> Create stunning storyboards with AI-powered tools
            </div>
            <div class="feature">
              <span class="feature-icon">📅</span> Manage schedules and coordinate your team
            </div>
            <div class="feature">
              <span class="feature-icon">💰</span> Track budgets and manage expenses
            </div>
            <div class="feature">
              <span class="feature-icon">📍</span> Discover and organize filming locations
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started Now</a>
          </div>
          
          <p>If you have any questions, feel free to reach out to our support team anytime.</p>
          
          <p>Happy filmmaking!<br>The CineCore Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();