// Initialize Stripe with your public key

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const stripe = Stripe('sannihabeeb'); // Replace with your actual public key
// Get the total amount from the data attribute
const totalAmount = document.getElementById('paymentForm').dataset.totalPrice;

// Handle form submission
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;

    // Create a Stripe payment token
    const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
            number: cardNumber,
            exp_month: expiryDate.split('/')[0],
            exp_year: expiryDate.split('/')[1],
            cvc: cvv,
        },
    });

    if (error) {
        alert(error.message);
        return;
    }

    // Send the payment token to the server
    const response = await fetch('/payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: totalAmount, // Use the variable here
            currency: 'usd',
            source: paymentMethod.id,
        }),
    });

    const result = await response.json();
    if (result.success) {
        alert('Payment successful!');
        window.location.href = '/';
    } else {
        alert('Payment failed. Please try again.');
    }
});