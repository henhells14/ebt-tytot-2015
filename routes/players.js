const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Lue pelaajadata
const playersData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/players.json'), 'utf-8')
);

// GET /players - Pelaajat-sivu
router.get('/', (req, res) => {
  res.render('pelaajat', { 
    title: 'Pelaajat - EBT Tytöt 2015',
    players: playersData, 
    page: 'pelaajat'
  });
});

module.exports = router;