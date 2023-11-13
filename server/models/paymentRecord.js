const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'aud'
    },
    status: {
        type: String,
        enum: ['succeeded', 'pending', 'failed', 'requires_payment_method'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const PaymentRecord = mongoose.model('PaymentRecord', paymentRecordSchema);

module.exports = PaymentRecord;
