(function () {
    'use strict';

    function smooth(selector) {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getCollectionGrids() {
        const collection = document.getElementById('collection');
        if (!collection) return { womenTitle: null, menTitle: null, womenGrid: null, menGrid: null };

        const womenTitle = document.getElementById('womens-perfumes');
        const menTitle = document.getElementById('mens-perfumes');

        let womenGrid = null;
        let menGrid = null;

        if (womenTitle && womenTitle.nextElementSibling &&
            womenTitle.nextElementSibling.classList.contains('product-grid')) {
            womenGrid = womenTitle.nextElementSibling;
        }
        if (menTitle && menTitle.nextElementSibling &&
            menTitle.nextElementSibling.classList.contains('product-grid')) {
            menGrid = menTitle.nextElementSibling;
        }

        return { collection, womenTitle, menTitle, womenGrid, menGrid };
    }

    function runProductCardFadeIn() {
        const { womenGrid, menGrid } = getCollectionGrids();
        const grids = [womenGrid, menGrid].filter(Boolean);

        grids.forEach(function (grid) {
            if (grid.style.display === 'none') return;

            grid.querySelectorAll('.product-3d-card').forEach(function (card) {
                card.classList.remove('product-filter-fade-in');
            });

            grid.querySelectorAll('.product-3d-card').forEach(function (card) {
                window.requestAnimationFrame(function () {
                    void card.offsetWidth;
                    card.classList.add('product-filter-fade-in');
                });
            });
        });
    }

    /**
     * Show/hide perfume sections by category.
     * @param {string} category - 'all' | 'women' | 'men'
     */
    function filterProducts(category) {
        const { womenTitle, menTitle, womenGrid, menGrid } = getCollectionGrids();

        const showAll = category === 'all';
        const showWomen = showAll || category === 'women';
        const showMen = showAll || category === 'men';

        if (womenTitle) {
            womenTitle.style.display = showWomen ? 'block' : 'none';
        }
        if (menTitle) {
            menTitle.style.display = showMen ? 'block' : 'none';
        }

        if (womenGrid) {
            womenGrid.style.display = showWomen ? 'grid' : 'none';
        }
        if (menGrid) {
            menGrid.style.display = showMen ? 'grid' : 'none';
        }

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
                smooth('#womens-perfumes');
            });
    }

    function initSubscribe() {
        const sub = document.getElementById('insaneSubscribeBtn');
        const emailF = document.getElementById('luxeEmail');
        if (!sub) return;
        sub.addEventListener('click', function () {
            const email = emailF?.value.trim() || '';
            if (email && email.includes('@')) {
                alert('✨ مرحبا ' + email + '. ستتلقى الإطلاقات الخاصة وكشف الساعات الجديدة.');
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

    function init() {
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
