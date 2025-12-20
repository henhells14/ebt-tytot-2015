Tässä EBT T-15 verkkosivuharjoitustyö. Sisältää kolme sivua koti, sarjataulukko ja pelaajaesittelyt. 

# 🏀 EBT Tytöt 2015 - Koripallojoukkueen Verkkosivusto

Moderni ja dynaaminen verkkosivusto Espoo Basket Team (EBT) Tytöt 2015 koripallojoukkueelle. Sivusto näyttää reaaliaikaiset sarjataulukot, ottelutulokset ja pelaajaprofiilit.

![Node.js](https://img.shields.io/badge/Node.js-18.x+-green)
![Express](https://img.shields.io/badge/Express-4.18+-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🌟 Ominaisuudet

- ✅ **Reaaliaikaiset sarjataulukot** - API-integraatio Basket.fi:hin
- ✅ **Ottelutulokset** - Pelatut ja tulevat ottelut molemmista divisiooinista
- ✅ **Pelaajaprofiilit** - Modal-pohjaiset pelaajatiedot
- ✅ **Responsiivinen design** - Toimii desktopilla, tabletilla ja mobiilissa
- ✅ **Animoitu navigaatio** - Koripallo-teemainen navigaatio desktopilla, hamburger-menu mobiilissa
- ✅ **Turvallinen API-käyttö** - API-avaimet suojattu .env-tiedostossa

## 🚀 Teknologiat

### Backend
- **Node.js** (v18+)
- **Express.js** - Web framework
- **EJS** - Template engine
- **Axios** - HTTP client API-kutsuille
- **dotenv** - Ympäristömuuttujien hallinta

### Frontend
- **Vanilla JavaScript** - Modal-toiminnallisuus ja animaatiot
- **CSS3** - Modernit animaatiot ja responsiivinen design
- **Basket.fi (Torneopal) API** - Sarjataulukot ja ottelutiedot

## 📁 Projektirakenne
```
ebt-tytot-2015/
├── app.js                      # Express-sovelluksen pääohjelma
├── package.json                # Projektin riippuvuudet
├── .env                        # Ympäristömuuttujat (EI GITTIIN!)
├── .gitignore                  # Git ignore-säännöt
├── data/
│   └── players.json            # Pelaajatiedot
├── public/
│   ├── css/
│   │   ├── style.css          # Yleiset tyylit
│   │   └── standings.css      # Sarjataulukkojen tyylit
│   ├── js/
│   │   ├── app.js             # Navigaatio ja yleinen JS
│   │   └── players.js         # Pelaaja-modal toiminnallisuus
│   └── images/
│       ├── players/           # Pelaajien kuvat
│       ├── EBT-logo-pink.png
│       └── basketball-logo.png
├── routes/
│   └── players.js             # Pelaajien reititys
└── views/
    ├── partials/
    │   ├── header.ejs         # HTML head + body alku
    │   ├── navbar.ejs         # Navigaatio
    │   └── footer.ejs         # Footer + scriptit
    ├── index.ejs              # Kotisivu
    ├── sarjataulukko.ejs      # Sarjataulukot ja ottelut
    ├── pelaajat.ejs           # Pelaajaprofiilit
    └── 404.ejs                # Virhesivu
```

## 🛠️ Asennus ja Käyttö

### 1. Kloonaa repositorio
```bash
git clone https://github.com/henhells14/ebt-tytot-2015
cd ebt-tytot-2015
```

### 2. Asenna riippuvuudet
```bash
npm install
```

### 3. Luo .env tiedosto

Luo projektin juureen `.env` tiedosto:
```env
BASKETBALL_API_URL=https://koripallo.api.torneopal.com/taso/rest
BASKETBALL_API_KEY=your_api_key_here
```

**Huom!** Hae API-avain kilpailunjärjestäjältä. Älä koskaan committaa `.env` tiedostoa Gittiin!

### 4. Käynnistä sovellus

**Kehitystila** (nodemon):
```bash
npm run dev
```

**Tuotanto**:
```bash
npm start
```

Avaa selain: `http://localhost:3000`

## 📡 API-integraatio

### Basket.fi (Torneopal) API

Sovellus käyttää Torneopal REST API:a sarjataulukkojen ja otteluiden hakemiseen.

**Käytetyt endpointit:**
- `/getCategory` - Sarjataulukot ja kategoria-info
- `/getMatches` - Ottelutiedot (pelatut ja tulevat)

**Kriittiset parametrit:**
```javascript
// 1. Divisioona
competition_id: 'etekp2526'
category_id: '38751'
group_id: '302568'  // Kevätkausi
team_id: '5753845'  // EBT 1-div

// 2. Divisioona
competition_id: 'etekp2526'
category_id: '38753'
group_id: '302571'  // Kevätkausi
team_id: '5753846'  // EBT 2-div
```

### API Endpoint-reitit

**Sarjataulukot:**
```
GET /api/sarjataulukko
```
Palauttaa molempien divisioiden sarjataulukot.

**EBT:n ottelut:**
```
GET /api/ottelut
```
Palauttaa EBT:n pelatut ottelut molemmista divareista.

**Tulevat ottelut:**
```
GET /api/tulevat-ottelut
```
Palauttaa EBT:n tulevat ottelut.

## 🎨 Designpäätökset

### Värimaailma
- **Pääväri**: Pink/Magenta (`#e91e63`)
- **Taustagradienti**: Musta → Harmaa
- **Aksentit**: Valkoinen, läpinäkyvät taustat

### Navigaatio
- **Desktop**: Animoitu koripallo-navigaatio (pallo pyörähtää oikealle)
- **Mobile**: Hamburger-menu (responsivo alle 768px)
- **Pink arrow** ohjaa käyttäjää koripallo-nappia kohti

### Taulukot
- Joukkueiden logot haetaan API:sta
- Voitot vihreällä, tappiot punaisella
- Hover-efektit ja animaatiot

## 🔒 Turvallisuus

### API-avaimen suojaus
- ✅ API-avain `.env` tiedostossa (ei koskaan Gittiin)
- ✅ `.gitignore` estää `.env` tiedoston commitoinnin
- ✅ Server-side API-kutsut (avain ei näy frontendissä)
- ✅ Turvallinen deployment Render.com:iin

### .gitignore
```
node_modules/
.env
.DS_Store
```

## 🚢 Deployment

### Render.com

1. **Valmistele projekti:**
```json
// package.json
"engines": {
  "node": "18.x"
},
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
```

2. **Luo Web Service Renderissä:**
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Aseta ympäristömuuttujat:**
   - `BASKETBALL_API_URL`
   - `BASKETBALL_API_KEY`

4. **Deploy:**
   - Push GitHubiin → Render deployaa automaattisesti

## 🔄 Kauden vaihto (Syksy/Kevät)

Kun kausi vaihtuu, päivitä `group_id`:t koodissa:

**1. Hae uusi group_id API:sta:**
```bash
curl "https://koripallo.api.torneopal.com/taso/rest/getCategory?api_key=YOUR_KEY&competition_id=etekp2526&category_id=38751"
```

**2. Päivitä app.js:**
```javascript
// Syyskausi: groups[0]
// Kevätkausi: groups[1]
div1: div1.data.category.groups[1] // Vaihda index
```

**3. Päivitä group_id otteluille:**
```javascript
group_id: '302568'  // 1-div uusi group_id
group_id: '302571'  // 2-div uusi group_id
```

## 📝 Kehitysideoita

- [ ] Admin-paneeli pelaajatietojen päivitykseen
- [ ] Ottelukohtaiset tilastot
- [ ] Kuvagalleria otteluista
- [ ] Yhteystiedot ja treeniajat
- [ ] Joukkueen uutisosio
- [ ] PWA-tuki (offline-tila)

## 🐛 Yleisiä ongelmia

### API palauttaa 500-virheen
- Tarkista että API-avain on voimassa
- Varmista että `group_id` on oikea (kausi vaihtuu 2x vuodessa)
- Tarkista että `competition_id` ja `category_id` ovat oikein

### Sarjataulukot eivät päivity
- Tyhjennä selaimen cache (Ctrl+Shift+R)
- Restart server
- Tarkista että oikea `groups[index]` on käytössä

### Kuvat eivät näy
- Varmista että kuvat ovat `public/images/` kansiossa
- Tarkista tiedostojen nimet ja polut
- Restart server

## 👨‍💻 Kehittäjät

**Projekti luotu yhteistyössä:**
- Kehittäjä: [henhells14]
- Joukkue: EBT Tytöt 2015
- Avustaja: Claude (Anthropic)

## 📄 Lisenssi

MIT License - vapaa käyttöön ja muokkaukseen.

## 🙏 Kiitokset

- **EBT-seuran toimisto-API-avain
- **Basket.fi / Torneopal** - API-tuki
- **EBT Tytöt 2015** - Inspiraatio ja sisältö
- **Anthropic Claude** - Tekninen toteutus ja dokumentaatio

---

**Tehty ❤️:llä koripalloa ja koodausta varten!** 🏀