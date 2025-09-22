const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// EJS template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Staattisten tiedostojen käyttö (CSS, JS, kuvat)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware body-parsingille (jos tulee lomakkeita myöhemmin)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ROUTES (reitit eri sivuille)

// Kotisivu - Landing page (Page 1)
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'EBT Tytöt 2015',
        page: 'koti'
    });
});

// Sarjataulukko (Page 2)
app.get('/sarjataulukko', (req, res) => {
    res.render('sarjataulukko', { 
        title: 'Sarjataulukko - EBT Tytöt 2015',
        page: 'sarjataulukko'
    });
});

// Pelaajat (Page 3)
app.get('/pelaajat', (req, res) => {
    res.render('pelaajat', { 
        title: 'Pelaajat - EBT Tytöt 2015',
        page: 'pelaajat'
    });
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