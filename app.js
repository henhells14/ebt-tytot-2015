const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const playersRouter = require('./routes/players');

// ============ CONFIGURATION ============
// Päivitä nämä tiedot kauden vaihtuessa!
const SEASON_CONFIG = {
    competition_id: 'etekp2526',
    // 1. Divisioona asetukset
    div1: {
        category_id: '38751',
        team_id: '5753845',     // EBT T09/10
        group_id_played: '302370', // Syksy/Pelatut (tarkista ID)
        group_id_upcoming: '302568', // Kevät/Tulevat
        group_index: 0          // 0 = Syksy, 1 = Kevät (sarjataulukkoa varten)
    },
    // 2. Divisioona asetukset
    div2: {
        category_id: '38753',
        team_id: '5753846',     // EBT White
        group_id_played: '302369', // Syksy/Pelatut
        group_id_upcoming: '302571', // Kevät/Tulevat
        group_index: 0          // 0 = Syksy, 1 = Kevät
    }
};

// EJS template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Staattiset tiedostot & Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============ ROUTES ============

app.get('/', (req, res) => {
    res.render('index', { title: 'EBT Tytöt 2015', page: 'koti' });
});

app.get('/sarjataulukko', (req, res) => {
    res.render('sarjataulukko', { title: 'Sarjataulukko - EBT Tytöt 2015', page: 'sarjataulukko' });
});

app.get('/ottelut', (req, res) => {
    res.render('ottelut', { title: 'Tulevat ottelut - EBT Tytöt 2015', page: 'ottelut' });
});

app.use('/pelaajat', playersRouter);

// ============ API ROUTES ============

// API endpoint sarjataulukoille
app.get('/api/sarjataulukko', async (req, res) => {
    try {
        const { api_key } = process.env.BASKETBALL_API_KEY ? { api_key: process.env.BASKETBALL_API_KEY } : { api_key: '' }; // Fallback jos puuttuu
        
        // Helper function API-kutsuille
        const fetchCategory = (catId) => axios.get(`${process.env.BASKETBALL_API_URL}/getCategory`, {
            params: {
                api_key: process.env.BASKETBALL_API_KEY,
                competition_id: SEASON_CONFIG.competition_id,
                category_id: catId
            }
        });

        const [div1Res, div2Res] = await Promise.all([
            fetchCategory(SEASON_CONFIG.div1.category_id),
            fetchCategory(SEASON_CONFIG.div2.category_id)
        ]);

        // Optional chaining (?.) estää kaatumisen jos groups on undefined
        res.json({
            div1: div1Res.data.category?.groups?.[SEASON_CONFIG.div1.group_index] || null,
            div2: div2Res.data.category?.groups?.[SEASON_CONFIG.div2.group_index] || null
        });

    } catch (error) {
        console.error('API Error (sarjataulukko):', error.message);
        res.status(500).json({ error: 'Tietojen haku epäonnistui' });
    }
});

// API endpoint EBT:n pelatuille otteluille
app.get('/api/ebt-ottelut', async (req, res) => {
    try {
        const fetchMatches = (catId, groupId, teamId) => axios.get(`${process.env.BASKETBALL_API_URL}/getMatches`, {
            params: {
                api_key: process.env.BASKETBALL_API_KEY,
                competition_id: SEASON_CONFIG.competition_id,
                category_id: catId,
                group_id: groupId,
                team_id: teamId
            }
        });

        const [div1Response, div2Response] = await Promise.all([
            fetchMatches(SEASON_CONFIG.div1.category_id, SEASON_CONFIG.div1.group_id_played, SEASON_CONFIG.div1.team_id),
            fetchMatches(SEASON_CONFIG.div2.category_id, SEASON_CONFIG.div2.group_id_played, SEASON_CONFIG.div2.team_id)
        ]);

        const filterPlayed = (matches) => matches ? matches.filter(match => match.status === 'Played') : [];

        res.json({
            div1: filterPlayed(div1Response.data.matches),
            div2: filterPlayed(div2Response.data.matches)
        });
    } catch (error) {
        console.error('API Error (pelatut):', error.message);
        res.status(500).json({ error: error.message, div1: [], div2: [] });
    }
});

// API endpoint tuleville otteluille
app.get('/api/tulevat-ottelut', async (req, res) => {
    try {
        const fetchMatches = (catId, groupId, teamId) => axios.get(`${process.env.BASKETBALL_API_URL}/getMatches`, {
            params: {
                api_key: process.env.BASKETBALL_API_KEY,
                competition_id: SEASON_CONFIG.competition_id,
                category_id: catId,
                group_id: groupId,
                team_id: teamId
            }
        });

        const [div1Response, div2Response] = await Promise.all([
            fetchMatches(SEASON_CONFIG.div1.category_id, SEASON_CONFIG.div1.group_id_upcoming, SEASON_CONFIG.div1.team_id),
            fetchMatches(SEASON_CONFIG.div2.category_id, SEASON_CONFIG.div2.group_id_upcoming, SEASON_CONFIG.div2.team_id)
        ]);

        // Filtteröi tulevat (ei pisteitä kirjattu)
        const filterUpcoming = (matches) => matches ? matches.filter(m => !m.fs_A && !m.fs_B) : [];

        const sortByDate = (a, b) => {
            return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
        };

        res.json({
            div1: filterUpcoming(div1Response.data.matches).sort(sortByDate),
            div2: filterUpcoming(div2Response.data.matches).sort(sortByDate)
        });
    } catch (error) {
        console.error('API Error (tulevat):', error.message);
        res.status(500).json({ error: error.message, div1: [], div2: [] });
    }
});

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Sivua ei löydy', page: '404' });
});

app.listen(port, () => {
    console.log(`🏀 EBT Tytöt 2015 server pyörii: http://localhost:${port}`);
});