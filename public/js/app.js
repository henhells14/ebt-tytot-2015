// Desktop navigaation toggle-funktio
let navOpen = false;

function toggleNav() {
    const basketball = document.querySelector('.basketball-nav');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navOpen) {
        // Avaa navigaatio - koripallo vierähtää oikealle (kaikkien nappien yli)
        basketball.style.transform = 'translateX(500px) rotate(360deg)';
        navMenu.classList.add('show');
        navOpen = true;
    } else {
        // Sulje navigaatio - koripallo palaa takaisin
        basketball.style.transform = 'translateX(0) rotate(0deg)';
        navMenu.classList.remove('show');
        navOpen = false;
    }
}

// Mobile hamburger menu
let mobileNavOpen = false;

function toggleMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger && mobileMenu) {
        if (!mobileNavOpen) {
            hamburger.classList.add('open');
            mobileMenu.classList.add('show');
            mobileNavOpen = true;
        } else {
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('show');
            mobileNavOpen = false;
        }
    }
}

// Event listenerit kun DOM on valmis
document.addEventListener('DOMContentLoaded', function() {
    // Mobile hamburger menu
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileNav);
    }
});

// Sulje navigaatio jos klikataan muualle
document.addEventListener('click', function(e) {
    const headerLeft = document.querySelector('.header-left');
    const mobileNav = document.querySelector('.mobile-nav');
    
    // Desktop navigaatio
    if (headerLeft && !headerLeft.contains(e.target) && navOpen) {
        toggleNav();
    }
    
    // Mobile navigaatio
    if (mobileNav && !mobileNav.contains(e.target) && mobileNavOpen) {
        toggleMobileNav();
    }
});