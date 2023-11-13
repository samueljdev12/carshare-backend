// Import SendGrid and set up the API
const sgMail = require("@sendgrid/mail");
// console.log(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendGridEmail = async (req, res) => {
    console.log('SendGridEmail - POST');
    const { userName, userEmail, userSubject, userMessage } = req.body;

    // console.log(`userName: ${userName}, userEmail: ${userEmail}, userSubject: ${userSubject}, userMessage: ${userMessage}`);

    if ( userName == undefined || userEmail == undefined || userSubject == undefined || userMessage == undefined){
        console.log('Empty Value');
        return res.status(400).json({error: 'invalid Information'});
    }

    const msg = {
        to: {
            email: 'carshare381@gmail.com',
            name: 'CarShare'
        },
        from: {
            email: userEmail,
            name: userName
        },
        subject: userSubject,
        html: `<pre style="font-family: Arial, sans-serif;">${userMessage}</pre>`,
    }
    
    try {
        await sgMail.send(msg);
        console.log('email sent!');
        res.status(200).send('email sent!');
    } catch (error) {
        console.error(error);

        res.status(400).send(error);
    
        if (error.response) {
            console.error(error.response.body);
        }
    }

}

module.exports = {
    sendGridEmail
}