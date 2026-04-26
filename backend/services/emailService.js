// services/emailService.js
import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (host && user && pass) {
            transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                auth: { user, pass }
            });
        }
    }
    return transporter;
};

// Base HTML Wrapper for StayHub emails
const wrapHtmlTemplate = (title, contentHtml) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .card-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .value { color: #0f172a; font-weight: 600; text-align: right; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #dcfce7; color: #166534; }
        .btn { display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 20px 0; text-align: center; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>StayHub</h1>
            <p>${title}</p>
        </div>
        <div class="content">
            ${contentHtml}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} StayHub Inc. All rights reserved.</p>
            <p>You received this email regarding your StayHub booking activity.</p>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Send an email safely (logs to console if SMTP not configured)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!to) {
            console.warn('sendEmail skipped: No recipient email provided.');
            return false;
        }

        const client = getTransporter();
        if (!client) {
            console.log(`[Email Mock / Development Mode] To: ${to} | Subject: "${subject}"`);
            return true;
        }

        const from = process.env.SMTP_FROM || '"StayHub Bookings" <notifications@stayhub.com>';
        const info = await client.sendMail({
            from,
            to,
            subject,
            text: text || subject,
            html
        });

        console.log(`Email dispatched to ${to} (MessageId: ${info.messageId})`);
        return true;
    } catch (err) {
        console.error(`Failed to send email to ${to}:`, err.message);
        return false;
    }
};

/**
 * Booking Confirmation Email to Guest
 */
export const sendBookingConfirmationEmail = async ({ guestEmail, guestName, roomTitle, checkInDate, checkOutDate, nights, totalAmount, bookingId }) => {
    const title = 'Booking Confirmed! 🎉';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const bookingLink = `${frontendUrl}/my-bookings`;

    const contentHtml = `
        <h2 style="color: #0f172a; margin-top: 0;">Hi ${guestName || 'Guest'},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Pack your bags! Your reservation at <strong>${roomTitle}</strong> is officially confirmed.
        </p>

        <div class="card">
            <div class="card-row">
                <span class="label">Property</span>
                <span class="value">${roomTitle}</span>
            </div>
            <div class="card-row">
                <span class="label">Check-in</span>
                <span class="value">${checkInDate}</span>
            </div>
            <div class="card-row">
                <span class="label">Check-out</span>
                <span class="value">${checkOutDate}</span>
            </div>
            <div class="card-row">
                <span class="label">Duration</span>
                <span class="value">${nights} night${nights !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-row">
                <span class="label">Total Paid</span>
                <span class="value" style="color: #0d9488; font-size: 16px;">₹${totalAmount?.toLocaleString('en-IN') || totalAmount}</span>
            </div>
            <div class="card-row">
                <span class="label">Status</span>
                <span class="value"><span class="badge">Confirmed</span></span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${bookingLink}" class="btn">View Booking in StayHub</a>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Need help or have questions about check-in? Log in to your StayHub account to view host contact details and reservation specifics.
        </p>
    `;

    return sendEmail({
        to: guestEmail,
        subject: `Booking Confirmed: ${roomTitle} (${checkInDate} - ${checkOutDate})`,
        html: wrapHtmlTemplate(title, contentHtml)
    });
};

/**
 * New Booking Received Email to Host
 */
export const sendNewBookingHostAlertEmail = async ({ hostEmail, hostName, guestName, roomTitle, checkInDate, checkOutDate, nights, totalAmount }) => {
    const title = 'New Booking Received! 🛎️';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const hostLink = `${frontendUrl}/booked-properties`;

    const contentHtml = `
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${hostName || 'Host'},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Great news! You have received a new confirmed booking for <strong>${roomTitle}</strong>.
        </p>

        <div class="card">
            <div class="card-row">
                <span class="label">Guest Name</span>
                <span class="value">${guestName || 'StayHub Guest'}</span>
            </div>
            <div class="card-row">
                <span class="label">Property</span>
                <span class="value">${roomTitle}</span>
            </div>
            <div class="card-row">
                <span class="label">Check-in</span>
                <span class="value">${checkInDate}</span>
            </div>
            <div class="card-row">
                <span class="label">Check-out</span>
                <span class="value">${checkOutDate}</span>
            </div>
            <div class="card-row">
                <span class="label">Duration</span>
                <span class="value">${nights} night${nights !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-row">
                <span class="label">Payout Amount</span>
                <span class="value" style="color: #0d9488; font-size: 16px;">₹${totalAmount?.toLocaleString('en-IN') || totalAmount}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${hostLink}" class="btn">Manage Booked Properties</a>
        </div>
    `;

    return sendEmail({
        to: hostEmail,
        subject: `New Booking: ${guestName || 'A guest'} booked ${roomTitle}`,
        html: wrapHtmlTemplate(title, contentHtml)
    });
};

/**
 * Booking Cancellation Email
 */
export const sendBookingCancelledEmail = async ({ recipientEmail, recipientName, isHost, guestName, roomTitle, checkInDate, checkOutDate }) => {
    const title = 'Booking Cancelled ℹ️';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const targetLink = isHost ? `${frontendUrl}/booked-properties` : `${frontendUrl}/my-bookings`;

    const message = isHost
        ? `We wanted to let you know that <strong>${guestName || 'the guest'}</strong> has cancelled their reservation for <strong>${roomTitle}</strong>.`
        : `Your reservation for <strong>${roomTitle}</strong> (${checkInDate} - ${checkOutDate}) has been cancelled.`;

    const contentHtml = `
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${recipientName || 'there'},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            ${message}
        </p>

        <div class="card">
            <div class="card-row">
                <span class="label">Property</span>
                <span class="value">${roomTitle}</span>
            </div>
            <div class="card-row">
                <span class="label">Dates</span>
                <span class="value">${checkInDate} to ${checkOutDate}</span>
            </div>
            <div class="card-row">
                <span class="label">Status</span>
                <span class="value"><span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;">Cancelled</span></span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${targetLink}" class="btn">View In StayHub</a>
        </div>
    `;

    return sendEmail({
        to: recipientEmail,
        subject: `Booking Cancelled: ${roomTitle}`,
        html: wrapHtmlTemplate(title, contentHtml)
    });
};

/**
 * Review Received Notification Email to Host
 */
export const sendReviewNotificationEmail = async ({ hostEmail, hostName, guestName, roomTitle, rating, comment }) => {
    const title = 'New Property Review! ⭐';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const targetLink = `${frontendUrl}/dashboard`;

    const contentHtml = `
        <h2 style="color: #0f172a; margin-top: 0;">Hi ${hostName || 'Host'},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            <strong>${guestName || 'A guest'}</strong> left a new review for <strong>${roomTitle}</strong>.
        </p>

        <div class="card">
            <div class="card-row">
                <span class="label">Rating</span>
                <span class="value" style="color: #eab308; font-size: 16px;">★ ${rating} / 5</span>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #edf2f7; font-style: italic; color: #475569; font-size: 14px;">
                "${comment}"
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${targetLink}" class="btn">View Host Dashboard</a>
        </div>
    `;

    return sendEmail({
        to: hostEmail,
        subject: `New ${rating}★ Review for ${roomTitle}`,
        html: wrapHtmlTemplate(title, contentHtml)
    });
};
