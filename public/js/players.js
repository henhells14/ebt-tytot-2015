// public/js/players.js

function openModal(personId) {
  // Etsitään henkilö "allPeopleData" listasta
  // Käytetään '==' jotta se toimii vaikka ID olisi numero tai teksti
  const person = allPeopleData.find(p => p.id == personId);
  
  if (!person) {
    console.error('Henkilöä ei löydy ID:llä:', personId);
    return;
  }
  
  // Haetaan HTML-elementit
  const imgEl = document.getElementById('modalImage');
  const nameEl = document.getElementById('modalName');
  const detail1El = document.getElementById('modalDetail1'); // Ylärivi (Paikka/Rooli)
  const detail2El = document.getElementById('modalDetail2'); // Alarivi (Syntymäaika)
  const mottoBlock = document.getElementById('mottoBlock');
  const aboutBlock = document.getElementById('aboutBlock');
  
  // --- ASETETAAN TIEDOT ---

  // === MODEL-KORJAUS ALKAA TÄSTÄ ===
  // Määritellään kuvakansio sen perusteella, onko henkilöllä 'role' (valmentaja) vai ei (pelaaja)
  let imageFolder;
  let defaultImage;

  if (person.role) {
      // On valmentaja
      imageFolder = 'coaches';
      defaultImage = 'default-coach.png'; // Varmista että tämä kuva on olemassa images/coaches/ kansiossa
  } else {
      // On pelaaja
      imageFolder = 'players';
      defaultImage = 'default-player.png';
  }

  // Asetetaan kuvan polku dynaamisesti
  // Käytetään person.imagea jos se löytyy, muuten oletuskuvaa
  imgEl.src = `/images/${imageFolder}/${person.image || defaultImage}`;
  // === MODEL-KORJAUS PÄÄTTYY TÄHÄN ===

  imgEl.alt = person.name;
  nameEl.textContent = person.name;

  // ONKO VALMENTAJA? (Tarkistetaan onko 'role' tietoa)
  if (person.role) {
    // Valmentajan näkymä
    detail1El.textContent = person.role.toUpperCase(); // Esim. "PÄÄVALMENTAJA"
    detail1El.style.color = '#2d2b2cff'; // Pinkki väri
    detail1El.style.fontWeight = 'bold';
    
    detail2El.textContent = ''; // Valmentajalla ei näytetä syntymäaikaa tässä
  } 
  // ... VAI PELAAJA?
  else {
    // Pelaajan näkymä
    const number = person.number ? `#${person.number}` : '';
    const pos = person.position || '';
    
    detail1El.textContent = `${number} | ${pos}`;
    detail1El.style.color = '#333';
    
    if (person.birthdate) {
      detail2El.textContent = `Syntynyt: ${person.birthdate}`;
    } else {
      detail2El.textContent = '';
    }
  }

  // Motto (Piilotetaan jos tyhjä)
  if (person.motto) {
    document.getElementById('modalMotto').textContent = person.motto;
    mottoBlock.style.display = 'block';
  } else {
    mottoBlock.style.display = 'none';
  }

  // About (Piilotetaan jos tyhjä)
  if (person.about) {
    document.getElementById('modalAbout').textContent = person.about;
    aboutBlock.style.display = 'block';
  } else {
    aboutBlock.style.display = 'none';
  }
  
  // Näytä modal ja estä taustalla rullaus
  const modal = document.getElementById('playerModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('playerModal');
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Palautetaan rullaus
}

// Sulje modal ESC-näppäimellä
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});