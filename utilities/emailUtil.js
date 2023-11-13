const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Customer = require("../models/customer");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const sendEmail = async (options) => {
    const testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    // If this is a verification email, generate the token and link
    let message = options.message;
    if (options.isVerification) {
        const verificationToken = jwt.sign({ userId: options.userId }, process.env.SECRET, { expiresIn: '1d' });
        const verificationLink = `http://localhost:5173/api/verify-email?token=${verificationToken}`;
        message = `
        <p>Thank you for registering with SmartCarShare.</p>
        <p>Click on the link below to verify your email:</p>
        <p><a href="${verificationLink}" target="_blank">Verify My Email</a></p>
    `;
    }

    // If this is a booking confirmation email, craft the confirmation message
    if (options.isBookingConfirmation) {
        message = `<p>Dear Customer,</p>

        <p>Thank you for booking with SmartCarShare. Your booking details are as follows:</p>
        
        <ul>
            <li>Booking ID: ${options.bookingId}</li>
            <li>Booking Date: ${options.bookingDate}</li>
            <li>Booked Vehicle: ${options.serviceOrItemBooked}</li>
            <li>Total Booking Price: $${options.totalBookingPrice}</li>
        </ul>
        
        <p>Thank you for choosing us. Safe travels!</p>
        `;
    }

    if (options.isPasswordReset) {
        const resetToken = jwt.sign({ userId: options.userId }, process.env.SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:5173/api/verify-reset-token?token=${resetToken}`;
        message = `
            <p>You requested a password reset for SmartCarShare.</p>
            <p>Click on the link below to verify your password reset request:</p>
            <p><a href="${resetLink}" target="_blank">Reset My Password</a></p>
        `;
    }
    
    
    
    // Define the email options
    let mailOptions = {
        from: 'email@example.com',
        to: options.email,
        subject: options.subject,
        html: message,
        attachments: options.attachments || []
    };

    // Send the email
    let info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

const generateInvoice = async (customer, booking, paymentRecord) => {
    try {
        const doc = new PDFDocument();

        const fileName = `SmartCarShare Invoice.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        doc.pipe(fs.createWriteStream(filePath));

        // Add contents to the PDF
        doc.fontSize(20).text('Invoice Details', { align: 'center' });

        doc.moveDown();
        doc.text(`Customer Name: ${customer.first_Name} ${customer.last_Name}`);
        doc.text(`Customer Email: ${customer.email}`);
        doc.text(`Booking Date: ${booking.bookingDate}`);
        doc.text(`Booked Vehicle: ${booking.serviceOrItemBooked}`);
        doc.text(`Total Booking Price: $${booking.price}`);
        doc.text(`Payment ID: ${paymentRecord.paymentIntentId}`);
        doc.text(`Payment Amount: $${paymentRecord.amount}`);

        doc.end();

        // Send the email with the generated PDF
        await sendEmail({
            email: customer.email,
            subject: 'Invoice for Your Booking with SmartCarShare',
            message: 'Please find your invoice attached below.',
            attachments: [
                {
                    filename: 'SmartCarShare Invoice.pdf',
                    path: filePath
                }
            ]
        });

        // Optionally, delete the temporary PDF file
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error sending invoice email:', error);
    }
};


const verifyEmail = async (req, res) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const userId = decoded.userId;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(400).send('User not found.');
        }

        customer.emailVerified = true;
        await customer.save();

        // Redirect to a 'success' page on the frontend
        res.redirect('http://localhost:5173/email-verification-success');
    } catch (error) {
        // Token is invalid or has expired
        res.status(400).send('Invalid or expired verification link.');
    }
};

module.exports = {
    sendEmail,
    verifyEmail,
    generateInvoice
};