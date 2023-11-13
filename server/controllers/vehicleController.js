const Vehicle = require("../models/vehicle");
const filterAndSortVehicles = require("../functions/vehicleFilter");

const addVehicle = async (req, res) => {
    const { name, model, availability, price } = req.body;

    // Ensure all necessary fields are provided
    if (!name || !model || price === undefined) {
        return res.status(400).json({ error: 'Please provide the name, model, and price of the vehicle.' });
    }

    try {
        const vehicle = new Vehicle({
            name,
            model,
            availability: availability || true,  // Default to true if not provided
            price
        });

        await vehicle.save();
        
        res.status(201).json({ vehicle });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getVehicles = async (req, res) => {
    try {
        const vehicles = await filterAndSortVehicles(req.query);
        res.json({ vehicles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const listVehicles = async (req, res) => {
    const { available } = req.query;

    try {
        let query = Vehicle.find();
        if (available === 'true') {
            query = query.where('availability').equals(true);
        }

        const vehicles = await query.exec();
        res.json({ vehicles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateVehicleAvailability = async (req, res) => {
    const vehicleId = req.params.id;
    const { availability } = req.body;

    // Validate the availability field
    if (typeof availability !== 'boolean') {
        return res.status(400).json({ error: "Availability must be either true or false." });
    }

    try {
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ error: "Vehicle not found." });
        }

        vehicle.availability = availability;
        await vehicle.save();

        res.json({ vehicle });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    addVehicle,
    listVehicles,
    getVehicles,
    updateVehicleAvailability
};

