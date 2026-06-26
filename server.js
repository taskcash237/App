const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const CAMPAY_USERNAME = "AQ1Y0UYY-BNiaOMlciZ_pjqI1rAj-NodcrwI5U2QqtjRfXW5HGrwqtDPq9LreWbq0JnvTxaxV6K-LEE8ktokmw";
const CAMPAY_PASSWORD = "ZJmOlfzMUZd7uZDp7dSQjbAfMD55Hz791OeGZXxvqAN8UA5-2lLh5BQIGtNKqD0VMLZ7PDXVNOhzeiFWyQyHpQ";
const BASE_URL = "https://demo.campay.net/api";

app.post('/api/payout', async (req, res) => {
    let { phoneNumber } = req.body;

    if (phoneNumber) {
        phoneNumber = phoneNumber.replace(/[\s+]/g, '');
    }

    if (!phoneNumber || !phoneNumber.startsWith('237') || phoneNumber.length !== 12) {
        return res.status(400).json({ 
            en: "Invalid phone number! It must start with 237 followed by 9 digits.", 
            fr: "Numéro de téléphone invalide ! Il doit commencer par 237 suivi de 9 chiffres." 
        });
    }

    try {
        console.log("Requesting access token from CamPay...");
        const tokenResponse = await axios.post(`${BASE_URL}/token/`, {
            username: CAMPAY_USERNAME,
            password: CAMPAY_PASSWORD
        });
        
        const token = tokenResponse.data.token;

        console.log(`Triggering 10,000 XAF payout to ${phoneNumber}...`);
        const payoutResponse = await axios.post(`${BASE_URL}/withdraw/`, {
            amount: "10000",
            currency: "XAF",
            to: phoneNumber,
            description: "Task reward payout"
        }, {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json({ 
            success: true,
            en: "Payout triggered successfully! Check your MoMo/Orange wallet status.",
            fr: "Paiement déclenché avec succès ! Vérifiez le statut de votre portefeuille MoMo/Orange."
        });

    } catch (error) {
        console.error("Error occurred during payout process:", error.response ? error.response.data : error.message);
        return res.status(500).json({ 
            en: "Transaction failed or insufficient master wallet balance.", 
            fr: "La transaction a échoué ou le solde principal est insuffisant." 
        });
    }
});
// 1. Fetch user details and wallet balance from MongoDB
app.get('/api/user/profile', async (req, res) => {
  const { phoneNumber } = req.query;
  if (!phoneNumber) return res.status(400).json({ message: 'Phone number required' });

  try {
    const user = await db.collection('users').findOne({ phoneNumber });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      phoneNumber: user.phoneNumber,
      balance: user.balance || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. Send available games list to the dashboard layout
app.get('/api/games', (req, res) => {
  const gamesList = [
    { id: 'wheel', name: 'Spin the Wheel', reward: 'Up to 500 XAF', active: true },
    { id: 'quiz', name: 'Math Challenge', reward: '50 XAF per correct answer', active: true },
    { id: 'scratch', name: 'Daily Scratch Card', reward: 'Random Cash Drop', active: true }
  ];
  res.json(gamesList);
});

// Keep your server listening block at the absolute end
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
