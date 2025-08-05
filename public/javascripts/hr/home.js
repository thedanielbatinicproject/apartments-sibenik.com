/**
 * Dinamičko tematiranje i funkcionalnost za HR home page
 */

class HomePageManager {
    constructor() {
        this.themeSlider = null;
        this.currentTheme = 'auto';
        this.init();
    }

    init() {
        this.initThemeSlider();
        this.setDynamicTheme();
        this.setupScrollAnimations();
        this.setupSmoothScrolling();
        this.setupImageLazyLoading();
        this.setupGalleryInteractions();
        this.startThemeUpdateInterval();
        this.loadReviewsData();
    }

    /**
     * Inicijalizuje theme slider s cookie funkcionalnost
     */
    initThemeSlider() {
        this.themeSlider = document.getElementById('themeSlider');
        if (!this.themeSlider) return;

        // Učitaj spremljenu vrijednost iz cookie-ja
        const savedTheme = this.getCookie('themePreference');
        if (savedTheme !== null) {
            this.themeSlider.value = savedTheme;
            this.currentTheme = 'manual';
            this.applyThemeFromSlider(savedTheme);
        } else {
            // Postaviti slider na auto vrijednost ovisno o vremenu
            const autoValue = this.getAutoThemeValue();
            this.themeSlider.value = autoValue;
        }

        // Event listener za promjene slidera
        this.themeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.currentTheme = 'manual';
            this.applyThemeFromSlider(value);
            this.setCookie('themePreference', value, 2); // 2 sata
            
            // Dodaj mali animacijski efekt
            this.animateSliderThumb();
        });

        // Animacija na hover
        this.themeSlider.addEventListener('mouseenter', () => {
            this.themeSlider.style.transform = 'scale(1.02)';
        });

        this.themeSlider.addEventListener('mouseleave', () => {
            this.themeSlider.style.transform = 'scale(1)';
        });
    }

    /**
     * Animira slider thumb s mini animacijom
     */
    animateSliderThumb() {
        const slider = this.themeSlider;
        const oldTransition = slider.style.transition;
        
        // Kratka, glatka animacija
        slider.style.transition = 'all 0.2s ease';
        slider.style.filter = 'drop-shadow(0 0 8px var(--primary-color))';
        
        setTimeout(() => {
            slider.style.filter = 'none';
            slider.style.transition = oldTransition;
        }, 200);
    }

    /**
     * Dobiva auto tema vrijednost ovisno o vremenu dana
     */
    getAutoThemeValue() {
        const hour = new Date().getHours();
        
        if (hour >= 20 || hour < 6) {
            return 10; // Najcrnja tema
        } else if (hour >= 18 && hour < 20) {
            return 75; // Večernja tema
        } else if (hour >= 6 && hour < 12) {
            return 90; // Jutarnja/dnevna tema
        } else {
            return 95; // Najsvijetlija dnevna tema
        }
    }

    /**
     * Primjenjuje temu ovisno o slider vrijednosti (0-100)
     */
    applyThemeFromSlider(value) {
        const intensity = parseFloat(value);
        
        if (intensity <= 25) {
            // Noćna tema (0-25)
            this.updateThemeColors('night');
            document.body.className = 'night-theme';
        } else if (intensity <= 50) {
            // Tamna tema (25-50)
            this.updateThemeColors('night');
            document.body.className = 'night-theme';
            this.adjustBrightness(0.7 + (intensity - 25) * 0.01);
        } else if (intensity <= 75) {
            // Večernja tema (50-75)
            this.updateThemeColors('evening');
            document.body.className = 'evening-theme';
        } else {
            // Dnevna tema (75-100)
            this.updateThemeColors('day');
            document.body.className = '';
            this.adjustBrightness(0.9 + (intensity - 75) * 0.004);
        }
    }

    /**
     * Prilagođava svjetlinu stranice
     */
    adjustBrightness(factor) {
        document.documentElement.style.filter = `brightness(${factor})`;
    }

    /**
     * Cookie helper funkcije
     */
    setCookie(name, value, hours) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    /**
     * Postavlja dinamičku temu ovisno o lokalnom vremenu korisnika (samo ako nije manual)
     */
    setDynamicTheme() {
        if (this.currentTheme === 'manual') return;

        const autoValue = this.getAutoThemeValue();
        if (this.themeSlider) {
            this.themeSlider.value = autoValue;
        }
        this.applyThemeFromSlider(autoValue);
    }

    /**
     * Ažurira CSS varijable ovisno o temi
     */
    updateThemeColors(theme) {
        const root = document.documentElement;
        
        switch(theme) {
            case 'night':
                root.style.setProperty('--primary-color', 'var(--night-primary)');
                root.style.setProperty('--secondary-color', 'var(--night-secondary)');
                root.style.setProperty('--accent-color', 'var(--night-accent)');
                root.style.setProperty('--bg-start', 'var(--night-bg-start)');
                root.style.setProperty('--bg-end', 'var(--night-bg-end)');
                root.style.setProperty('--card-bg', 'var(--night-card-bg)');
                root.style.setProperty('--text-color', 'var(--night-text)');
                root.style.setProperty('--text-muted', 'var(--night-text-muted)');
                break;
            case 'evening':
                root.style.setProperty('--primary-color', 'var(--evening-primary)');
                root.style.setProperty('--secondary-color', 'var(--evening-secondary)');
                root.style.setProperty('--accent-color', 'var(--evening-accent)');
                root.style.setProperty('--bg-start', 'var(--evening-bg-start)');
                root.style.setProperty('--bg-end', 'var(--evening-bg-end)');
                root.style.setProperty('--card-bg', 'var(--evening-card-bg)');
                root.style.setProperty('--text-color', 'var(--evening-text)');
                root.style.setProperty('--text-muted', 'var(--evening-text-muted)');
                break;
            default: // day
                root.style.setProperty('--primary-color', 'var(--day-primary)');
                root.style.setProperty('--secondary-color', 'var(--day-secondary)');
                root.style.setProperty('--accent-color', 'var(--day-accent)');
                root.style.setProperty('--bg-start', 'var(--day-bg-start)');
                root.style.setProperty('--bg-end', 'var(--day-bg-end)');
                root.style.setProperty('--card-bg', 'var(--day-card-bg)');
                root.style.setProperty('--text-color', 'var(--day-text)');
                root.style.setProperty('--text-muted', 'var(--day-text-muted)');
        }
    }

    /**
     * Pokreće interval za provjeru i ažuriranje teme svakih 10 minuta (samo ako nije manual)
     */
    startThemeUpdateInterval() {
        setInterval(() => {
            if (this.currentTheme !== 'manual') {
                this.setDynamicTheme();
            }
        }, 600000); // 10 minuta
    }

    /**
     * Postavlja animacije na scroll
     */
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Animiraj sekcije
        const animatedElements = document.querySelectorAll('.about-sibenik, .apartments-section, .reservation-section');
        animatedElements.forEach(el => {
            observer.observe(el);
        });

        // Animiraj apartment kartice s kašnjenjem
        const apartmentCards = document.querySelectorAll('.apartment-card');
        apartmentCards.forEach((card, index) => {
            setTimeout(() => {
                observer.observe(card);
            }, index * 100);
        });
    }

    /**
     * Postavlja smooth scrolling za interne linkove
     */
    setupSmoothScrolling() {
        // Smooth scroll za sve interne linkove (ne dodajemo explore-btn jer koristi onclick)
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    this.smoothScrollToElement(target);
                }
            });
        });
    }

    /**
     * Smooth scroll do određene sekcije
     */
    smoothScrollToSection(selector) {
        const element = document.querySelector(selector);
        if (element) {
            this.smoothScrollToElement(element);
        }
    }

    /**
     * Smooth scroll do elementa s offset-om za header
     */
    smoothScrollToElement(element) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 80;
        const elementPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Postavlja lazy loading za slike
     */
    setupImageLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Postavlja interakcije za galeriju
     */
    setupGalleryInteractions() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img) {
                    this.openImageModal(img.src, img.alt);
                }
            });

            // Hover efekt za overlay
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.02)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Otvara modal s uvećanom slikom
     */
    openImageModal(src, alt) {
        // Stvori modal ako ne postoji
        let modal = document.querySelector('#image-modal');
        if (!modal) {
            modal = this.createImageModal();
        }

        const modalImg = modal.querySelector('.modal-image');
        const modalCaption = modal.querySelector('.modal-caption');

        modalImg.src = src;
        modalCaption.textContent = alt;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Animacija otvaranja
        setTimeout(() => {
            modal.classList.add('open');
        }, 10);
    }

    /**
     * Stvara modal za prikaz slika
     */
    createImageModal() {
        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <img class="modal-image" src="" alt="">
                <p class="modal-caption"></p>
            </div>
        `;

        // Dodaj stilove
        const style = document.createElement('style');
        style.textContent = `
            .image-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .image-modal.open {
                opacity: 1;
            }
            .modal-content {
                position: relative;
                max-width: 90%;
                max-height: 90%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .modal-image {
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                border-radius: 10px;
            }
            .modal-caption {
                color: white;
                text-align: center;
                margin-top: 20px;
                font-size: 1.2rem;
            }
            .modal-close {
                position: absolute;
                top: -40px;
                right: 0;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                transition: color 0.3s ease;
            }
            .modal-close:hover {
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(style);

        // Event listeneri za zatvaranje
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImageModal();
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeImageModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                this.closeImageModal();
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Zatvara modal s slikom
     */
    closeImageModal() {
        const modal = document.querySelector('#image-modal');
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    /**
     * Dohvaća stvarne podatke o recenzijama - koristi server-side podatke
     */
    async loadReviewsData() {
        try {
            // Provjeri da li imamo server-side podatke
            if (window.serverReviewsData) {
                this.updateReviewsDisplay(window.serverReviewsData);
            }
        } catch (error) {
            console.error('❌ Greška pri učitavanju recenzija:', error);
        }
    }

    /**
     * Ažurira prikaz recenzija na stranici
     */
    updateReviewsDisplay(reviewsData) {
        const cardRating = document.querySelector('.card-rating');
        const cardReviews = document.querySelector('.card-reviews');
        
        if (!cardRating || !cardReviews || !reviewsData) return;

        // Izračunaj prosječnu ocjenu
        let totalRating = 0;
        let totalReviews = 0;

        Object.keys(reviewsData).forEach(apartmentId => {
            const apartment = reviewsData[apartmentId];
            if (apartment.reviews && apartment.reviews.length > 0) {
                apartment.reviews.forEach(review => {
                    totalRating += review.rating;
                    totalReviews++;
                });
            }
        });

        if (totalReviews > 0) {
            const averageRating = totalRating / totalReviews;
            const roundedRating = Math.round(averageRating * 10) / 10; // Zaokruži na 1 decimalu
            
            // Generiraj zvjezdice ovisno o prosječnoj ocjeni
            const stars = this.generateStars(averageRating);
            
            // Ažuriraj DOM
            cardRating.innerHTML = stars; // Koristimo innerHTML umjesto textContent za HTML ikone
            cardReviews.textContent = `${roundedRating} (${totalReviews} ${this.getReviewsText(totalReviews)})`;
        }
    }

    /**
     * Generira prikaz zvjezdica na osnovu prosječne ocjene
     */
    generateStars(rating) {
        const fullStars = Math.round(rating); // Zaokruži na najbliži broj
        
        let stars = '';
        
        // Pune zvjezdice
        for (let i = 0; i < fullStars; i++) {
            stars += '<img src="/images/icons/star_full.png" alt="★" class="star-icon">';
        }
        
        // Dodaj prazne zvjezdice do 5
        for (let i = fullStars; i < 5; i++) {
            stars += '<img src="/images/icons/star_empty.png" alt="☆" class="star-icon">';
        }
        
        return stars;
    }

    /**
     * Vraća ispravnu hrvatsku riječ za broj recenzija
     */
    getReviewsText(count) {
        if (count === 1) return 'recenzija';
        if (count >= 2 && count <= 4) return 'recenzije';
        return 'recenzija';
    }
}

// Globalna funkcija za smooth scroll (koristi se u HTML-u)
function smoothScrollToSection(selector) {
    if (window.homePageManager) {
        window.homePageManager.smoothScrollToSection(selector);
    }
}

// Pokreni manager kada se stranica učita
document.addEventListener('DOMContentLoaded', () => {
    window.homePageManager = new HomePageManager();
});

// Dodatna optimizacija performansi
window.addEventListener('load', () => {
    // Prefetch linkova za apartmane
    const apartmentLinks = document.querySelectorAll('.card-link');
    apartmentLinks.forEach(link => {
        const linkEl = document.createElement('link');
        linkEl.rel = 'prefetch';
        linkEl.href = link.href;
        document.head.appendChild(linkEl);
    });
});

// Service Worker registracija za cache-iranje (ako dostupan)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registriran: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registracija neuspješna: ', registrationError);
            });
    });
}
