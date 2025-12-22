document.addEventListener('DOMContentLoaded', function() {
    lataaSeuraavatOttelut();
});

// --- GLOBAALIT MUUTTUJAT ---
// Tallennetaan pelihistoria (Kevät + Syksy) muistiin modaalia varten
let allMatchesHistory = []; 
// Tallennetaan logot muistiin sarjataulukosta { "Joukkueen Nimi": "logon_url" }
let teamLogos = {};

// --- DATAN LATAUS JA KORTTIEN LUONTI ---
async function lataaSeuraavatOttelut() {
    const container = document.getElementById('nextMatchesContainer');
    
    try {
        // Haetaan kaikki tarvittava data rinnakkain
        const [upcomingRes, historySpringRes, historyAutumnRes, standingsRes] = await Promise.all([
            fetch('/api/tulevat-ottelut'),              // 1. Tulevat pelit
            fetch('/api/ebt-ottelut'),                  // 2. Kevään historia
            fetch('/api/ebt-ottelut?kausi=syksy'),      // 3. Syksyn historia
            fetch('/api/sarjataulukko')                 // 4. Sarjataulukot (Logot)
        ]);

        const upcomingData = await upcomingRes.json();
        const historySpring = await historySpringRes.json();
        const historyAutumn = await historyAutumnRes.json();
        const standingsData = await standingsRes.json();

        // 1. RAKENNETAAN LOGO-KIRJASTO
        const processLogos = (teams) => {
            if (teams) {
                teams.forEach(t => {
                    teamLogos[t.team_name] = t.crest;
                });
            }
        };
        if (standingsData.div1 && standingsData.div1.teams) processLogos(standingsData.div1.teams);
        if (standingsData.div2 && standingsData.div2.teams) processLogos(standingsData.div2.teams);

        // 2. YHDISTETÄÄN HISTORIA
        allMatchesHistory = [
            ...historySpring.div1, ...historySpring.div2,
            ...historyAutumn.div1, ...historyAutumn.div2
        ];

        let html = '';

        // --- 1. DIVISIOONA SEURAAVA PELI ---
        if (upcomingData.div1 && upcomingData.div1.length > 0) {
            const sortedMatches = upcomingData.div1.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            html += luoOtteluKorttiHTML(sortedMatches[0], '1. Divisioona');
        }

        // --- 2. DIVISIOONA SEURAAVA PELI ---
        if (upcomingData.div2 && upcomingData.div2.length > 0) {
            const sortedMatches = upcomingData.div2.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            html += luoOtteluKorttiHTML(sortedMatches[0], '2. Divisioona');
        }

        if (html === '') {
            container.innerHTML = '<p style="text-align: center; width: 100%; color: white;">Ei tulevia otteluita merkitty kalenteriin.</p>';
        } else {
            container.innerHTML = html;
        }

    } catch (error) {
        console.error('Virhe etusivun latauksessa:', error);
        container.innerHTML = '<p style="color: white; text-align: center;">Ottelutietoja ei saatu ladattua.</p>';
    }
}

