// Avaa modal ja näytä pelaajan tiedot
function openModal(playerId) {
  const player = playersData.find(p => p.id === playerId);
  
  if (!player) return;
  
  // Päivitä modalin sisältö
  document.getElementById('modalImage').src = `/images/players/${player.image}`;
  document.getElementById('modalImage').alt = player.name;
  document.getElementById('modalName').textContent = player.name;
  document.getElementById('modalBirthdate').textContent = player.birthdate || '';
  document.getElementById('modalPosition').textContent = player.position || '';
  document.getElementById('modalMotto').textContent = player.motto || '';
  document.getElementById('modalAbout').textContent = player.about || '';
  
  // Näytä modal
  const modal = document.getElementById('playerModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Estä scrollaus
}

// Sulje modal
function closeModal() {
  const modal = document.getElementById('playerModal');
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Palauta scrollaus
}

// Sulje modal ESC-näppäimellä
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});