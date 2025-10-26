const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
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

// API endpoint EBT:n otteluille
app.get('/api/ebt-ottelut', async (req, res) => {
    try {
        const apiUrl = process.env.BASKETBALL_API_URL;
        const apiKey = process.env.BASKETBALL_API_KEY;

        const EBT_TEAM_ID_DIV1 = '5753845';
        const EBT_TEAM_ID_DIV2 = '5753846';

        // Hae molemmat divisioonat
        const [div1Response, div2Response] = await Promise.all([
            // 1-divisioona ottelut
            axios.get(`${apiUrl}/getMatches`, {
                params: {
                    api_key: apiKey,
                    competition_id: 'etekp2526',
                    category_id: '38751',
                    group_id: '302370',
                    team_id: EBT_TEAM_ID_DIV1 // LISÄTTY
                }
            }),
            // 2-divisioona ottelut
            axios.get(`${apiUrl}/getMatches`, {
                params: {
                    api_key: apiKey,
                    competition_id: 'etekp2526',
                    category_id: '38753',
                    group_id: '302369',
                    team_id: EBT_TEAM_ID_DIV2 // LISÄTTY
                }
            })
        ]);

        // Filtteröi vain pelatut ottelut (API palauttaa jo vain EBT:n ottelut)
        const ebtDiv1Matches = div1Response.data.matches
            ? div1Response.data.matches.filter(match => match.status === 'Played')
            : [];

        const ebtDiv2Matches = div2Response.data.matches
            ? div2Response.data.matches.filter(match => match.status === 'Played')
            : [];

        res.json({
            div1: ebtDiv1Matches,
            div2: ebtDiv2Matches
        });
    } catch (error) {
        console.error('Error fetching EBT matches:', error);
        res.status(500).json({ 
            error: error.message,
            div1: [],
            div2: []
        });
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