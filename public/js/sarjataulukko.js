document.addEventListener('DOMContentLoaded', function() {
    // Haetaan sivu heti Syksyn tiedoilla
    lataaSarjataulukot('?kausi=syksy'); 
    lataaOttelut('?kausi=syksy');
});

// Tämä funktio kutsutaan napeista
function vaihdaKausi(kausi, btnElement) {
    // 1. Päivitetään nappien ulkonäkö
    document.querySelectorAll('.season-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // 2. Tyhjennetään nykyiset näkymät latauksen ajaksi
    document.getElementById('standingsContent').innerHTML = '<div class="loader-container" style="text-align: center; padding: 3rem;"><p>Ladataan tietoja...</p></div>';
    document.getElementById('ebtMatchesContent').innerHTML = '<p style="text-align: center; padding: 2rem;">Haetaan otteluita...</p>';

    // 3. Haetaan data valitulle kaudelle
    const apiParams = kausi === 'syksy' ? '?kausi=syksy' : '';
    
    lataaSarjataulukot(apiParams);
    lataaOttelut(apiParams);
}

async function lataaSarjataulukot(queryParams = '') {
    const container = document.getElementById('standingsContent');
    
    try {
        const response = await fetch(`/api/sarjataulukko${queryParams}`);
        const data = await response.json();
        
        const html = `
            <div style="grid-column: 1/-1; text-align: center; margin-bottom: 1rem; color: #666;">
                <em>Näytetään tiedot: ${data.season}</em>
            </div>
            <div class="division">
                <h2>1. Divisioona</h2>
                ${luoTaulukkoHTML(data.div1 ? data.div1.teams : null)}
            </div>
            <div class="division">
                <h2>2. Divisioona</h2>
                ${luoTaulukkoHTML(data.div2 ? data.div2.teams : null)}
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Virhe:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Tietoja ei saatavilla.</p>';
    }
}

function luoTaulukkoHTML(teams) {
    if (!teams || teams.length === 0) return '<p style="padding:1rem; text-align:center;">Sarjataulukkoa ei vielä saatavilla / Kausi ei alkanut.</p>';

    return `
        <table class="standings-table">
            <thead>
                <tr>
                    <th>Sija</th>
                    <th>Joukkue</th>
                    <th>O</th>
                    <th>V</th>
                    <th>H</th>
                    <th>P</th>
                </tr>
            </thead>
            <tbody>
                ${teams.map((team, index) => `
                    <tr class="${team.team_name.includes('EBT') ? 'ebt-row' : ''}">
                        <td>${index + 1}</td>
                        <td class="team-cell">
                            <img src="${team.crest}" alt="" class="team-logo">
                            <span>${team.team_name}</span>
                        </td>
                        <td>${team.matches_played}</td>
                        <td>${team.matches_won}</td>
                        <td>${team.matches_lost}</td>
                        <td>${team.points}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function lataaOttelut(queryParams = '') {
    const container = document.getElementById('ebtMatchesContent');

    try {
        const matchesResponse = await fetch(`/api/ebt-ottelut${queryParams}`);
        const matchesData = await matchesResponse.json();

        let matchesHtml = `<h2 style="text-align: center; color: #F2059F; margin: 2rem 0;">Pelatut ottelut (${matchesData.season})</h2>`;

        // Koska API palauttaa nyt kaikki pelit, tarkistamme myöhemmin onko EBT:llä pelejä.
        // Tässä vaiheessa vain välitetään data eteenpäin.
        const hasDiv1 = matchesData.div1 && matchesData.div1.length > 0;
        const hasDiv2 = matchesData.div2 && matchesData.div2.length > 0;

        let contentGenerated = false;

        if (hasDiv1) {
            // Luodaan taulukko ja katsotaan palauttaako se tyhjää vai oikeaa sisältöä
            const tableHtml = luoOtteluTaulukko(matchesData.div1);
            if (tableHtml.length > 0) {
                matchesHtml += `<div class="matches-division"><h3>1. Divisioona</h3>${tableHtml}</div>`;
                contentGenerated = true;
            }
        }

        if (hasDiv2) {
            const tableHtml = luoOtteluTaulukko(matchesData.div2);
            if (tableHtml.length > 0) {
                matchesHtml += `<div class="matches-division"><h3>2. Divisioona</h3>${tableHtml}</div>`;
                contentGenerated = true;
            }
        }

        if (!contentGenerated) {
            matchesHtml += '<p style="text-align: center; font-style: italic;">Ei pelattuja otteluita tällä kaudella.</p>';
        }

        container.innerHTML = matchesHtml;
    } catch (error) {
        console.error('Virhe otteluissa:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Virhe tietojen latauksessa.</p>';
    }
}

// --- TÄSSÄ ON KORJAUS ---
function luoOtteluTaulukko(matches) {
    // 1. SUODATUS: Otetaan vain pelit, joissa EBT on mukana (joko koti tai vieras)
    const ebtMatches = matches.filter(match => 
        match.team_A_name.includes('EBT') || match.team_B_name.includes('EBT')
    );

    // Jos EBT:llä ei ole pelejä tässä listassa, palautetaan tyhjä merkkijono
    // (jolloin lataaOttelut osaa olla näyttämättä tyhjää otsikkoa)
    if (ebtMatches.length === 0) return '';

    // Järjestetään pelit uusin ensin (varmistus)
    ebtMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
        <table class="matches-table">
            <thead>
                <tr>
                    <th>Päivä</th>
                    <th>Koti</th>
                    <th>Tulos</th>
                    <th>Vieras</th>
                </tr>
            </thead>
            <tbody>
                ${ebtMatches.map(match => {
                    const isEbtHome = match.team_A_name.includes('EBT');
                    const pointsA = parseInt(match.fs_A);
                    const pointsB = parseInt(match.fs_B);
                    let isWin = (isEbtHome && pointsA > pointsB) || (!isEbtHome && pointsB > pointsA);
                    
                    return `
                        <tr class="${isWin ? 'win' : 'loss'}">
                            <td>${new Date(match.date).toLocaleDateString('fi-FI')}</td>
                            <td class="${isEbtHome ? 'ebt-team' : ''}">${match.team_A_name}</td>
                            <td class="score">${match.fs_A} - ${match.fs_B}</td>
                            <td class="${!isEbtHome ? 'ebt-team' : ''}">${match.team_B_name}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}