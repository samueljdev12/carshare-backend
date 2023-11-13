const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    serviceOrItemBooked: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled'],
        default: 'Confirmed'
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    price: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['succeeded', 'pending', 'failed', 'requires_payment_method'], 
        required: false
    },
    paymentRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentRecord'
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
