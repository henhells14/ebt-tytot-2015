document.addEventListener('DOMContentLoaded', function() {
    lataaSeuraavatOttelut();
});

// --- GLOBAALIT MUUTTUJAT ---
let allMatchesHistory = []; 
let teamLogos = {};

// --- DATAN LATAUS ---
async function lataaSeuraavatOttelut() {
    const container = document.getElementById('nextMatchesContainer');
    
    try {
        const [upcomingRes, historySpringRes, historyAutumnRes, standingsRes] = await Promise.all([
            fetch('/api/tulevat-ottelut'),
            fetch('/api/ebt-ottelut'),
            fetch('/api/ebt-ottelut?kausi=syksy'),
            fetch('/api/sarjataulukko')
        ]);

        const upcomingData = await upcomingRes.json();
        const historySpring = await historySpringRes.json();
        const historyAutumn = await historyAutumnRes.json();
        const standingsData = await standingsRes.json();

        // 1. LOGOJEN KÄSITTELY
        const processLogos = (teams) => {
            if (teams) {
                teams.forEach(t => {
                    teamLogos[t.team_name] = t.crest;
                });
            }
        };
        if (standingsData.div1 && standingsData.div1.teams) processLogos(standingsData.div1.teams);
        if (standingsData.div2 && standingsData.div2.teams) processLogos(standingsData.div2.teams);

        // 2. HISTORIAN YHDISTÄMINEN JA SARJATASON MERKINTÄ (TÄMÄ ON UUTTA!)
        // Lisätään jokaiseen peliin tieto: "sarjaTaso: '1. Divisioona'" tai "'2. Divisioona'"
        const tagMatches = (matches, divName) => {
            if (!matches) return [];
            return matches.map(m => ({ ...m, sarjaTaso: divName }));
        };

        allMatchesHistory = [
            ...tagMatches(historySpring.div1, '1. Divisioona'),
            ...tagMatches(historySpring.div2, '2. Divisioona'),
            ...tagMatches(historyAutumn.div1, '1. Divisioona'),
            ...tagMatches(historyAutumn.div2, '2. Divisioona')
        ];

        let html = '';

        // --- 1. DIVISIOONA KORTTI ---
        if (upcomingData.div1 && upcomingData.div1.length > 0) {
            const sortedMatches = upcomingData.div1.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            html += luoOtteluKorttiHTML(sortedMatches[0], '1. Divisioona');
        }

        // --- 2. DIVISIOONA KORTTI ---
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
    
    const isHome = match.team_A_name.includes('EBT');
    const opponentName = isHome ? match.team_B_name : match.team_A_name;
    
    function muotoileNimi(alkuperainenNimi) {
        if (alkuperainenNimi.includes('EBT')) return 'Espoo';
        return alkuperainenNimi;
    }
    const nameA = muotoileNimi(match.team_A_name);
    const nameB = muotoileNimi(match.team_B_name);

    function getLogoUrl(teamName) {
        if (teamLogos[teamName]) return teamLogos[teamName];
        if (teamName.includes('EBT')) return '/images/EBT-logo-pink.png';
        return '/images/basketball-logo.png'; 
    }
    const logoA = getLogoUrl(match.team_A_name);
    const logoB = getLogoUrl(match.team_B_name);

    const venue = match.venue_name || match.gym_name || match.hall_name || match.venue || match.place || 'Pelipaikka avoin';
    
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

// public/js/home.js - Päivitetty avaaOtteluModal
function avaaOtteluModal(opponent, sarja, pvm, klo, paikka) {
    const modal = document.getElementById('matchModal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.className = 'modal-content pink-modal';
    
    // 1. Suodatetaan historiasta vain kyseisen sarjan pelit (1. tai 2. div)
    // "allMatchesHistory" sisältää nyt KAIKKIEN joukkueiden pelit tässä sarjassa
    const divHistory = allMatchesHistory.filter(m => m.sarjaTaso === sarja);
    
    // Järjestetään aikajärjestykseen (uusin ensin)
    const sortedHistory = divHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // --- APUFUNKTIO: Normalisoidaan nimet vertailua varten ---
    const normalize = (name) => name.toLowerCase().trim();
    const searchOpponent = normalize(opponent); 

    // --- LOGIIKKA 1: PALLURAT (Viisi viimeistä peliä ketä vastaan tahansa) ---
    function luoPallot(teamKeyword) {
        const keyword = normalize(teamKeyword);
        
        // Etsitään pelit, joissa joukkue on mukana (A tai B)
        const teamGames = sortedHistory.filter(m => {
            const teamA = normalize(m.team_A_name);
            const teamB = normalize(m.team_B_name);
            return teamA.includes(keyword) || teamB.includes(keyword);
        });
        
        // Otetaan 5 viimeisintä
        const last5 = teamGames.slice(0, 5);
        
        let html = '';
        if (last5.length === 0) return '<div style="height:20px; font-size:0.8rem; opacity:0.6;">Ei pelejä</div>';

        last5.forEach(m => {
            const isHome = normalize(m.team_A_name).includes(keyword);
            const ptsA = parseInt(m.fs_A);
            const ptsB = parseInt(m.fs_B);
            
            // Voittolokiikka
            let isWin = (isHome && ptsA > ptsB) || (!isHome && ptsB > ptsA);
            
            // Tooltip: "92-47 vs Vastustaja"
            const oppName = isHome ? m.team_B_name : m.team_A_name;
            const tooltip = `${m.fs_A}-${m.fs_B} vs ${oppName}`;
            
            html += `<div class="stat-dot ${isWin ? 'win' : 'loss'}" title="${tooltip}"></div>`;
        });
        return html;
    }

    // Luodaan pallot
    const ebtDotsHtml = luoPallot('EBT');
    const opponentDotsHtml = luoPallot(opponent);


    // --- LOGIIKKA 2: OTTELUT VASTAKKAIN (Vain EBT vs Vastustaja) ---
    const h2hMatches = sortedHistory.filter(m => {
        const teamA = normalize(m.team_A_name);
        const teamB = normalize(m.team_B_name);
        
        const hasEBT = teamA.includes('ebt') || teamB.includes('ebt');
        const hasOpponent = teamA.includes(searchOpponent) || teamB.includes(searchOpponent);
        
        // Listalle kelpaa vain peli, jossa on SEKÄ Ebt ETTÄ Vastustaja
        return hasEBT && hasOpponent;
    });

    let ebtWins = 0;
    let oppWins = 0;
    let matchListHtml = '';
    
    if (h2hMatches.length === 0) {
        matchListHtml = '<div style="background:white; color:black; padding:1rem; border-radius:8px;">Ei aiempia kohtaamisia tällä kaudella.</div>';
    } else {
        h2hMatches.forEach(m => {
            const isEbtHome = normalize(m.team_A_name).includes('ebt');
            const ptsA = parseInt(m.fs_A);
            const ptsB = parseInt(m.fs_B);
            
            if ((isEbtHome && ptsA > ptsB) || (!isEbtHome && ptsB > ptsA)) {
                ebtWins++;
            } else {
                oppWins++;
            }

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

    const logoEBT = '/images/EBT-logo-pink.png';
    const logoOpponent = teamLogos[opponent] || '/images/basketball-logo.png';

    // 3. HTML
    const html = `
        <button id="closeModalBtn" class="modal-close">&times;</button>
        <div class="pink-modal-body">
            <div class="match-header-grid">
                
                <div class="team-column">
                    <img src="${logoOpponent}" class="big-logo">
                    <h3>${opponent}</h3>
                    <div class="stats-label">Viisi viimeistä peliä</div>
                    <div class="dots-container">${opponentDotsHtml}</div>
                    <div class="stats-label">Voitot (H2H)</div>
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
                    <div class="stats-label">Voitot (H2H)</div>
                    <div class="big-stat-circle">${ebtWins}</div>
                </div>
            </div>
            
            <div class="match-list-title">Ottelut vastakkain</div>
            <div class="h2h-list">${matchListHtml}</div>
        </div>
    `;

    modalContent.innerHTML = html;
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMatchModal);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMatchModal() {
    const modal = document.getElementById('matchModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

window.onclick = function(event) {
    const modal = document.getElementById('matchModal');
    if (event.target == modal) {
        closeMatchModal();
    }
}