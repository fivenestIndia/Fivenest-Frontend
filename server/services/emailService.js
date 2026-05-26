/**
 * Sends a transactional email containing the software license key to the user.
 * @param {string} toEmail Recipient email address.
 * @param {string} toPhone Recipient phone number.
 * @param {string} licenseKey The generated license key.
 * @param {string} planId The purchased plan (starter/pro/premium/enterprise).
 * @param {string} planName The readable name of the plan.
 */
export const sendLicenseEmail = async (toEmail, toPhone, licenseKey, planId, planName) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "fivenest.india@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Fivenest Team";

  if (!apiKey) {
    console.error("BREVO_API_KEY is not configured. Email not sent.");
    return false;
  }

  // Premium design HTML template for the email
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0f19;
          color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .header {
          background: linear-gradient(135deg, #10b981, #059669);
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #10b981;
        }
        .intro {
          font-size: 15px;
          line-height: 1.6;
          color: #9ca3af;
          margin-bottom: 30px;
        }
        .license-card {
          background: rgba(16, 185, 129, 0.1);
          border: 1px dashed #10b981;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 30px;
        }
        .license-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #10b981;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .license-key {
          font-family: 'Courier New', Courier, monospace;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 2px;
        }
        .plan-info {
          font-size: 13px;
          color: #6b7280;
          margin-top: 10px;
        }
        .steps {
          margin-bottom: 30px;
        }
        .steps h3 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 15px;
        }
        .step-item {
          display: flex;
          margin-bottom: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: #9ca3af;
        }
        .step-number {
          background: #1f2937;
          color: #10b981;
          font-weight: 700;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .footer {
          background: #0b0f19;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #1f2937;
          font-size: 12px;
          color: #4b5563;
        }
        .footer a {
          color: #10b981;
          text-decoration: none;
        }
        .btn-download {
          display: inline-block;
          background: #10b981;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 10px;
          margin-bottom: 25px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fivenest Design Studio</h1>
        </div>
        <div class="content">
          <div class="greeting">Thank you for your purchase!</div>
          <div class="intro">
            Your payment was successful, and your license has been activated. Below is your unique license key to unlock the <strong>Fivenest Photoshop Plugin</strong>.
          </div>
          
          <div class="license-card">
            <div class="license-label">Your License Key</div>
            <div class="license-key">${licenseKey}</div>
            <div class="plan-info">Plan: ${planName} (${planId.toUpperCase()})</div>
          </div>

          <div class="steps">
            <h3>Quick Installation Guide:</h3>
            <div class="step-item">
              <span class="step-number">1</span>
              <span>Download the Fivenest Photoshop Plugin installer using the download button below.</span>
            </div>
            <div class="step-item">
              <span class="step-number">2</span>
              <span>Run the installer and restart Adobe Photoshop.</span>
            </div>
            <div class="step-item">
              <span class="step-number">3</span>
              <span>Open the plugin from <strong>Window > Extensions > Fivenest</strong> in Photoshop.</span>
            </div>
            <div class="step-item">
              <span class="step-number">4</span>
              <span>Enter your email (<code>${toEmail}</code>) and your license key to activate the plugin.</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://www.fivenest.in/download" class="btn-download">Download Plugin Installer</a>
          </div>

          <div class="intro" style="margin-bottom: 0;">
            If you need any technical assistance during setup, please contact our support team directly via WhatsApp or reply to this email.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Fivenest India. All rights reserved.<br>
          For support, message us on <a href="https://wa.me/919876543210">WhatsApp Support</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: "Your Fivenest Plugin License Key & Setup Guide",
        htmlContent: htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`Email successfully sent to ${toEmail}. Message ID: ${data.messageId}`);
      return true;
    } else {
      console.error("Brevo API error:", data);
      return false;
    }
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return false;
  }
};
