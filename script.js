(function () {
    'use strict';

    const SANITY_PROJECT_ID = 'wdu9exn9';
    const SANITY_DATASET = 'production';
    const SANITY_QUERY = '*[_type == "perfume"]{name, price, "imageUrl": image.asset->url}';
    const SANITY_API_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}?query=${encodeURIComponent(SANITY_QUERY)}`;

    async function fetchPerfumesFromSanity() {
        const response = await fetch(SANITY_API_URL);
        if (!response.ok) throw new Error('Failed to fetch perfumes from Sanity');
        const data = await response.json();
        return Array.isArray(data.result) ? data.result : [];
    }

    function renderPerfumes(perfumes) {
        const perfumeList = document.getElementById('perfume-list');
        if (!perfumeList) return;

        perfumeList.innerHTML = '';

        perfumes.forEach(function (perfume) {
            const card = document.createElement('div');
            card.className = 'product-3d-card reveal tilt-card';

            card.innerHTML = `
                <img class="product-img" loading="lazy" src="${perfume.imageUrl || ''}" alt="${perfume.name || ''}">
                <h3 style="font-size: 1.8rem; margin: 1rem 0;">${perfume.name || ''}</h3>
                <div style="font-size: 1.5rem; margin: 0.8rem 0;">${perfume.price ? `${perfume.price} DH` : ''}</div>
                <a href="https://wa.me/212705042088?text=بغيت%20نسول%20على%20${encodeURIComponent(perfume.name || '')}" target="_blank">
                    <button class="cart-btn" data-name="${perfume.name || ''}">اضغط للطلب</button>
                </a>
            `;
            perfumeList.appendChild(card);
        });
    }

    function smooth(selector) {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function runProductCardFadeIn() {
        const perfumeList = document.getElementById('perfume-list');
        if (!perfumeList || perfumeList.style.display === 'none') return;

        perfumeList.querySelectorAll('.product-3d-card').forEach(function (card) {
            card.classList.remove('product-filter-fade-in');
        });

        perfumeList.querySelectorAll('.product-3d-card').forEach(function (card) {
            window.requestAnimationFrame(function () {
                void card.offsetWidth;
                card.classList.add('product-filter-fade-in');
            });
        });
    }

    function filterProducts() {
        const perfumeList = document.getElementById('perfume-list');
        if (perfumeList) perfumeList.style.display = 'grid';
        window.requestAnimationFrame(runProductCardFadeIn);
    }

    window.filterProducts = filterProducts;

    function initCursor() {
        const dot = document.querySelector('.cursor-dot');
        const outline = document.querySelector('.cursor-outline');
        if (!(dot && outline)) return;

        window.addEventListener('mousemove', function (e) {
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            outline.style.left = e.clientX + 'px';
            outline.style.top = e.clientY + 'px';
        });

        document.querySelectorAll('a,button,.cart-btn,.btn-inquire,.gold-border-btn,.btn-boutique').forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                outline.style.transform = 'translate(-50%, -50%) scale(1.6)';
                outline.style.borderColor = '#F7E7CE';
                outline.style.background = 'rgba(247,231,206,0.1)';
            });
            el.addEventListener('mouseleave', function () {
                outline.style.transform = 'translate(-50%, -50%) scale(1)';
                outline.style.borderColor = '#F7E7CE';
                outline.style.background = 'transparent';
            });
        });
    }

    function initRevealObserver() {
        const reveals = document.querySelectorAll('.reveal');
        const obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('active');
                        obs.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.15 }
        );
        reveals.forEach(function (r) {
            obs.observe(r);
        });
    }

    function initHeaderNav() {
        const navLinks = document.getElementById('navLinks');
        const headerLinks = document.querySelectorAll('header a');

        headerLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                const filterAttr = link.getAttribute('data-filter');

                if (filterAttr) {
                    e.preventDefault();
                    filterProducts(filterAttr);
                    const coll = document.getElementById('collection');
                    if (coll) coll.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (navLinks) navLinks.classList.remove('active');
                    return;
                }

                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    smooth(href);
                    if (navLinks) navLinks.classList.remove('active');
                }
            });
        });
    }

    function initDiscoverBtn() {
        document.getElementById('insaneDiscoverBtn')
            ?.addEventListener('click', function () {
                smooth('#collection');
            });
    }

    function initSubscribe() {
        const sub = document.getElementById('insaneSubscribeBtn');
        const emailF = document.getElementById('luxeEmail');
        if (!sub) return;
        sub.addEventListener('click', function () {
            const email = emailF?.value.trim() || '';
            if (email && email.includes('@')) {
                alert('✨ مرحبا ' + email + '. ستتلقى الإطلاقات الخاصة وكشف الروائح الجديدة.');
                if (emailF) emailF.value = '';
            } else {
                alert('يرجى إدخال بريد إلكتروني صالح لدار كايوري.');
            }
        });
    }

    function initHamburger() {
        const hamburger = document.getElementById('hamburgerBtn');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
            });
        });
    }

    function initOptionalBoutique() {
        document.querySelector('.btn-boutique')
            ?.addEventListener('click', function (e) {
                e.preventDefault();
                alert('طلب موعد خاص: سيتواصل معك فريق الكونسيرج خلال 24 ساعة.');
            });
    }

    async function init() {
        try {
            const perfumes = await fetchPerfumesFromSanity();
            renderPerfumes(perfumes);
        } catch (e) {
            // Optionally: display error to user or fallback!
            // For now, fail silently.
        }
        filterProducts('all');
        initCursor();
        initRevealObserver();
        initHeaderNav();
        initDiscoverBtn();
        initSubscribe();
        initHamburger();
        initOptionalBoutique();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
