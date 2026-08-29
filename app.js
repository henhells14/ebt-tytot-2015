const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const playersRouter = require('./routes/players');

// ============ CONFIGURATION ============
const SEASON_CONFIG = {
    competition_id: 'etekp2627', // Uusi kausi 2026-2027
    
    // 1. Divisioona (T12)
    div1: {
        category_id: '35423', 
        team_id: '5753845',   // (Tämä tiimi-ID säilyy yleensä samana seuralla)
        
        // KEVÄT 2027 (Ei vielä alkanut, joten jätetään tyhjäksi)
        group_id_current: '', 
        group_index_current: 1,
        
        // SYKSY 2026 (Basket.fi uudet ID:t)
        group_id_prev: '303083', 
        group_index_prev: 0         
    },
    
    // 2. Divisioona (T12)
    div2: {
        category_id: '35425',
        team_id: '5753846',
        
        // KEVÄT 2027
        group_id_current: '',
        group_index_current: 1,
        
        // SYKSY 2026
        group_id_prev: '303086',
        group_index_prev: 0
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
        // Katsotaan pyytääkö frontend syksyä (?kausi=syksy)
        const isAutumn = req.query.kausi === 'syksy';

        // Valitaan oikeat indeksit kauden mukaan
        const d1Index = isAutumn ? SEASON_CONFIG.div1.group_index_prev : SEASON_CONFIG.div1.group_index_current;
        const d2Index = isAutumn ? SEASON_CONFIG.div2.group_index_prev : SEASON_CONFIG.div2.group_index_current;

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

        res.json({
            div1: div1Res.data.category?.groups?.[d1Index] || null,
            div2: div2Res.data.category?.groups?.[d2Index] || null,
            season: isAutumn ? 'Syksy 2026' : 'Kevät 2027'
        });

    } catch (error) {
        console.error('API Error (sarjataulukko):', error.message);
        res.status(500).json({ error: 'Tietojen haku epäonnistui' });
    }
});

// API endpoint pelatuille otteluille
app.get('/api/ebt-ottelut', async (req, res) => {
    try {
        const isAutumn = req.query.kausi === 'syksy';

        // Valitaan oikeat Group ID:t kauden mukaan
        const d1Group = isAutumn ? SEASON_CONFIG.div1.group_id_prev : SEASON_CONFIG.div1.group_id_current;
        const d2Group = isAutumn ? SEASON_CONFIG.div2.group_id_prev : SEASON_CONFIG.div2.group_id_current;

        // app.js - Etsi tämä kohta
const fetchMatches = (catId, groupId) => axios.get(`${process.env.BASKETBALL_API_URL}/getMatches`, {
    params: {
        api_key: process.env.BASKETBALL_API_KEY,
        competition_id: SEASON_CONFIG.competition_id,
        category_id: catId,
        group_id: groupId,
        // POISTETTU: team_id: teamId  <-- TÄMÄ RIVI POIS
    }
});

const [div1Response, div2Response] = await Promise.all([
    // Poistetaan kolmas parametri (teamId) kutsusta
    fetchMatches(SEASON_CONFIG.div1.category_id, d1Group),
    fetchMatches(SEASON_CONFIG.div2.category_id, d2Group)
]);

        const filterPlayed = (matches) => matches ? matches.filter(match => match.status === 'Played') : [];

        res.json({
            div1: filterPlayed(div1Response.data.matches),
            div2: filterPlayed(div2Response.data.matches),
            season: isAutumn ? 'Syksy 2026' : 'Kevät 2027'
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