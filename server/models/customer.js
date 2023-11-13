const mongoose = require("mongoose");

const custSchema = new mongoose.Schema({
    first_Name: {
        type: String,
        required: true
    },
    last_Name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    Address: {
        street: {
            type: String,
            required: true
        },
        suburb: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postcode: {
            type: Number,
            required: true
        }
    },
    emailVerified: {
        type: Boolean,
        default: false
    }
});

const Customer = mongoose.model("Customer", custSchema);

module.exports = Customer;
