const axios = require('axios');

const fetchExchangeRate = async () => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
        // console.log("response", response.data.rates.USD)
        return response.data.rates.USD;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        throw new Error('Error fetching exchange rate');
    }
}


// Function description for PayPal's limits
const truncateDescription = (description, length = 100) => {
    if (!description) return "";
    return description.length > length ? description.substring(0, length) + "..." : description;
};



module.exports = {
    fetchExchangeRate,
    truncateDescription
};