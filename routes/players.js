const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs'); // Tarvitaan tiedoston lukuun

// Apufunktio JSON:n lukuun
const readJson = (filename) => {
    const filePath = path.join(__dirname, '../data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

router.get('/', (req, res) => {
    try {
        const players = readJson('players.json');
        
        // Kokeillaan ladata valmentajat, jos tiedostoa ei ole, käytetään tyhjää listaa
        let coaches = [];
        try {
            coaches = readJson('coaches.json');
        } catch (e) {
            console.log("Valmentajatiedostoa ei löytynyt tai se on tyhjä");
        }

        res.render('pelaajat', { 
            title: 'Pelaajat - EBT Tytöt 2015',
            page: 'pelaajat',
            players: players,
            coaches: coaches
        });
    } catch (error) {
        console.error("Virhe tiedostojen luvussa:", error);
        res.status(500).send("Virhe tietojen lataamisessa");
    }
});

module.exports = router;