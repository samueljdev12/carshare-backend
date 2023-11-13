
const jwt = require('jsonwebtoken');
const Customer = require('../models/customer');
const Staff = require('../models/staff');

async function requireAuth(req, res, next) {
    try { 
        // Read token off cookies
        const token = req.cookies.Authorization;
        if (!token) return res.sendStatus(401);
        // Decode the token
        const decoded = jwt.verify(token, process.env.SECRET);

        // Check expiration
        if (Date.now() > decoded.exp) return res.sendStatus(401);

        // Find user using decoded sub
        const customer = await Customer.findById(decoded.sub);
        if (customer) {
            req.user = customer;
            req.role = 'customer';
            next();
            return;
        }

        const staff = await Staff.findById(decoded.sub);
        if (staff) {
            req.user = staff;
            req.role = 'staff';
            next();
            return;
        }

        return res.sendStatus(401);
    } catch(err) {
        return res.sendStatus(401);
    }
}

module.exports = requireAuth;
