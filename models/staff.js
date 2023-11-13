const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    first_Name: {
        type: String,
        required: true,
        trim: true
    },
    last_Name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Staff', staffSchema);
