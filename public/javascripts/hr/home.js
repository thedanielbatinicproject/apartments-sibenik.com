/**
 * Dinamičko tematiranje i funkcionalnost za HR home page
 */
class HomePageManager {
    constructor() {
        this.themeSlider = null;
        this.currentTheme = 'auto';
    }
    init() {
        this.initRandomFloatingCards();
        this.initThemeSlider();
        this.setDynamicTheme();
        this.setupScrollAnimations();
        this.setupSmoothScrolling();
        this.setupImageLazyLoading();
        this.setupGalleryInteractions();
        this.startThemeUpdateInterval();
        this.loadReviewsData();
        this.initTimeDisplay();
    }
    /**
     * Postavlja random pozicije za floating kartice na desktop verziji
     */
    initRandomFloatingCards() {
        // Funkcija za apliciranje random pozicija
        const applyRandomPositions = () => {
            // Provjeri da li je desktop verzija
            if (window.innerWidth < 1025) {
                // Na mobilnim uređajima ukloni custom pozicioniranje
                const floatingCards = document.querySelectorAll('.extra-floating-card');
                floatingCards.forEach(card => {
                    card.style.left = '';
                    card.style.top = '';
                    card.style.transform = '';
                    card.style.animation = '';
                });
                return;
            }
            const floatingCards = document.querySelectorAll('.extra-floating-card');
            const heroVisual = document.querySelector('.hero-visual');
            const mainCard = document.querySelector('.main-card');
            
            
            if (!floatingCards.length || !heroVisual || !mainCard) {
                return;
            }
            // Izmjeri dimenzije kontajnera
            const containerRect = heroVisual.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            // Definiraj glavnu karticu kao no-go zonu (centar)
            const mainCardZone = {
                x: containerWidth * 0.35, // 35% - 65% horizontalno
                y: containerHeight * 0.35, // 35% - 65% vertikalno  
                width: containerWidth * 0.3,
                height: containerHeight * 0.3
            };
            // Definiraj 13x13 grid pozicije (u pikselima relativno na kontajner)
            const gridSize = 13;
            const cellWidth = containerWidth / gridSize;
            const cellHeight = containerHeight / gridSize;
            
            // Generiraj sve moguće pozicije IZVAN radijusa od centra (6,6)
            const availablePositions = [];
            const centerRow = 6;
            const centerCol = 6;
            
            // POVEĆAJ UDALJENOST - različito za veličine ekrana
            let forbiddenRadius;
            if (containerWidth >= 1600) {
                forbiddenRadius = 3; // POVEĆANO - veliki ekrani
            } else if (containerWidth >= 1200) {
                forbiddenRadius = 3; // POVEĆANO - srednji ekrani  
            } else {
                forbiddenRadius = 2; // POVEĆANO - manji desktop ekrani
            }
            
            console.log(`Veličina kontajnera: ${containerWidth}px, forbidden radius: ${forbiddenRadius}`);
            
            // Provjeri veličinu ekrana za broj kartica
            const isSmallScreen = containerWidth < 1200;
            
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    // Preskačemo centar (6,6) za glavnu karticu
                    if (row === 6 && col === 6) continue;
                    
                    // ZABRANJUJEMO pozicije u radijusu oko centra
                    const distanceFromCenter = Math.max(Math.abs(row - centerRow), Math.abs(col - centerCol));
                    if (distanceFromCenter <= forbiddenRadius) continue;
                    
                    // ZABRANJUJEMO pozicije po rubu grida (prva i zadnja kolona/red)
                    // VRAĆAMO ovu restrikciju da kartice ne budu po rubovima!
                    if (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1) continue;
                    
                    // POSEBNA LOGIKA ZA MANJE DESKTOP EKRANE - preferiraj cirkularno oko centra
                    if (isSmallScreen) {
                        // Na manjim desktop ekranima, samo pozicije blizu centra
                        const distanceFromCenter = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                        
                        // Preferiraj pozicije u radijusu 4-6 oko centra
                        if (distanceFromCenter < 4 || distanceFromCenter > 6) {
                            continue; // preskačemo pozicije koje su preblizu ili predaleko
                        }
                    }
                    
                    // Dodaj poziciju u centru ćelije s malim random offsetom
                    const baseX = (col * cellWidth) + (cellWidth / 2);
                    const baseY = (row * cellHeight) + (cellHeight / 2);
                    
                    // Mali random offset unutar ćelije (max 10% ćelije za preciznost)
                    const offsetRange = Math.min(cellWidth, cellHeight) * 0.1;
                    const offsetX = (Math.random() - 0.5) * offsetRange;
                    const offsetY = (Math.random() - 0.5) * offsetRange;
                    
                    // Izračunaj prioritet na temelju udaljenosti od centra - CIRKULARNO
                    const distanceScore = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                    let priority = 20 - distanceScore; // veći broj = veći prioritet
                    
                    // BONUS prioritet za pozicije u idealnom radijusu oko centra
                    const idealDistance = isSmallScreen ? 4.5 : 5; // idealna udaljenost od centra
                    const distanceFromIdeal = Math.abs(distanceScore - idealDistance);
                    if (distanceFromIdeal < 1) {
                        priority += 10; // veliki bonus za pozicije blizu idealnog radijusa
                    } else if (distanceFromIdeal < 2) {
                        priority += 5; // manji bonus za pozicije u prihvatljivom radijusu
                    }
                    
                    availablePositions.push({
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                        col: col,
                        row: row,
                        priority: priority
                    });
                }
            }
            
