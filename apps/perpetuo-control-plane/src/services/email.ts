import crypto from 'crypto';

// Simple email service - logs to console in dev, integrates with Resend in production
// To use Resend: npm install resend and set RESEND_API_KEY env var

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html } = options;

    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'Perpetuo <noreply@perpetuo.ai>',
                    to,
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                console.error('Resend error:', await response.text());
                return false;
            }

            console.log(`✅ Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('Failed to send email via Resend:', error);
            return false;
        }
    }

    // Fallback: Log to console (development mode)
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL (Dev Mode - configure RESEND_API_KEY for production)');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(html.replace(/<[^>]*>/g, '')); // Strip HTML for console
    console.log('='.repeat(60) + '\n');

    return true;
}

export function generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function getResetPasswordEmailHtml(resetUrl: string, userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 40px; text-align: center;">
        <h1 style="color: #10b981; margin: 0 0 20px;">Perpetuo</h1>
        <h2 style="color: white; margin: 0 0 20px;">Reset Your Password</h2>
    </div>
    <div style="padding: 30px 0;">
        <p style="color: #374151; font-size: 16px;">Hi ${userName},</p>
        <p style="color: #374151; font-size: 16px;">
            You requested to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
            Or copy this link: <br>
            <code style="background: #f3f4f6; padding: 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</code>
        </p>
    </div>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} Perpetuo AI. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}
