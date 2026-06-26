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
 <div class="dashboard-stats" style="margin: 20px auto; padding: 15px; max-width: 400px; background: #1a1a1a; border-radius: 8px; border: 1px solid #1b4332; text-align: center;">
  <h3 style="color: #666; margin-bottom: 5px; font-size: 14px;">WALLET BALANCE</h3>
  <div id="wallet-balance" style="color: #2ec4b6; font-size: 28px; font-weight: bold;">Loading...</div>
</div>

<div class="games-section" style="margin: 20px auto; max-width: 400px;">
  <h2 style="color: #1b4332; font-size: 20px; border-bottom: 2px solid #1b4332; padding-bottom: 5px; margin-bottom: 15px;">Available Tasks & Games</h2>
  <div id="games-container" style="display: grid; gap: 15px;">
    <p style="color: #999; text-align: center;">Loading available challenges...</p>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const phoneNumber = localStorage.getItem('userPhone') || '237600000000';

  fetch(`/api/user/profile?phoneNumber=${phoneNumber}`)
    .then(res => res.json())
    .then(data => {
      const balanceEl = document.getElementById('wallet-balance');
      if (balanceEl && data.balance !== undefined) {
        balanceEl.innerText = `${data.balance} XAF`;
      } else if (balanceEl) {
        balanceEl.innerText = '0 XAF';
      }
    })
    .catch(err => {
      console.error('Balance tracking error:', err);
      const balanceEl = document.getElementById('wallet-balance');
      if (balanceEl) balanceEl.innerText = 'Error loading';
    });

  fetch('/api/games')
    .then(res => res.json())
    .then(games => {
      const container = document.getElementById('games-container');
      if (!container) return;

      container.innerHTML = '';
      games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.style.cssText = "background: #222; padding: 15px; border-radius: 6px; border-left: 4px solid #1b4332; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);";
        
        gameCard.innerHTML = `
          <div style="text-align: left;">
            <h4 style="margin: 0 0 5px 0; color: #fff; font-size: 16px;">${game.name}</h4>
            <span style="color: #2ec4b6; font-size: 12px; font-weight: bold;">💰 ${game.reward}</span>
          </div>
          <button onclick="playGame('${game.id}')" style="background: #1b4332; color: white; border: none; padding: 8px 15px; border-radius: 4px; font-weight: bold; cursor: pointer;">Play</button>
        `;
        container.appendChild(gameCard);
      });
    })
    .catch(err => {
      console.error('Games catalog error:', err);
      const container = document.getElementById('games-container');
      if (container) container.innerHTML = '<p style="color: #ff4d4d;">Failed to load tasks.</p>';
    });
});

function playGame(gameId) {
  alert(`Initializing task configuration for: ${gameId}. Earn your XAF reward payout upon completion!`);
}
</script>
     
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
                                    
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend files automatically
app.use(express.static(path.join(__dirname)));

const uri = process.env.MONGODB_URI;
let db;

// Connect to MongoDB
MongoClient.connect(uri, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database');
    db = client.db('taskcash');
  })
  .catch(error => console.error('Database connection failed:', error));

// 1. PROFILE ENDPOINT: Fetch user details and wallet balance
app.get('/api/user/profile', async (req, res) => {
  const { phoneNumber } = req.query;
  if (!phoneNumber) return res.status(400).json({ message: 'Phone number required' });

  try {
    const user = await db.collection('users').findOne({ phoneNumber });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      phoneNumber: user.phoneNumber,
      balance: user.balance || 0 // Defaults to 0 XAF if new
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GAMES ENDPOINT: Send available games to the frontend
app.get('/api/games', (req, res) => {
  const gamesList = [
    { id: 'game1', name: 'Spin the Wheel', reward: 'Up to 500 XAF', active: true },
    { id: 'game2', name: 'Math Quiz Challenge', reward: '50 XAF per correct answer', active: true },
    { id: 'game3', name: 'Daily Scratch Card', reward: 'Random Cash Drop', active: true }
  ];
  res.json(gamesList);
});

// Fallback to serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
