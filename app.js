// Orbit — site interactivity
// All DOM/UI logic lives here: welcome modal + localStorage, header scroll
// state, mobile burger menu, scroll-to-top, live SpaceX API fetch, and
// ScrollReveal.js animation setup. Everything runs once the DOM is ready.

        // Initialization & DOM Elements
        document.addEventListener('DOMContentLoaded', () => {
            initWelcomeModal();
            initHeaderScroll();
            initMobileMenu();
            initMobileMenuOffset();
            initScrollToTop();
            initActiveNavLinks();
            initCtaButtons();
            initTelemetryModal();
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

        // 3b. Keep the mobile menu panel aligned to the header's real height
        // (the header shrinks from py-4 to py-3 on scroll, so a hardcoded
        // top offset drifts and leaves a gap where the page shows through).
        function initMobileMenuOffset() {
            const header = document.getElementById('top-nav');
            const menu = document.getElementById('mobile-menu');
            if (!header || !menu) return;

            const syncOffset = () => {
                menu.style.top = `${header.offsetHeight}px`;
            };

            syncOffset();
            window.addEventListener('resize', syncOffset);
            window.addEventListener('scroll', syncOffset);
        }

        // 3c. Active Nav Link Highlighting (Scroll Spy)
        // Applies to both the desktop nav and the mobile menu nav.
        function initActiveNavLinks() {
            const sections = ['hero', 'missions', 'rockets', 'tech']
                .map(id => document.getElementById(id))
                .filter(Boolean);
            const navLinks = document.querySelectorAll('[data-nav-link]');

            if (!sections.length || !navLinks.length) return;

            function setActive(sectionId) {
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${sectionId}`;
                    link.classList.toggle('text-primary', isActive);
                    link.classList.toggle('dark:text-primary-fixed', isActive);
                    link.classList.toggle('border-primary', isActive);
                    link.classList.toggle('text-on-surface-variant', !isActive && link.classList.contains('nav-link'));
                    link.classList.toggle('border-transparent', !isActive && link.classList.contains('nav-link'));
                });
            }

            const observer = new IntersectionObserver((entries) => {
                // Pick the entry closest to the top of the viewport among the
                // ones currently intersecting, so only one section is "active".
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length) {
                    setActive(visible[0].target.id);
                }
            }, {
                rootMargin: '-45% 0px -45% 0px', // trigger when section crosses the middle band of the viewport
                threshold: 0
            });

            sections.forEach(section => observer.observe(section));

            // Set correct state immediately on load (before first scroll/observer tick)
            setActive(sections[0].id);
        }

        // 3d. CTA Buttons — Launch Portal / Start Journey / View Missions
        function initCtaButtons() {
            const smoothScrollTo = (id) => {
                const target = document.getElementById(id);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            };

            document.getElementById('start-journey-btn')?.addEventListener('click', () => {
                smoothScrollTo('rockets');
            });

            document.getElementById('view-missions-btn')?.addEventListener('click', () => {
                smoothScrollTo('missions');
            });

            const openSpaceX = () => window.open('https://www.spacex.com', '_blank', 'noopener');
            document.getElementById('launch-portal-btn')?.addEventListener('click', openSpaceX);
            document.getElementById('launch-portal-btn-mobile')?.addEventListener('click', openSpaceX);

            initSubscribeForm();
        }

        // 3e. Newsletter Subscribe (front-end only — no backend, so this just
        // validates the email and shows a confirmation message).
        function initSubscribeForm() {
            const form = document.getElementById('subscribe-form');
            const emailInput = document.getElementById('subscribe-email');
            const message = document.getElementById('subscribe-message');
            if (!form || !emailInput || !message) return;

            form.addEventListener('submit', (e) => {
                e.preventDefault();

                if (!emailInput.checkValidity()) {
                    message.textContent = 'Please enter a valid email address.';
                    message.classList.remove('hidden', 'text-primary-container');
                    message.classList.add('text-error');
                    return;
                }

                message.textContent = `Thanks, subscribed! We'll send updates to ${emailInput.value}.`;
                message.classList.remove('hidden', 'text-error');
                message.classList.add('text-primary-container');
                form.reset();
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
        //
        // The list endpoint (config/launcher/) normally only returns summary
        // fields (name, image_url, manufacturer...) — no description/length/
        // diameter. Those richer fields, plus flight-history and landing stats
        // used in the telemetry modal, only show up when requesting
        // ?mode=detailed. We used to fetch the plain list, then fetch each
        // rocket's detail record separately (7 requests total) — that's what
        // was tripping the API's rate limit. Requesting mode=detailed up front
        // gets everything in ONE request instead.
        const ROCKETS_ENDPOINT = 'https://ll.thespacedevs.com/2.2.0/config/launcher/?limit=6&ordering=-successful_launches&mode=detailed';
        const rocketDetailEndpoint = (id) => `https://ll.thespacedevs.com/2.2.0/config/launcher/${id}/`;

        // In-memory cache for detail records, keyed by rocket id. Seeded from
        // the mode=detailed list response; also used as a fallback path if we
        // ever need to fetch a single rocket's record on its own (e.g. a
        // summary came back without full fields), so we don't re-fetch a
        // record we already have this session.
        const rocketDetailCache = new Map();

        function fetchRocketDetail(id) {
            if (rocketDetailCache.has(id)) {
                return Promise.resolve(rocketDetailCache.get(id));
            }
            return fetch(rocketDetailEndpoint(id))
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data) rocketDetailCache.set(id, data);
                    return data;
                })
                .catch(() => null);
        }

        // A tiny inline placeholder (no external file dependency, so it can
        // never itself 404) used whenever a rocket has no usable image.
        const LOCAL_IMAGE_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 224">
                <rect width="400" height="224" fill="#0b0e14"/>
                <g fill="none" stroke="#00f0ff" stroke-width="2" opacity="0.5">
                    <path d="M200 40 L220 130 L200 150 L180 130 Z"/>
                    <path d="M180 130 L160 165 L180 155 Z"/>
                    <path d="M220 130 L240 165 L220 155 Z"/>
                    <circle cx="200" cy="80" r="8"/>
                </g>
                <text x="200" y="195" fill="#5a6472" font-family="monospace" font-size="12" text-anchor="middle">NO IMAGE</text>
            </svg>
        `);

        // Used only if the live request fails (offline, rate-limited, etc.) so the
        // section never looks broken during a demo. This is a fixed dataset (not
        // filterable) since it isn't coming from the live API.
        const FALLBACK_ROCKETS = [
            { name: 'Falcon 9', length: 70, diameter: 3.7, maiden_flight: '2010-06-04', description: 'A reusable two-stage rocket designed and manufactured by SpaceX for the reliable and safe transport of satellites and the Dragon spacecraft into orbit.' },
            { name: 'Falcon Heavy', length: 70, diameter: 12.2, maiden_flight: '2018-02-06', description: 'The most powerful operational rocket in the world by a factor of two, consisting of three Falcon 9 nine-engine cores.' },
            { name: 'Atlas V', length: 58.3, diameter: 3.8, maiden_flight: '2002-08-21', description: 'A two-stage expendable launch vehicle built by United Launch Alliance, used for both government and commercial payloads.' },
            { name: 'Soyuz', length: 46.3, diameter: 10.3, maiden_flight: '1966-11-28', description: 'A family of expendable Russian launch vehicles, among the most reliable and frequently used in the world.' },
            { name: 'Ariane 5', length: 52, diameter: 5.4, maiden_flight: '1996-06-04', description: 'A European heavy-lift launch vehicle developed by ESA to deliver payloads into geostationary transfer orbit.' },
            { name: 'Electron', length: 18, diameter: 1.2, maiden_flight: '2017-05-25', description: 'A small orbital rocket by Rocket Lab, built for dedicated small-satellite launches with rapid turnaround.' }
        ];

        // Images not loading was caused by two separate issues with the LL2 API's
        // image host (a DigitalOcean Spaces bucket):
        //   1. It's hotlink-protected and checks the Referer header, so the
        //      browser's default referrer gets some requests blocked — fixed by
        //      referrerpolicy="no-referrer" on the <img>.
        //   2. A CSS background-image never fires a JS event on failure, so a
        //      dead/removed image URL just rendered as blank forever. Using a
        //      real <img> lets us listen for `error` and swap in the local
        //      fallback image instead.
        function buildRocketCard(rocket, imageUrl, fallbackUrl) {
            const card = document.createElement('div');
            card.className = 'glass rounded-2xl overflow-hidden border-primary/10 hover:border-primary/40 transition-all duration-500 group flex flex-col h-full';

            const yearText = rocket.maiden_flight ? new Date(rocket.maiden_flight).getFullYear() : '—';
            const sizeText = rocket.length ? `${rocket.length}m / ⌀${rocket.diameter}m` : '—';

            card.innerHTML = `
                <div class="h-56 w-full relative overflow-hidden">
                    <img
                        src="${imageUrl}"
                        alt="${rocket.name} rocket"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
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
                    <button class="view-telemetry-btn w-full border border-primary/20 py-2 rounded-lg text-primary text-xs font-bold hover:bg-primary/10 transition-colors uppercase tracking-widest">
                        View Telemetry
                    </button>
                </div>
            `;

            const img = card.querySelector('img');
            img.addEventListener('error', () => {
                if (img.src !== fallbackUrl) img.src = fallbackUrl;
            }, { once: true });

            card.querySelector('.view-telemetry-btn').addEventListener('click', () => openTelemetryModal(rocket));

            return card;
        }

        // Lightweight loading skeleton — mirrors the real card's layout so the
        // grid doesn't jump around once data arrives.
        function buildSkeletonCard() {
            const card = document.createElement('div');
            card.className = 'skeleton-card glass rounded-2xl overflow-hidden border-primary/10 flex flex-col h-full animate-pulse';
            card.innerHTML = `
                <div class="h-56 w-full bg-white/5"></div>
                <div class="p-6 flex flex-col grow gap-3">
                    <div class="flex justify-between items-start">
                        <div class="h-5 w-2/3 rounded bg-white/10"></div>
                        <div class="h-4 w-12 rounded bg-white/10"></div>
                    </div>
                    <div class="h-3 w-full rounded bg-white/10"></div>
                    <div class="h-3 w-full rounded bg-white/10"></div>
                    <div class="h-3 w-2/3 rounded bg-white/10"></div>
                    <div class="h-9 w-full rounded-lg bg-white/10 mt-auto"></div>
                </div>
            `;
            return card;
        }

        function renderSkeletons(count = 6) {
            const grid = document.getElementById('rockets-grid');
            grid.innerHTML = '';
            for (let i = 0; i < count; i++) {
                grid.appendChild(buildSkeletonCard());
            }
        }

        function renderRockets(rockets, imageFallback) {
            const grid = document.getElementById('rockets-grid');
            grid.innerHTML = '';

            if (!rockets.length) {
                grid.innerHTML = `<p class="col-span-full text-center text-on-surface-variant">No rocket data available right now.</p>`;
                return;
            }

            rockets.forEach((rocket) => {
                // Prefer the rocket's own image; some configs only carry an image
                // on their manufacturer record, so fall back to that before
                // finally falling back to the local placeholder asset.
                const imageUrl = rocket.image_url || (rocket.manufacturer && rocket.manufacturer.image_url) || imageFallback;
                grid.appendChild(buildRocketCard(rocket, imageUrl, imageFallback));
            });

            ScrollReveal().reveal('#rockets-grid > div', {
                delay: 200,
                interval: 100,
                distance: '30px',
                origin: 'bottom'
            });
        }

        async function fetchRockets() {
            const loader = document.getElementById('rockets-loading');
            loader.classList.add('hidden');
            loader.innerHTML = '';

            // Show skeleton placeholder cards immediately instead of blanking the whole section
            renderSkeletons(6);

            try {
                // 1. Use the correct endpoint variable that has &mode=detailed built-in
                const listResponse = await fetch(ROCKETS_ENDPOINT);
                if (!listResponse.ok) throw new Error(`API responded with ${listResponse.status}`);
                
                const listData = await listResponse.json();
                const rockets = listData.results || listData;

                // 2. SEED THE CACHE: Since mode=detailed brought back all specs, descriptions, 
                // and telemetry up-front, store them in your Map so the modals can open instantly 
                // without making any subsequent network requests!
                rockets.forEach((rocket) => {
                    rocketDetailCache.set(rocket.id, rocket);
                });

                // 3. Render directly using the rich records from the single response
                renderRockets(rockets, 'assets/images/rocket-fallback.jpg');

            } catch (error) {
                // Live data unavailable (offline, CORS, rate limit) — fall back gracefully
                console.warn('Live rocket data unavailable, using fallback dataset:', error);

                loader.classList.remove('hidden');
                loader.innerHTML = `<p class="text-error font-bold text-sm">Live data unavailable — showing cached rocket data.</p>`;
                renderRockets(FALLBACK_ROCKETS, 'assets/images/rocket-fallback.jpg');
            }
        }

        // 5c. Telemetry Modal — shows the extended stats only available on the
        // detail endpoint (launch record, landing record, capacity, thrust, cost).
        function initTelemetryModal() {
            const modal = document.getElementById('telemetry-modal');
            const closeBtn = document.getElementById('close-telemetry');
            if (!modal || !closeBtn) return;

            const close = () => modal.classList.add('hidden');

            closeBtn.addEventListener('click', close);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close();
            });
        }

        function statRow(label, value) {
            if (value === undefined || value === null || value === '') return '';
            return `
                <div class="flex justify-between items-center py-2 border-b border-outline-variant/30">
                    <span class="text-on-surface-variant text-sm">${label}</span>
                    <span class="text-white font-label-mono text-sm">${value}</span>
                </div>
            `;
        }

        function openTelemetryModal(rocket) {
            const modal = document.getElementById('telemetry-modal');
            const title = document.getElementById('telemetry-title');
            const content = document.getElementById('telemetry-content');
            if (!modal || !title || !content) return;

            title.textContent = rocket.name;

            const yearText = rocket.maiden_flight ? new Date(rocket.maiden_flight).getFullYear() : '—';
            const costText = rocket.launch_cost ? `$${Number(rocket.launch_cost).toLocaleString()}` : null;
            const landingRate = rocket.attempted_landings
                ? `${Math.round((rocket.successful_landings / rocket.attempted_landings) * 100)}%`
                : null;

            content.innerHTML = `
                <p class="text-on-surface-variant text-sm mb-6">${rocket.description || 'No description available.'}</p>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${rocket.active !== undefined ? `<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rocket.active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}">${rocket.active ? 'Active' : 'Retired'}</span>` : ''}
                    ${rocket.reusable !== undefined ? `<span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">${rocket.reusable ? 'Reusable' : 'Expendable'}</span>` : ''}
                </div>
                <div class="space-y-1 mb-2">
                    ${statRow('Manufacturer', rocket.manufacturer && rocket.manufacturer.name)}
                    ${statRow('Family', rocket.family)}
                    ${statRow('First Flight', yearText !== '—' ? rocket.maiden_flight : '—')}
                    ${statRow('Height / Diameter', rocket.length ? `${rocket.length}m / ⌀${rocket.diameter}m` : '—')}
                    ${statRow('LEO Capacity', rocket.leo_capacity ? `${rocket.leo_capacity.toLocaleString()} kg` : null)}
                    ${statRow('GTO Capacity', rocket.gto_capacity ? `${rocket.gto_capacity.toLocaleString()} kg` : null)}
                    ${statRow('Liftoff Thrust', rocket.to_thrust ? `${rocket.to_thrust.toLocaleString()} kN` : null)}
                    ${statRow('Cost per Launch', costText)}
                    ${statRow('Total Launches', rocket.total_launch_count)}
                    ${statRow('Successful Launches', rocket.successful_launches)}
                    ${statRow('Failed Launches', rocket.failed_launches)}
                    ${statRow('Landing Success Rate', landingRate)}
                </div>
                ${rocket.info_url ? `<a href="${rocket.info_url}" target="_blank" rel="noopener" class="inline-block mt-4 text-primary text-xs font-bold uppercase tracking-widest hover:underline">Official Page →</a>` : ''}
            `;

            modal.classList.remove('hidden');
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