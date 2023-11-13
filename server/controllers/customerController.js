const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require("../models/customer");
const Staff = require('../models/staff');
const { sendEmail } = require("../utilities/emailUtil");



// Staff find customer function
const findCustomers = async (req, res) => {
    if (req.role !== 'staff') return res.sendStatus(403);
    
    // Find the customer
    const customer = await Customer.find();
    // Respond with customer information
    res.json({ customer: customer });
};

// Customer self find function
const findCustomer = async (req, res) => {
    // Get ID from the authenticated session
    const customerId = req.user._id;

    // Find the customer by id
    const customer = await Customer.findById(customerId);
    if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
    }

    // Respond with customer information
    res.json({ customer: customer });
};



const createCustomer = async (req, res) => {
    try {
        // Get the data from the request body
        const {
            first_Name,
            last_Name,
            email,
            password,
            mobile,
            Address,
        } = req.body;
        
        // Hash the password before storing it
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create a customer with the provided data
        const customer = await Customer.create({
            first_Name,
            last_Name,
            email,
            password: hashedPassword,
            mobile,
            Address,
        });

        
        // Respond with the newly created customer
        res.status(200).json({ customer: customer });

        // Send verification email
        sendEmail({
            email: req.body.email,
            subject: 'Welcome to SmartCarShare',
            userId: customer._id.toString(),
            isVerification: true
        }).catch(error => {
            console.error('Error sending email:', error);
        });

        } catch (error) {
        console.log(error)
        res.status(500).json({ error: "An error occurred while creating the customer." });
        }
};



const updateCustomer = async (req, res) => {
    console.log('update Customer - PUT');
    // Get the ID from the authenticated session
    // const customerId = req.user._id;

    // Extract fields from the request body
    const {
        _id,  
        first_Name,
        last_Name,
        email,
        mobile,
        Address
    } = req.body;

    // console.log(`id: ${_id}`);

    // Define fields that any customer can update
    let updateFields = {
        first_Name: first_Name,
        last_Name: last_Name,
        email: email,
        mobile: mobile,
        Address: Address,
    };

    // If the requester is a staff member, they can also update Booking
    if (req.role === 'staff') {
        updateFields.Booking = Booking;
    }

    try {
        // Update the customer's information
        const updatedCustomer = await Customer.findByIdAndUpdate(
            _id,
            updateFields,
            { new: true } // Return the updated document
        );

        // console.log(updatedCustomer);

        if (!updatedCustomer) {
            return res.status(404).json({ error: "Customer not found." });
        }

        // Respond with the updated customer
        res.json({ customer: updatedCustomer });

    } catch (error) {
        // Handle errors and respond with an error message
        res.status(500).json({ error: "An error occurred while updating the customer." });
    }
};


const deleteCustomer = async (req, res) => {
    if (req.role !== 'staff') return res.sendStatus(403);
    
    // Get id from the URL
    const customerId = req.params._id;
    // Delete the customer information
    await Customer.deleteOne({ _id: customerId });
    // Respond when deleted
    res.json({ success: "Customer information deleted" });
};

// Update forgotten password
async function updateCustomerPassword(req, res) {
    
    const token = req.body.token;
    const newPassword = req.body.newPassword;

    console.log("Received Token:", token); 

    // Verify and decode the token to get the user ID
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const userId = decoded.userId;

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log("Received New Password:", newPassword);   

        // Update the user's password in the database
        const updatedCustomer = await Customer.findByIdAndUpdate(
            userId,
            { $set: { password: hashedPassword } },
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ error: "User not found for the provided reset token." });
        }

        res.status(200).json({ message: "Password updated successfully!" });

    } catch (err) {
        // Handle errors (invalid token, expired token, etc.)
        res.status(400).json({ error: 'Error during token verification: ' + err.message });
    }
}



async function login(req, res) {
    // Get the email and password from req body
    const { email, password } = req.body;

    try {
        // Attempt to find the user in the Customer collection
        let user = await Customer.findOne({ email });
        let role = 'customer';

        // If not found in Customer, attempt to find in the Staff collection
        if (!user) {
            user = await Staff.findOne({ email });
            role = 'staff';
        }

        // If still not found, unauthorized
        if (!user) return res.sendStatus(401);

        // Compare sent-in password with found user password hash
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.sendStatus(401);

        // Create a JWT token with embedded role and user ID (sub)
        // Set expiration
        const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
        const token = jwt.sign({ sub: user._id, role, exp }, process.env.SECRET);

        // Set the cookie
        res.cookie("Authorization", token, {
            expires: new Date(exp),
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === "production",
        });

        // Send back the token
        res.status(200).json({ token, role });
    } catch (error) {
        // Handle any errors
        console.error(error);
        res.status(500).json({ error: "An error occurred while logging in." });
    }
}

function logout(req, res){
    try{ 
    res.clearCookie("Authorization");
    res.status(200).json({ message: "Logout successful. " });
    } catch(err) {
        console.log(err);
        res.sendStatus(400);
    }
}

// Forgot password
async function forgotPassword(req, res) {
    console.log('ForgotPassword - GET');
    const { email } = req.body;

    try {
        const user = await Customer.findOne({ email }, '_id');
        console.log(user);
        
        if(!user) {
            return res.status(500).json({ error: "User not found!" });
        }
        
        // Send reset password email
        await sendEmail({
            email,
            subject: 'Password Reset for SmartCarShare',
            isPasswordReset: true,
            userId: user._id
        });

        res.status(200).send({ message: 'Reset email sent successfully!' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
}

const verifyResetToken = async (req, res) => {
    const token = req.query.token;

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        
        // If the token is valid, redirect to the frontend password reset page with the token
        res.redirect(`http://localhost:5173/reset/newpassword?token=${token}`);
    } catch (error) {
        // Token is invalid or has expired
        res.status(400).send('Invalid or expired reset token.');
    }
};


function checkAuth(req, res){
    try{
        res.sendStatus(200)
    } catch(err) {
        return res.sendStatus(400);
    }

}


module.exports = {
    findCustomers,
    findCustomer,
    createCustomer,
    updateCustomer,
    updateCustomerPassword,
    deleteCustomer,
    login,
    logout,
    forgotPassword,
    verifyResetToken,
    checkAuth
};
