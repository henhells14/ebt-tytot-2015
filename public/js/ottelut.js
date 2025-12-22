document.addEventListener('DOMContentLoaded', async function() {
        try {
            const response = await fetch('/api/tulevat-ottelut');
            const data = await response.json();

            let html = '<div class="matches-container">';

            // Apufunktio kortin luomiseen
            const luoKortti = (match) => {
                const matchDate = new Date(match.date + 'T' + match.time);
                const isEbtHome = match.team_A_name.includes('EBT');
                
                // Lisätään luokka 'home-game' ja tarra jos EBT on kotijoukkue
                const cardClass = isEbtHome ? 'match-card home-game' : 'match-card';
                const homeBadge = isEbtHome ? '<div class="home-badge">KOTIPELI</div>' : '';

                const venueName = match.venue_name || match.gym_name || match.hall_name || match.venue || 'Pelipaikka avoin';

                return `
                    <div class="${cardClass}">
                        ${homeBadge}
                        <div class="match-date">
                            📅 ${matchDate.toLocaleDateString('fi-FI', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'numeric'
                            })}
                        </div>
                        <div class="match-time">
                            🕐 Klo ${match.time.substring(0, 5)}
                        </div>
                        <div class="match-teams">
                            <div class="team ${isEbtHome ? 'ebt' : ''}">
                                ${match.team_A_name}
                            </div>
                            <div class="vs">VS</div>
                            <div class="team ${!isEbtHome ? 'ebt' : ''}">
                                ${match.team_B_name}
                            </div>
                        </div>
                        <div class="match-venue">
                            📍 <div>
                                <span class="match-venue-name">${venueName}</span>
                                ${match.venue_city_name ? `<br><small style="opacity:0.8">${match.venue_city_name}</small>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            };

            // 1. Divisioona
            if (data.div1 && data.div1.length > 0) {
                const sortedDiv1 = data.div1.sort((a, b) => new Date(a.date) - new Date(b.date));
                html += `
                    <div class="division-matches">
                        <h2>🏀 1. Divisioona</h2>
                        <div class="match-cards">
                            ${sortedDiv1.map(match => luoKortti(match)).join('')}
                        </div>
                    </div>
                `;
            }

            // 2. Divisioona
            if (data.div2 && data.div2.length > 0) {
                const sortedDiv2 = data.div2.sort((a, b) => new Date(a.date) - new Date(b.date));
                html += `
                    <div class="division-matches">
                        <h2>🏀 2. Divisioona</h2>
                        <div class="match-cards">
                            ${sortedDiv2.map(match => luoKortti(match)).join('')}
                        </div>
                    </div>
                `;
            }

            if ((!data.div1 || data.div1.length === 0) && (!data.div2 || data.div2.length === 0)) {
                html += '<div class="no-matches">🏀 Ei tulevia otteluita tällä hetkellä.</div>';
            }

            html += '</div>';
            document.getElementById('upcomingMatchesContent').innerHTML = html;

        } catch (error) {
            console.error('Error loading upcoming matches:', error);
            document.getElementById('upcomingMatchesContent').innerHTML = 
                '<p style="color: white; text-align: center; padding: 2rem;">Virhe ottelutietojen lataamisessa.</p>';
        }
    });