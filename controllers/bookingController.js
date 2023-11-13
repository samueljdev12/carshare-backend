const Booking = require("../models/booking");
const { sendEmail } = require("../utilities/emailUtil");
const Vehicle = require("../models/vehicle"); 


// Create a new booking
const createBooking = async (req, res) => {
    const { bookingDate, serviceOrItemBooked, vehicleId } = req.body;
    
    // Only check for vehicle if vehicleId is provided
    let vehicle;
    if (vehicleId) {
        vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found.' });
        }
        if (!vehicle.availability) {
            return res.status(400).json({ error: 'Selected vehicle is not available.' });
        }
    }

    try {
        // Setting the booking price as the base price of the vehicle
        const totalBookingPrice = vehicle ? vehicle.price : 0;

        const booking = await Booking.create({
            customer: req.user._id,
            bookingDate,
            serviceOrItemBooked,
            vehicle: vehicle ? vehicle._id : undefined,
            price: totalBookingPrice
        });

        // Only set the vehicle as unavailable if a valid vehicle object exists
        if (vehicle && vehicle.availability) {
            vehicle.availability = false;
            await vehicle.save();
        }
        
        // Send confirmation email
        sendEmail({
            email: req.user.email,
            subject: 'Booking Confirmation',
            bookingId: booking._id.toString(),
            bookingDate: booking.bookingDate,
            serviceOrItemBooked: booking.serviceOrItemBooked,
            totalBookingPrice: totalBookingPrice, 
            isBookingConfirmation: true
        }).catch(error => {
            console.error('Error sending confirmation email:', error);
        });

        res.status(201).json({ booking });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const getBookingsForCustomer = async (req, res) => {
    try {
        // Fetch only bookings that haven't been cancelled
        const bookings = await Booking.find({
            customer: req.user._id,
            status: { $ne: 'Cancelled' } // Exclude cancelled bookings
        }).populate('vehicle');

        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a specific booking for a customer
const updateBooking = async (req, res) => {
    const bookingId = req.params.id;
    const { vehicleId } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        // Ensure the user is authorized to update the booking
        if (booking.customer.toString() !== req.user._id && req.role !== 'staff') {
            return res.status(403).json({ error: "You don't have permission to update this booking." });
        }

        if (vehicleId) {
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle || !vehicle.availability) {
                return res.status(400).json({ error: 'Selected vehicle is not available.' });
            }

            if (booking.vehicle) {
                const previousVehicle = await Vehicle.findById(booking.vehicle);
                if (previousVehicle) {
                    previousVehicle.availability = true;
                    await previousVehicle.save();
                }
            }

            vehicle.availability = false;
            await vehicle.save();
            booking.vehicle = vehicle._id;
        }

        // Update the booking details
        Object.assign(booking, req.body);
        await booking.save();

        res.json({ booking });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    console.log(`the booking id is ${bookingId}`)

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found." });
        }

        // Allow cancellation if the user is a staff member or if the booking belongs to the user
        if (!(booking.customer.toString() === req.user._id.toString() || req.role === 'staff')) {
            return res.status(403).json({ error: "You don't have permission to cancel this booking." });
        }

        // If there's an associated vehicle with the booking, set it to available
        if (booking.vehicle) {
            const vehicle = await Vehicle.findById(booking.vehicle);
            if (vehicle) {
                vehicle.availability = true;
                await vehicle.save();
            }
        }

        // Update the booking status to 'Cancelled'
        booking.status = 'Cancelled';
        await booking.save();

        res.json({ message: "Booking cancelled successfully." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    createBooking,
    getBookingsForCustomer,
    updateBooking,
    cancelBooking
};
