const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 3000;
const playersRouter = require('./routes/players');

// EJS template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Staattisten tiedostojen käyttö (CSS, JS, kuvat)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware body-parsingille
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============ ROUTES ============

// Kotisivu
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'EBT Tytöt 2015',
        page: 'koti'
    });
});

// Sarjataulukko
app.get('/sarjataulukko', (req, res) => {
    res.render('sarjataulukko', { 
        title: 'Sarjataulukko - EBT Tytöt 2015',
        page: 'sarjataulukko'
    });
});

// Pelaajat
app.use('/pelaajat', playersRouter);

// ============ API ROUTES ============

// API endpoint sarjataulukoille
app.get('/api/sarjataulukko', async (req, res) => {
    try {
        const apiUrl = process.env.BASKETBALL_API_URL;
        const apiKey = process.env.BASKETBALL_API_KEY;

        // 1-divisioona
        const div1 = await axios.get(`${apiUrl}/getGroup`, {
            params: {
                api_key: apiKey,
                competition_id: 'etekp2526',
                category_id: '38751',
                group_id: '302370'
            }
        });

        // 2-divisioona
        const div2 = await axios.get(`${apiUrl}/getGroup`, {
            params: {
                api_key: apiKey,
                competition_id: 'etekp2526',
                category_id: '38753',
                group_id: '302369'
            }
        });

        res.json({
            div1: div1.data.group,
            div2: div2.data.group
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 - Sivua ei löydy
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '404 - Sivua ei löydy',
        page: '404'
    });
});

// Serverin käynnistys
app.listen(port, () => {
    console.log(`🏀 EBT Tytöt 2015 server pyörii osoitteessa http://localhost:${port}`);
    console.log('Pysäytä server: Ctrl+C');
});