            // Sortiraj pozicije po prioritetu (bliže centru = veći prioritet)
            availablePositions.sort((a, b) => b.priority - a.priority);
            
            // DODAJ RANDOMNESS - pomijšaj pozicije visokog prioriteta da budu random ali kvalitetne
            const highPriorityPositions = availablePositions.slice(0, Math.min(50, availablePositions.length)); // POVEĆANO s 30 na 50
            const lowPriorityPositions = availablePositions.slice(50);
            
            // Shuffle high priority pozicije za randomness
            for (let i = highPriorityPositions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [highPriorityPositions[i], highPriorityPositions[j]] = [highPriorityPositions[j], highPriorityPositions[i]];
            }
            
            // Kombinuj nazad
            const shuffledPositions = [...highPriorityPositions, ...lowPriorityPositions];
            
            console.log(`Dostupno ${shuffledPositions.length} pozicija za ${floatingCards.length} kartica (isSmallScreen: ${isSmallScreen})`);
            console.log(`Forbidden radius: ${forbiddenRadius}, Container: ${containerWidth}x${containerHeight}`);
            // Funkcija za provjeru kolizije između dvije kartice
            const checkCollision = (pos1, pos2, cardWidth = 180, cardHeight = 60) => {
                const buffer = 40; // POVEĆAN BUFFER za sprečavanje preklapanja
                return Math.abs(pos1.x - pos2.x) < (cardWidth/2 + buffer) && 
                       Math.abs(pos1.y - pos2.y) < (cardHeight/2 + buffer);
            };
            // Funkcija za provjeru da kartice nisu previše blizu
            const checkAdjacentGridBoxes = (pos1, pos2) => {
                const rowDiff = Math.abs(pos1.row - pos2.row);
                const colDiff = Math.abs(pos1.col - pos2.col);
                
                // POVEĆAJ RESTRIKCIJE - sprečavanje preklapanja
                // Zabranjuj kartice koje su preblizu jedna drugoj
                if (rowDiff <= 1 && colDiff <= 1) {
                    return true; // susjedne i dijagonalne pozicije - zabranjeno
                }
                
                return false; // inače dozvoljeno
            };
            // Funkcija za provjeru kolizije s glavnom karticom
            const checkMainCardCollision = (pos, cardWidth = 180, cardHeight = 60) => {
                // OPTIMIZIRANI BUFFER za cirkularno raspoređivanje
                let buffer;
                if (containerWidth >= 1600) {
                    buffer = 60; // optimalni buffer za velike ekrane
                } else if (containerWidth >= 1200) {
                    buffer = 50; // optimalni buffer za srednje ekrane
                } else {
                    buffer = 40; // optimalni buffer za manje desktop ekrane
                }
                
                return (pos.x + cardWidth/2 + buffer > mainCardZone.x && 
                        pos.x - cardWidth/2 - buffer < mainCardZone.x + mainCardZone.width &&
                        pos.y + cardWidth/2 + buffer > mainCardZone.y && 
                        pos.y - cardWidth/2 - buffer < mainCardZone.y + mainCardZone.height);
            };
            // Pametno pozicioniranje bez preklapanja
            const placedPositions = [];
            const animations = [
                'float-extra-1', 'float-extra-2', 'float-extra-3', 
                'float-extra-4', 'float-extra-5', 'float-extra-6',
                'float-extra-7', 'float-extra-8', 'float-extra-9',
                'float-extra-3', 'float-extra-1' // različite animacije za 10. i 11. karticu
            ];
            // Ograniči broj kartica na temelju veličine ekrana
            let maxCards = floatingCards.length;
            if (isSmallScreen) {
                maxCards = Math.min(7, floatingCards.length); // povećaj na 7 kartica za manje ekrane (dodane 2 nove)
            }
            // VRAĆAM RANDOM ALGORITAM - dodaju se random pozicije ali s kvalitetnim prioritetom
            
