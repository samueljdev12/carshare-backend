
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require("../models/staff");

const createStaff = async (req, res) => {
    try {
        const { first_Name, last_Name, email, password } = req.body;
        
        // Hash the password before storing it
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        const staff = await Staff.create({
            first_Name,
            last_Name,
            email,
            password: hashedPassword,
        });
        
        res.status(201).json({ staff });
    } catch(err) {
        res.status(400).json({ error: err.message });
    }
};

const findStaff = async (req, res) => {
    if (req.role !== 'staff' || req.user._id.toString() !== req.params._id) return res.sendStatus(403);
    
    const staffId = req.params._id;
    const staff = await Staff.findById(staffId);
    
    res.json({ staff });
};

const updateStaff = async (req, res) => {
    if (req.role !== 'staff' || req.user._id.toString() !== req.params._id) return res.sendStatus(403);
    
    const staffId = req.params._id;
    const updates = req.body;
    
    const staff = await Staff.findByIdAndUpdate(staffId, updates, { new: true });
    
    res.json({ staff });
};

const deleteStaff = async (req, res) => {
    return res.sendStatus(403);  // Not allowed
};

module.exports = {
    createStaff,
    findStaff,
    updateStaff,
    deleteStaff
};
