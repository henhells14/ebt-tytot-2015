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

// Ottelut
app.get('/ottelut', (req, res) => {
    res.render('ottelut', { 
        title: 'Tulevat ottelut - EBT Tytöt 2015',
        page: 'ottelut'
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

        console.log('Fetching div1...');
        // MUUTOS: Käytä getCategory eikä getGroup
        const div1 = await axios.get(`${apiUrl}/getCategory`, {
            params: {
                api_key: apiKey,
                competition_id: 'etekp2526',
                category_id: '38751'
            }
        });
        console.log('Div1 success');

        console.log('Fetching div2...');
        const div2 = await axios.get(`${apiUrl}/getCategory`, {
            params: {
                api_key: apiKey,
                competition_id: 'etekp2526',
                category_id: '38753'
            }
        });
        console.log('Div2 success');

        res.json({
            div1: div1.data.category.groups[0], // Huom: data-rakenne erilainen
            div2: div2.data.category.groups[0]
        });
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data 
        });
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

// API endpoint tuleville otteluille
app.get('/api/tulevat-ottelut', async (req, res) => {
    try {
        const apiUrl = process.env.BASKETBALL_API_URL;
        const apiKey = process.env.BASKETBALL_API_KEY;

        const EBT_TEAM_ID_DIV1 = '5753845';
        const EBT_TEAM_ID_DIV2 = '5753846';

        // Hae molemmat divisioonat
        const [div1Response, div2Response] = await Promise.all([
            axios.get(`${apiUrl}/getMatches`, {
                params: {
                    api_key: apiKey,
                    competition_id: 'etekp2526',
                    category_id: '38751',
                    group_id: '302370',
                    team_id: EBT_TEAM_ID_DIV1
                }
            }),
            axios.get(`${apiUrl}/getMatches`, {
                params: {
                    api_key: apiKey,
                    competition_id: 'etekp2526',
                    category_id: '38753',
                    group_id: '302369',
                    team_id: EBT_TEAM_ID_DIV2
                }
            })
        ]);

        // Filtteröi tulevat ottelut (ei ole vielä tulosta)
        const upcomingDiv1 = div1Response.data.matches
            ? div1Response.data.matches.filter(match => !match.fs_A && !match.fs_B)
            : [];

        const upcomingDiv2 = div2Response.data.matches
            ? div2Response.data.matches.filter(match => !match.fs_A && !match.fs_B)
            : [];

        // Järjestä päivämäärän mukaan
        const sortByDate = (a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        };

        res.json({
            div1: upcomingDiv1.sort(sortByDate),
            div2: upcomingDiv2.sort(sortByDate)
        });
    } catch (error) {
        console.error('Error fetching upcoming matches:', error);
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