            // Koristi shuffled pozicije umjesto original array
            const positionsPool = [...shuffledPositions];
            
            // KONVERTIRAJ NodeList u Array da možemo koristiti .slice()
            const floatingCardsArray = Array.from(floatingCards);
            
            floatingCardsArray.slice(0, maxCards).forEach((card, index) => {
                // Procjeni veličinu kartice
                const cardText = card.textContent || '';
                const baseWidth = Math.min(Math.max(cardText.length * 6 + 30, 120), 180);
                const estimatedWidth = baseWidth;
                const estimatedHeight = 50;
                
                let validPosition = null;
                let attempts = 0;
                const maxAttempts = Math.min(50, positionsPool.length); // ograniči pokušaje da bude brže
                
                // Pokušaj pronaći validnu poziciju - RANDOM pristup
                while (attempts < maxAttempts && !validPosition && positionsPool.length > 0) {
                    // UZMI RANDOM POZICIJU iz pool-a umjesto sekvencijalne
                    const randomIndex = Math.floor(Math.random() * positionsPool.length);
                    const testPosition = positionsPool.splice(randomIndex, 1)[0]; // ukloni random poziciju
                    
                    
                    // Provjeri koliziju s glavnom karticom
                    if (checkMainCardCollision(testPosition, estimatedWidth, estimatedHeight)) {
                        attempts++;
                        continue;
                    }
                    
                    // Provjeri koliziju s već postavljenim karticama
                    let hasCollision = false;
                    for (let i = 0; i < placedPositions.length; i++) {
                        const placedPos = placedPositions[i];
                        
                        // VRATAMO adjacent grid boxes provjeru - VAŽNO za spacing!
                        if (checkAdjacentGridBoxes(testPosition, placedPos)) {
                            hasCollision = true;
                            break;
                        }
                        
                        // Provjeri pixel koliziju
                        if (checkCollision(testPosition, placedPos, estimatedWidth, estimatedHeight)) {
                            hasCollision = true;
                            break;
                        }
                    }
                    
                    if (!hasCollision) {
                        validPosition = testPosition;
                    }
                    
                    attempts++;
                }
                
                
                // Aplicirај poziciju
                if (validPosition) {
                    placedPositions.push(validPosition);
                    
                    const leftPercent = (validPosition.x / containerWidth) * 100;
                    const topPercent = (validPosition.y / containerHeight) * 100;
                    
                    console.log(`🎉 Kartica ${index} postavljena na (${validPosition.col},${validPosition.row}) = ${leftPercent.toFixed(1)}%, ${topPercent.toFixed(1)}%`);
                    
                    // POSTAVKE POZICIJE - ključno sa !important!
                    card.style.setProperty('position', 'absolute', 'important');
                    card.style.setProperty('left', `${leftPercent}%`, 'important');
                    card.style.setProperty('top', `${topPercent}%`, 'important');
                    card.style.setProperty('right', 'unset', 'important'); // reset stare pozicije
                    card.style.setProperty('bottom', 'unset', 'important'); // reset stare pozicije
                    card.style.transform = 'translate(-50%, -50%)';
                    card.style.maxWidth = `${estimatedWidth}px`;
                    card.style.minHeight = `${estimatedHeight}px`;
                    card.style.zIndex = '10'; // osiguraj da su vidljive
                    
                    // Dodaj animaciju bez delay-a - kartice počinju odmah animirati
                    const animationName = animations[index % animations.length];
                    const baseDuration = 6 + (index * 0.3); // kraći interval između kartica
                    const randomVariation = (Math.random() - 0.5) * 2; // ±1 sekunda varijacija
                    const finalDuration = Math.max(4, baseDuration + randomVariation); // minimum 4 sekunde
                    
                    card.style.animation = `${animationName} ${finalDuration.toFixed(1)}s ease-in-out infinite`;
                    // UKLANJAMO animationDelay da kartice ne "teleportiraju"
                    card.style.animationDelay = '0s';
                    
                    // Mouse tracking efekti
                    card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        
                        const deltaX = (e.clientX - centerX) / rect.width;
                        const deltaY = (e.clientY - centerY) / rect.height;
                        
                        const rotateX = deltaY * -10;
                        const rotateY = deltaX * 10;
                        
                        card.style.transform = `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translate(-50%, -50%)';
                    });
                } else {
                    // POBOLJŠANI Fallback pozicioniranje - raspoređuj kartice po gridu
                    const fallbackCol = (index % 4) + 1; // kolone 1-4
                    const fallbackRow = Math.floor(index / 4) + 1; // redovi 1, 2, 3...
                    
                    const fallbackX = (fallbackCol * cellWidth) + (cellWidth / 2);
                    const fallbackY = (fallbackRow * cellHeight) + (cellHeight / 2);
                    
                    const fallbackLeftPercent = (fallbackX / containerWidth) * 100;
                    const fallbackTopPercent = (fallbackY / containerHeight) * 100;
                    
                    
                    card.style.position = 'absolute';
                    card.style.setProperty('left', `${fallbackLeftPercent}%`, 'important');
                    card.style.setProperty('top', `${fallbackTopPercent}%`, 'important');
                    card.style.transform = 'translate(-50%, -50%)';
                    card.style.zIndex = '10';
                    
                    // Dodaj animaciju i za fallback kartice - bez delay-a
                    const animationName = animations[index % animations.length];
                    const finalDuration = 6 + (index * 0.3);
                    card.style.animation = `${animationName} ${finalDuration.toFixed(1)}s ease-in-out infinite`;
                    card.style.animationDelay = '0s';
                }
            });
            
            // Sakrij preostale kartice koje se ne koriste na manjim ekranima
            if (isSmallScreen && maxCards < floatingCards.length) {
                Array.from(floatingCards).slice(maxCards).forEach(card => {
                    card.style.display = 'none';
                });
            }
        };
        // Aplikacija pozicija na učitavanje - povećaj delay
        setTimeout(applyRandomPositions, 500); // Povećana pauza da se elementi učitaju
        // Ponovno apliciraj pozicije na resize (za responsivnost)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(applyRandomPositions, 250);
        });
        
        // DODAJ DEBUG EVENT za provjeru kad se pozicioniranje završi
        setTimeout(() => {
            const floatingCards = document.querySelectorAll('.extra-floating-card');
        }, 1000);
    }
    /**
     * Shuffle array funkcija
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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
            cardReviews.textContent = `Prosječna ocjena: ${roundedRating} (${totalReviews} ${this.getReviewsText(totalReviews)})`;
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
    /**
     * Inicijalizuje i ažurira prikaz lokalnog vremena
     */
    initTimeDisplay() {
        this.updateTimeDisplay();
        // Ažuriraj svake sekunde
        setInterval(() => {
            this.updateTimeDisplay();
        }, 1000);
    }
    /**
     * Ažurira prikaz lokalnog vremena u formatu hh:mm:ss AM/PM
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('current-time');
        if (!timeElement) return;
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Konvertuj u 12-satni format
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Formatiraj s vodećim nulama
        const formattedTime = `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
        
        timeElement.textContent = formattedTime;
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
    window.homePageManager.init(); // POZOVI INIT EKSPLICITNO NAKON ŠTO JE DOM SPREMAN
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
