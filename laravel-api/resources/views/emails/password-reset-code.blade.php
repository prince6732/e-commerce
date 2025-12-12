<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .code-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px dashed #f59e0b;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 14px;
            color: #92400e;
            margin-bottom: 15px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .code {
            font-size: 48px;
            font-weight: 800;
            color: #ea580c;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        .validity {
            font-size: 13px;
            color: #92400e;
            margin-top: 15px;
            font-weight: 500;
        }
        .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .warning p {
            color: #991b1b;
            font-size: 14px;
            margin: 0;
        }
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .info-box p {
            color: #1e40af;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
        }
        .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .footer .company-name {
            color: #f97316;
            font-weight: 700;
            font-size: 18px;
            margin-top: 15px;
        }
        .social-links {
            margin-top: 20px;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #f97316;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #f97316, transparent);
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>We're here to help you regain access</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hello! 👋
            </div>

            <p class="message">
                We received a request to reset your password for your <strong>Zelton E-Commerce</strong> account. 
                To proceed with resetting your password, please use the verification code below:
            </p>

            <!-- Code Box -->
            <div class="code-box">
                <div class="code-label">Your Reset Code</div>
                <div class="code">{{ $code }}</div>
                <div class="validity">⏰ Valid for 15 minutes</div>
            </div>

            <!-- Warning Box -->
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong> Never share this code with anyone. Zelton support will never ask for your reset code.</p>
            </div>

            <div class="divider"></div>

            <!-- Info Box -->
            <div class="info-box">
                <p><strong>💡 Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>

            <p class="message">
                After entering the code, you'll be able to create a new secure password for your account.
            </p>

            <p class="message">
                If you need any assistance, our support team is here to help!
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="company-name">Zelton E-Commerce</p>
            <p>Your trusted online shopping destination</p>
            <div class="divider" style="margin: 20px 50px;"></div>
            <p style="font-size: 12px; color: #9ca3af;">
                This is an automated email. Please do not reply to this message.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                © {{ date('Y') }} Zelton E-Commerce. All rights reserved.
            </p>
            <div class="social-links">
                <a href="#">Privacy Policy</a> | 
                <a href="#">Terms of Service</a> | 
                <a href="#">Contact Us</a>
            </div>
        </div>
    </div>
</body>
</html>