function luoOtteluKorttiHTML(match, sarjaNimi) {
    const dateObj = new Date(match.date);
    const dateStr = dateObj.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
    const timeStr = match.time ? match.time.substring(0, 5) : '??:??';
    
    // Nimet
    const isHome = match.team_A_name.includes('EBT');
    const opponentName = isHome ? match.team_B_name : match.team_A_name;
    
    // Muutetaan EBT -> Espoo näkyvään tekstiin
    function muotoileNimi(alkuperainenNimi) {
        if (alkuperainenNimi.includes('EBT')) return 'Espoo';
        return alkuperainenNimi;
    }
    const nameA = muotoileNimi(match.team_A_name);
    const nameB = muotoileNimi(match.team_B_name);

    // Logot
    function getLogoUrl(teamName) {
        if (teamLogos[teamName]) return teamLogos[teamName];
        if (teamName.includes('EBT')) return '/images/EBT-logo-pink.png';
        return '/images/basketball-logo.png'; 
    }
    const logoA = getLogoUrl(match.team_A_name);
    const logoB = getLogoUrl(match.team_B_name);

    // Pelipaikka
    const venue = match.venue_name || match.gym_name || match.hall_name || match.venue || match.place || 'Pelipaikka avoin';

    // Escape (Varmistetaan että tiedot kulkevat onclick-komentoon oikein)
    const opponentOriginalName = match.team_A_name.includes('EBT') ? match.team_B_name : match.team_A_name;
    const safeOpponent = opponentOriginalName.replace(/'/g, "\\'");
    const safeVenue = venue.replace(/'/g, "\\'");
    
    return `
        <div class="match-card" onclick="avaaOtteluModal('${safeOpponent}', '${sarjaNimi}', '${dateStr}', '${timeStr}', '${safeVenue}')">
            <h3>${sarjaNimi}</h3>
            
            <div class="match-details">
                <div class="match-date">${dateStr}. klo ${timeStr}</div>
                
                <div class="teams-container">
                    <div class="team-side">
                        <img src="${logoA}" alt="${match.team_A_name}" class="match-logo" onerror="this.src='/images/basketball-logo.png'">
                        <span class="${match.team_A_name.includes('EBT') ? 'ebt-text' : ''}">${nameA}</span>
                    </div>
                    <div class="vs-text">vs</div>
                    <div class="team-side">
                        <img src="${logoB}" alt="${match.team_B_name}" class="match-logo" onerror="this.src='/images/basketball-logo.png'">
                        <span class="${match.team_B_name.includes('EBT') ? 'ebt-text' : ''}">${nameB}</span>
                    </div>
                </div>

                <div class="match-place">📍 ${venue}</div>
            </div>
            <span class="btn-match">Katso aiemmat kohtaamiset</span>
        </div>
    `;
}

// --- MODAL TOIMINNOT (PINKKI TEEMA) ---

function avaaOtteluModal(opponent, sarja, pvm, klo, paikka) {
    const modal = document.getElementById('matchModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // 1. Vaihdetaan modalin tyyli pinkiksi
    modalContent.className = 'modal-content pink-modal';
    
    // 2. EBT:n Kuntopuntari (5 vikaa peliä)
    const sortedHistory = allMatchesHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    const ebtLast5 = sortedHistory.slice(0, 5);
    
    let ebtDotsHtml = '';
    ebtLast5.forEach(m => {
        const isEbtHome = m.team_A_name.includes('EBT');
        const ptsA = parseInt(m.fs_A);
        const ptsB = parseInt(m.fs_B);
        let isWin = (isEbtHome && ptsA > ptsB) || (!isEbtHome && ptsB > ptsA);
        ebtDotsHtml += `<div class="stat-dot ${isWin ? 'win' : 'loss'}"></div>`;
    });

    // 3. Head-to-Head (Keskinäiset)
    const normalize = (name) => name.toLowerCase().trim();
    const searchOpponent = normalize(opponent); 
    
    const h2hMatches = allMatchesHistory.filter(m => {
        const teamA = normalize(m.team_A_name);
        const teamB = normalize(m.team_B_name);
        return (teamA.includes(searchOpponent) || searchOpponent.includes(teamA)) && !teamA.includes('ebt') 
            || (teamB.includes(searchOpponent) || searchOpponent.includes(teamB)) && !teamB.includes('ebt');
    });

    // Lasketaan voitot
    let ebtWins = 0;
    let oppWins = 0;
    let matchListHtml = '';
    
    if (h2hMatches.length === 0) {
        matchListHtml = '<div style="background:white; color:black; padding:1rem; border-radius:8px;">Ei aiempia kohtaamisia tällä kaudella.</div>';
    } else {
        h2hMatches.forEach(m => {
            const isEbtHome = m.team_A_name.includes('EBT');
            const ptsA = parseInt(m.fs_A);
            const ptsB = parseInt(m.fs_B);
            
            if ((isEbtHome && ptsA > ptsB) || (!isEbtHome && ptsB > ptsA)) {
                ebtWins++;
            } else {
                oppWins++;
            }

            // Logot listaan
            const logoA = m.team_A_name.includes('EBT') ? '/images/EBT-logo-pink.png' : (teamLogos[m.team_A_name] || '/images/basketball-logo.png');
            const logoB = m.team_B_name.includes('EBT') ? '/images/EBT-logo-pink.png' : (teamLogos[m.team_B_name] || '/images/basketball-logo.png');

            matchListHtml += `
                <div class="h2h-card">
                    <div class="h2h-date">${new Date(m.date).toLocaleDateString('fi-FI')}</div>
                    <div class="h2h-teams">
                        <img src="${logoA}" class="mini-logo">
                        <span style="font-size:0.9rem; font-weight:bold;">${m.team_A_name.replace('EBT', 'EBT')}</span>
                        <span class="h2h-score">${m.fs_A} - ${m.fs_B}</span>
                        <span style="font-size:0.9rem; font-weight:bold;">${m.team_B_name.replace('EBT', 'EBT')}</span>
                        <img src="${logoB}" class="mini-logo">
                    </div>
                </div>
            `;
        });
    }

    // 4. Logot yläosaan
    const logoEBT = '/images/EBT-logo-pink.png';
    const logoOpponent = teamLogos[opponent] || '/images/basketball-logo.png';

    // 5. Rakennetaan HTML (HUOM: Nappi on nyt id="closeModalBtn")
    const html = `
        <button id="closeModalBtn" class="modal-close">&times;</button>
        <div class="pink-modal-body">
            
            <div class="match-header-grid">
                <div class="team-column">
                    <img src="${logoOpponent}" class="big-logo">
                    <h3>${opponent}</h3>
                    <div style="height:20px;"></div>
                    <div class="stats-label">Voitot</div>
                    <div class="big-stat-circle">${oppWins}</div>
                </div>

                <div class="center-column">
                    <div class="vs-title">VS</div>
                    <div style="margin-top:2rem;">
                        <div class="stats-label">Ottelut</div>
                        <div class="center-stat-circle">${h2hMatches.length}</div>
                    </div>
                </div>

                <div class="team-column">
                    <img src="${logoEBT}" class="big-logo">
                    <h3>EBT Espoo</h3>
                    <div class="stats-label">Viisi viimeistä peliä</div>
                    <div class="dots-container">${ebtDotsHtml}</div>
                    <div class="stats-label">Voitot</div>
                    <div class="big-stat-circle">${ebtWins}</div>
                </div>
            </div>

            <div class="match-list-title">Ottelut vastakkain</div>
            <div class="h2h-list">${matchListHtml}</div>
        </div>
    `;

    modalContent.innerHTML = html;
    
    // --- KORJAUS: Laitetaan sulkemistoiminto päälle tässä ---
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMatchModal);
    }
    
    // Näytä modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMatchModal() {
    const modal = document.getElementById('matchModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Sulkeminen taustaa klikkaamalla
window.onclick = function(event) {
    const modal = document.getElementById('matchModal');
    if (event.target == modal) {
        closeMatchModal();
    }
}