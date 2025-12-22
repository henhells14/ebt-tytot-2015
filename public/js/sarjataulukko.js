// public/js/sarjataulukko.js

document.addEventListener('DOMContentLoaded', function() {
    lataaSarjataulukot();
    lataaOttelut();
});

// Funktio sarjataulukoiden hakemiseen ja piirtämiseen
async function lataaSarjataulukot() {
    const container = document.getElementById('standingsContent');
    
    try {
        const response = await fetch('/api/sarjataulukko');
        const data = await response.json();
        
        // Rakennetaan HTML
        const html = `
            <div class="division">
                <h2>1. Divisioona</h2>
                ${luoTaulukkoHTML(data.div1.teams)}
            </div>
            <div class="division">
                <h2>2. Divisioona</h2>
                ${luoTaulukkoHTML(data.div2.teams)}
            </div>
        `;
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Virhe sarjataulukoiden lataamisessa:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Virhe sarjataulukoiden lataamisessa. Yritä myöhemmin uudelleen.</p>';
    }
}

// Apufunktio taulukon rivien luomiseen (vähentää toistoa)
function luoTaulukkoHTML(teams) {
    if (!teams) return '<p>Tietoja ei saatavilla</p>';

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
                            <img src="${team.crest}" alt="${team.team_name}" class="team-logo">
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

// Funktio otteluiden hakemiseen ja piirtämiseen
async function lataaOttelut() {
    const container = document.getElementById('ebtMatchesContent');

    try {
        const matchesResponse = await fetch('/api/ebt-ottelut');
        const matchesData = await matchesResponse.json();

        let matchesHtml = '<h2 style="text-align: center; color: #F2059F; margin: 2rem 0;">EBT T-15 pelatut ottelut</h2>';

        // 1. Divisioona
        if (matchesData.div1 && matchesData.div1.length > 0) {
            matchesHtml += `
                <div class="matches-division">
                    <h3>1. Divisioona</h3>
                    ${luoOtteluTaulukko(matchesData.div1)}
                </div>
            `;
        }

        // 2. Divisioona
        if (matchesData.div2 && matchesData.div2.length > 0) {
            matchesHtml += `
                <div class="matches-division">
                    <h3>2. Divisioona</h3>
                    ${luoOtteluTaulukko(matchesData.div2)}
                </div>
            `;
        }

        if ((!matchesData.div1 || matchesData.div1.length === 0) && (!matchesData.div2 || matchesData.div2.length === 0)) {
            matchesHtml += '<p style="text-align: center;">Ei pelattuja otteluita tällä kaudella.</p>';
        }

        container.innerHTML = matchesHtml;
    } catch (error) {
        console.error('Virhe otteluiden lataamisessa:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Virhe otteluiden lataamisessa.</p>';
    }
}

// Apufunktio ottelutaulukon luomiseen
function luoOtteluTaulukko(matches) {
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
                ${matches.map(match => {
                    const isEbtHome = match.team_A_name.includes('EBT');
                    // Tarkistetaan voittaja pisteiden perusteella
                    const pointsA = parseInt(match.fs_A);
                    const pointsB = parseInt(match.fs_B);
                    
                    let isWin = false;
                    if (isEbtHome && pointsA > pointsB) isWin = true;
                    if (!isEbtHome && pointsB > pointsA) isWin = true;
                    
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