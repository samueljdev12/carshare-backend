// Load environmental variables
if (process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

// Importing dependencies
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectToDb = require('./functions/connectToDb');

// Controllers and utilities
const customerController = require("./controllers/customerController");
const staffController = require("./controllers/staffController");
const requireAuth = require("./middleware/requireAuth");
const paymentUtil = require('./utilities/paymentUtil');
const bookingController = require("./controllers/bookingController");
const emailUtil = require("./utilities/emailUtil");
const vehicleController = require("./controllers/vehicleController");
const sendGridController = require("./utilities/sendGridUtil");

// Creating an express app
const app = express();

// Configure express app
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Connect to database
connectToDb();

// Routing
app.post('/api/customer', customerController.createCustomer);
app.post('/api/login', customerController.login);
app.get('/api/logout', customerController.logout);
app.get('/api/check-auth', requireAuth, customerController.checkAuth);
app.post('/api/reset', customerController.forgotPassword);
app.get('/api/verify-reset-token', customerController.verifyResetToken);
app.put("/api/customer/password", customerController.updateCustomerPassword);

// Customer routes
app.get("/api/customer/me", requireAuth, customerController.findCustomer);
app.get("/api/customer", requireAuth, customerController.findCustomers);
app.get("/api/customer/me", requireAuth, customerController.findCustomer);
app.put("/api/customer/me/update", requireAuth, customerController.updateCustomer);
app.put("/api/customer/:_id", customerController.updateCustomer);
app.delete("/api/customer/:_id", requireAuth, customerController.deleteCustomer);

// Staff routes
app.post('/api/staff', staffController.createStaff);
app.get('/api/staff/:id', requireAuth, staffController.findStaff);
app.put('/api/staff/:id', requireAuth, staffController.updateStaff);
app.delete('/api/staff/:id', requireAuth, staffController.deleteStaff);

// Booking
app.post('/api/booking', requireAuth, bookingController.createBooking);
app.get('/api/bookings', requireAuth, bookingController.getBookingsForCustomer);
app.put('/api/booking/:id/cancel', requireAuth, bookingController.cancelBooking);

// Vehicles
app.post('/api/vehicleAdd', requireAuth, vehicleController.addVehicle);
app.get('/api/vehicles', vehicleController.listVehicles);
app.get('/api/vehiclesSort', vehicleController.getVehicles);
app.put('/api/vehicle/:id/availability', requireAuth, vehicleController.updateVehicleAvailability);

// Email Verification
app.get('/api/verify-email', emailUtil.verifyEmail);

// Stripe (Payment) route
app.post('/api/create-payment', paymentUtil.createPaymentIntent);

// SendGrid route
app.post('/api/contact', sendGridController.sendGridEmail);

// Starting the server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
