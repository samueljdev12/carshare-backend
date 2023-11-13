const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    availability: {
        type: Boolean,
        default: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
