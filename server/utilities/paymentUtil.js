const Stripe = require('stripe');
const stripe = new Stripe('sk_test_51Np4NqCAEiKotqf0sGEyTPEwNl6U49s2mDZnfVFswjJDkqoUNR1ecUL12rQfvkDWJVLjS1PBX25Grd0TqfMCxv1F00yPZ1J4gY');
const Booking = require("../models/booking");
const PaymentRecord = require("../models/paymentRecord"); 
const { generateInvoice } = require("../utilities/emailUtil");
const Customer = require("../models/customer");



const createPaymentIntent = async (req, res) => {
    try {
        const { amount } = req.body;  // Amount should be in cents

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'aud'
        });

        res.status(200).json({
            message: 'Payment intent created successfully',
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error("Stripe error:", error.message);
        res.status(500).json({ error: 'Payment intent creation failed' });
    }
};

const finalizeBooking = async (paymentIntent) => {
    try {
        // Extract necessary information from paymentIntent
        const { id, amount, currency, status, created } = paymentIntent;

        // Store the payment record in the database
        const paymentRecord = new PaymentRecord({
            paymentIntentId: id,
            booking: req.body.bookingId,
            amount,
            currency,
            status,
            timestamp: new Date(created * 1000)  // Convert from UNIX timestamp to a JavaScript Date object
        });
        await paymentRecord.save();

        // Update the booking with the payment status and payment record ID
        const booking = await Booking.findById(req.body.bookingId);
        booking.paymentStatus = status;
        booking.paymentRecord = paymentRecord.id;
        await booking.save();

        // Fetch the customer's details
        const customer = await Customer.findById(booking.customer);

        // Generate and send the invoice email
        await generateInvoice(customer, booking, paymentRecord);
        
    } catch (error) {
        console.error("Error in updating booking after payment:", error.message);
        throw new Error("Failed to update booking after payment");
    }
};

module.exports = {
    createPaymentIntent,
    finalizeBooking
};