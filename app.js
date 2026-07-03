// Orbit — site interactivity
// All DOM/UI logic lives here: welcome modal + localStorage, header scroll
// state, mobile burger menu, scroll-to-top, live SpaceX API fetch, and
// ScrollReveal.js animation setup. Everything runs once the DOM is ready.

        // Initialization & DOM Elements
        document.addEventListener('DOMContentLoaded', () => {
            initWelcomeModal();
            initHeaderScroll();
            initMobileMenu();
            initScrollToTop();
            fetchRockets();
            initScrollReveal();
        });

        // 1. Welcome Modal Logic
        function initWelcomeModal() {
            const modal = document.getElementById('welcome-modal');
            const closeBtn = document.getElementById('close-modal');
            
            if (!localStorage.getItem('orbit_visited')) {
                modal.classList.remove('hidden');
            }

            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                localStorage.setItem('orbit_visited', 'true');
            });
        }

        // 2. Header Scroll Transition
        function initHeaderScroll() {
            const header = document.getElementById('top-nav');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('bg-surface/90', 'backdrop-blur-xl', 'py-3');
                    header.classList.remove('py-4');
                } else {
                    header.classList.remove('bg-surface/90', 'backdrop-blur-xl', 'py-3');
                    header.classList.add('py-4');
                }
            });
        }

        // 3. Mobile Menu Toggle
        function initMobileMenu() {
            const toggle = document.getElementById('mobile-menu-toggle');
            const menu = document.getElementById('mobile-menu');
            const body = document.body;
            let isOpen = false;

            toggle.addEventListener('click', () => {
                isOpen = !isOpen;
                if (isOpen) {
                    menu.classList.remove('translate-x-full');
                    toggle.innerHTML = '<span class="material-symbols-outlined text-3xl">close</span>';
                    body.style.overflow = 'hidden';
                } else {
                    menu.classList.add('translate-x-full');
                    toggle.innerHTML = '<span class="material-symbols-outlined text-3xl">menu</span>';
                    body.style.overflow = '';
                }
            });

            // Close on link click
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.add('translate-x-full');
                    toggle.innerHTML = '<span class="material-symbols-outlined text-3xl">menu</span>';
                    body.style.overflow = '';
                    isOpen = false;
                });
            });
        }

        // 4. Scroll To Top
        function initScrollToTop() {
            const btn = document.getElementById('scroll-to-top');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 800) {
                    btn.classList.remove('translate-y-24');
                } else {
                    btn.classList.add('translate-y-24');
                }
            });

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 5. Fetch Rockets Data
        // NOTE: api.spacexdata.com stopped sending CORS headers, so browser-side
        // fetch() calls to it get blocked. Launch Library 2 (thespacedevs.com) is
        // a similar public aerospace API that IS reachable from client-side JS.
        const ROCKETS_ENDPOINT = 'https://ll.thespacedevs.com/2.2.0/config/launcher/?limit=6&ordering=-successful_launches';

        // Used only if the live request fails (offline, rate-limited, etc.) so the
        // section never looks broken during a demo.
        const FALLBACK_ROCKETS = [
            { name: 'Falcon 9', length: 70, diameter: 3.7, maiden_flight: '2010-06-04', description: 'A reusable two-stage rocket designed and manufactured by SpaceX for the reliable and safe transport of satellites and the Dragon spacecraft into orbit.' },
            { name: 'Falcon Heavy', length: 70, diameter: 12.2, maiden_flight: '2018-02-06', description: 'The most powerful operational rocket in the world by a factor of two, consisting of three Falcon 9 nine-engine cores.' },
            { name: 'Atlas V', length: 58.3, diameter: 3.8, maiden_flight: '2002-08-21', description: 'A two-stage expendable launch vehicle built by United Launch Alliance, used for both government and commercial payloads.' },
            { name: 'Soyuz', length: 46.3, diameter: 10.3, maiden_flight: '1966-11-28', description: 'A family of expendable Russian launch vehicles, among the most reliable and frequently used in the world.' },
            { name: 'Ariane 5', length: 52, diameter: 5.4, maiden_flight: '1996-06-04', description: 'A European heavy-lift launch vehicle developed by ESA to deliver payloads into geostationary transfer orbit.' },
            { name: 'Electron', length: 18, diameter: 1.2, maiden_flight: '2017-05-25', description: 'A small orbital rocket by Rocket Lab, built for dedicated small-satellite launches with rapid turnaround.' }
        ];

        function buildRocketCard(rocket, imageUrl) {
            const card = document.createElement('div');
            card.className = 'glass rounded-2xl overflow-hidden border-primary/10 hover:border-primary/40 transition-all duration-500 group flex flex-col h-full';

            const yearText = rocket.maiden_flight ? new Date(rocket.maiden_flight).getFullYear() : '—';
            const sizeText = rocket.length ? `${rocket.length}m / ⌀${rocket.diameter}m` : '—';

            card.innerHTML = `
                <div class="h-56 w-full relative overflow-hidden">
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                         style="background-image: url('${imageUrl}')" 
                         role="img" aria-label="${rocket.name} rocket"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    <div class="absolute bottom-4 left-4">
                        <span class="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            First Flight: ${yearText}
                        </span>
                    </div>
                </div>
                <div class="p-6 flex flex-col grow">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-headline-md text-xl text-white">${rocket.name}</h3>
                        <span class="text-primary font-label-mono text-xs">${sizeText}</span>
                    </div>
                    <p class="text-on-surface-variant text-sm line-clamp-3 mb-6 grow">
                        ${rocket.description || 'No description available.'}
                    </p>
                    <button class="w-full border border-primary/20 py-2 rounded-lg text-primary text-xs font-bold hover:bg-primary/10 transition-colors uppercase tracking-widest">
                        View Telemetry
                    </button>
                </div>
            `;
            return card;
        }

        async function fetchRockets() {
            const grid = document.getElementById('rockets-grid');
            const loader = document.getElementById('rockets-loading');

            try {
                const response = await fetch(ROCKETS_ENDPOINT);
                if (!response.ok) throw new Error(`API responded with ${response.status}`);
                const data = await response.json();
                const rockets = data.results || data;

                loader.classList.add('hidden');
                grid.classList.remove('hidden');

                rockets.forEach((rocket) => {
                    const imageUrl = rocket.image_url || 'assets/images/rocket-fallback.jpg';
                    grid.appendChild(buildRocketCard(rocket, imageUrl));
                });

                ScrollReveal().reveal('#rockets-grid > div', {
                    delay: 200,
                    interval: 100,
                    distance: '30px',
                    origin: 'bottom'
                });

            } catch (error) {
                // Live data unavailable (offline, CORS, rate limit) — fall back to a
                // small local dataset so the section still renders for the demo.
                console.warn('Live rocket data unavailable, using fallback dataset:', error);

                loader.innerHTML = `<p class="text-error font-bold text-sm">Live data unavailable — showing cached rocket data.</p>`;
                grid.classList.remove('hidden');

                FALLBACK_ROCKETS.forEach((rocket) => {
                    grid.appendChild(buildRocketCard(rocket, 'assets/images/rocket-fallback.jpg'));
                });

                ScrollReveal().reveal('#rockets-grid > div', {
                    delay: 200,
                    interval: 100,
                    distance: '30px',
                    origin: 'bottom'
                });
            }
        }

        // 6. ScrollReveal.js Integration
        function initScrollReveal() {
            const sr = ScrollReveal({
                duration: 1000,
                delay: 200,
                distance: '40px',
                easing: 'cubic-bezier(0.5, 0, 0, 1)',
                reset: false
            });

            sr.reveal('.font-display-lg', { origin: 'top' });
            sr.reveal('#hero p', { delay: 400 });
            sr.reveal('#hero .flex', { delay: 600, origin: 'bottom' });
            sr.reveal('.md\\:col-span-8', { origin: 'left' });
            sr.reveal('.md\\:col-span-4 > div', { origin: 'right', interval: 200 });
            sr.reveal('#tech .glass', { interval: 200, origin: 'bottom' });
            sr.reveal('.group .font-headline-lg', { scale: 0.8, interval: 100 });
        }