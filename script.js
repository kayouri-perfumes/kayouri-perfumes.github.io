let allPerfumes = [];

(function () {
    'use strict';

    const SANITY_PROJECT_ID = 'wdu9exn9';
    const SANITY_DATASET = 'production';
    const SANITY_API_BASE_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}`;
    const ORDER_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsOlwG8cUdgMTxL89rb4slqQncw2OKLOxqZZK2RjVzWGTsj4NtgjI_sA01NQ-rm_Ev/exec';
    const DEFAULT_DESCRIPTION = 'تركيبة فاخرة بلمسات راقية وثبات مميز يمنحك حضورا استثنائيا طوال اليوم.';
    let activePerfume = null;
    let activeCategory = 'all';
    let cartItems = [];
    let selectedDetailQuantity = 1;
    let lastFetchedPerfumes = [];

    function buildUrlWithProductParam(slug) {
        const url = new URL(window.location.href);
        if (slug) {
            url.searchParams.set('product', slug);
        } else {
            url.searchParams.delete('product');
        }
        return url.pathname + url.search + url.hash;
    }

    function clearProductUrl() {
        if (!new URLSearchParams(window.location.search).get('product')) return;
        history.replaceState({}, '', buildUrlWithProductParam(null));
    }

    function parsePrice(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    function calculateCartTotal() {
        return cartItems.reduce(function (sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);
    }

    function renderOrderCartSummary() {
        const summary = document.getElementById('order-cart-summary');
        if (!summary) return;
        if (cartItems.length === 0) {
            summary.textContent = 'لم يتم اختيار منتجات بعد.';
            return;
        }

        const itemsText = cartItems.map(function (item) {
            return `${item.name} × ${item.quantity}`;
        }).join('، ');

        summary.textContent = `الطلب الحالي: ${itemsText} | الإجمالي: ${calculateCartTotal()} DH`;
    }

    function updateSubmitButtonState() {
        const consent = document.getElementById('consent');
        const submitBtn = document.getElementById('submit-order');
        if (!(consent && submitBtn)) return;
        submitBtn.disabled = !consent.checked;
    }

    function updateDetailQuantityDisplay() {
        const qtyEl = document.getElementById('detail-qty-value');
        if (qtyEl) qtyEl.textContent = String(selectedDetailQuantity);
    }

    function renderCart() {
        const itemsContainer = document.getElementById('cart-items');
        const emptyMessage = document.getElementById('cart-empty');
        const subtotal = document.getElementById('cart-subtotal');
        const count = document.getElementById('cart-count');
        if (!(itemsContainer && emptyMessage && subtotal && count)) return;

        itemsContainer.innerHTML = '';

        if (cartItems.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
            cartItems.forEach(function (item) {
                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = `
                    <div class="cart-item-main">
                        <strong>${item.name}</strong>
                        <div>${item.price} DH × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button type="button" class="cart-mini-btn" data-action="increase" data-name="${item.name}">+</button>
                        <button type="button" class="cart-mini-btn" data-action="decrease" data-name="${item.name}">-</button>
                        <button type="button" class="cart-remove-btn" data-action="remove" data-name="${item.name}" aria-label="حذف">✕</button>
                    </div>
                    <div class="cart-item-total">${item.quantity * item.price} DH</div>
                `;
                itemsContainer.appendChild(row);
            });
        }

        subtotal.textContent = `${calculateCartTotal()} DH`;
        count.textContent = String(cartItems.reduce(function (sum, item) { return sum + item.quantity; }, 0));
        renderOrderCartSummary();
    }

    function openCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (!(drawer && overlay)) return;
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.hidden = false;
    }

    function closeCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (!(drawer && overlay)) return;
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.hidden = true;
    }

    function addToCart(perfume, quantity) {
        if (!perfume || !perfume.name) return;
        const qty = Math.max(1, Number(quantity) || 1);
        const existing = cartItems.find(function (item) {
            return item.name === perfume.name;
        });
        if (existing) {
            existing.quantity += qty;
        } else {
            cartItems.push({
                name: perfume.name,
                price: parsePrice(perfume.price),
                quantity: qty
            });
        }
        renderCart();
        openCartDrawer();
    }

    function updateCartItemQuantity(name, delta) {
        const target = cartItems.find(function (item) {
            return item.name === name;
        });
        if (!target) return;

        target.quantity += delta;
        if (target.quantity <= 0) {
            cartItems = cartItems.filter(function (item) {
                return item.name !== name;
            });
        }
        renderCart();
    }

    function removeCartItem(name) {
        cartItems = cartItems.filter(function (item) {
            return item.name !== name;
        });
        renderCart();
    }

    function resetHomeOnLoad() {
        const heroSection = document.getElementById('home');
        const galleryContainer = document.getElementById('collection-gallery');
        const perfumeList = document.getElementById('perfume-list');
        const detailSection = document.getElementById('product-detail-section');

        if (heroSection) heroSection.style.display = 'block';
        if (galleryContainer) galleryContainer.style.display = 'block';
        if (perfumeList) perfumeList.style.display = 'grid';
        if (detailSection) detailSection.style.display = 'none';

        window.scrollTo(0, 0);
    }

    function enforceInitialViewState() {
        resetHomeOnLoad();
        window.requestAnimationFrame(function () {
            window.scrollTo(0, 0);
            setTimeout(function () {
                resetHomeOnLoad();
            }, 0);
        });
    }

    function buildSanityQuery(category) {
        const categoryFilter = category && category !== 'all'
            ? ` && category == "${category}"`
            : '';

        return `*[_type == "perfume"${categoryFilter}]{name, price, category, description, slug, "imageUrl": image.asset->url}`;
    }

    function fetchPerfumesFromSanity(category) {
        const query = buildSanityQuery(category);
        const url = `${SANITY_API_BASE_URL}?query=${encodeURIComponent(query)}`;
        return fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('Failed to fetch perfumes from Sanity');
                return response.json();
            })
            .then(function (data) {
                return Array.isArray(data.result) ? data.result : [];
            });
    }

    function renderPerfumes(perfumes) {
        const perfumeList = document.getElementById('perfume-list');
        if (!perfumeList) return;

        perfumeList.innerHTML = '';

        perfumes.forEach(function (perfume) {
            const card = document.createElement('article');
            card.className = 'product-3d-card reveal';
            card.setAttribute('role', 'button');
            card.tabIndex = 0;
            const slug = perfume.slug && perfume.slug.current;
            if (slug) {
                card.id = slug;
            }

            card.innerHTML = `
                <img class="product-img" loading="lazy" src="${perfume.imageUrl || ''}" alt="${perfume.name || ''}">
                <h3 style="font-size: 1.8rem; margin: 1rem 0;">${perfume.name || ''}</h3>
                <div class="product-price" style="margin: 0.8rem 0;">${perfume.price ? `${perfume.price} DH` : ''}</div>
            `;

            card.addEventListener('click', function () {
                showPerfumeDetails(perfume);
            });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showPerfumeDetails(perfume);
                }
            });
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

    function updateCollectionTitle(category) {
        const title = document.getElementById('collection-title');
        if (!title) return;

        const titleByCategory = {
            all: 'جميع العطور',
            women: 'عطور نسائية',
            men: 'عطور رجالية'
        };

        title.textContent = titleByCategory[category] || titleByCategory.all;
    }

    function pushProductUrl(slug) {
        if (!slug) return;
        const newUrl = window.location.pathname + '?product=' + encodeURIComponent(slug);
        window.history.pushState(null, '', newUrl);
    }

    function showPerfumeDetails(perfume, options) {
        options = options || {};

        if (perfume && perfume.slug && perfume.slug.current) {
            const url = new URL(window.location);
            url.searchParams.set('product', perfume.slug.current);
            window.history.pushState({}, '', url);
            console.log('URL updated to:', perfume.slug.current);
        }

        const heroSection = document.getElementById('home');
        const galleryContainer = document.getElementById('collection-gallery');
        const perfumeList = document.getElementById('perfume-list');
        const detailSection = document.getElementById('product-detail-section');
        const detailImage = document.getElementById('detail-image');
        const detailName = document.getElementById('detail-name');
        const detailPrice = document.getElementById('detail-price');
        const detailDescription = document.getElementById('detail-description');
        const orderForm = document.getElementById('order-form');
        const title = document.getElementById('collection-title');

        if (!(heroSection && galleryContainer && perfumeList && detailSection && detailImage && detailName && detailPrice && detailDescription && orderForm)) {
            return;
        }

        activePerfume = perfume;
        heroSection.style.display = 'none';
        galleryContainer.style.display = 'none';
        perfumeList.style.display = 'none';
        detailSection.style.display = 'block';
        if (title) title.textContent = perfume.name || 'تفاصيل المنتج';

        detailImage.src = perfume.imageUrl || '';
        detailImage.alt = perfume.name || '';
        detailName.textContent = perfume.name || '';
        detailPrice.textContent = perfume.price ? `${perfume.price} DH` : '';
        detailDescription.textContent = perfume.description || DEFAULT_DESCRIPTION;
        selectedDetailQuantity = 1;
        updateDetailQuantityDisplay();
        const addBtn = document.getElementById('add-to-cart-btn');
        if (addBtn) {
            addBtn.onclick = function () {
                addToCart(perfume, selectedDetailQuantity);
            };
        }

        orderForm.reset();
        updateSubmitButtonState();
        renderOrderCartSummary();
        window.scrollTo(0, 0);
    }

    function backToCollection(skipUrlClear) {
        const heroSection = document.getElementById('home');
        const galleryContainer = document.getElementById('collection-gallery');
        const perfumeList = document.getElementById('perfume-list');
        const detailSection = document.getElementById('product-detail-section');
        if (!(heroSection && galleryContainer && perfumeList && detailSection)) return;

        const backUrl = new URL(window.location);
        backUrl.searchParams.delete('product');
        window.history.pushState({}, '', backUrl);
        heroSection.style.display = 'block';
        galleryContainer.style.display = 'block';
        perfumeList.style.display = 'grid';
        detailSection.style.display = 'none';
        updateCollectionTitle(activeCategory);
        window.scrollTo(0, 0);
    }

    function continueShoppingGlobal() {
        closeCartDrawer();
        backToCollection();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showThankYouMessage() {
        const modal = document.createElement('div');
        modal.className = 'thank-you-modal';
        modal.innerHTML = '<div class="thank-you-box">شكرا لك! تم تسجيل طلبك بنجاح وسنتواصل معك قريبا.</div>';
        document.body.appendChild(modal);

        window.requestAnimationFrame(function () {
            modal.classList.add('show');
        });

        setTimeout(function () {
            modal.classList.remove('show');
            setTimeout(function () {
                modal.remove();
            }, 220);
        }, 2200);
    }

    async function submitOrder(e) {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form) {
            return;
        }

        const orderItems = cartItems.length > 0
            ? cartItems
            : (activePerfume ? [{
                name: activePerfume.name || '',
                quantity: selectedDetailQuantity || 1,
                price: parsePrice(activePerfume.price)
            }] : []);

        if (orderItems.length === 0) {
            alert('المرجو إضافة منتج واحد على الأقل إلى السلة قبل تأكيد الطلب.');
            return;
        }

        const normalizedProducts = orderItems.map(function (item) {
            return {
                name: item.name,
                quantity: item.quantity,
                price: item.price
            };
        });
        const productDetails = normalizedProducts.length === 1
            ? `${normalizedProducts[0].name} (Quantity: ${normalizedProducts[0].quantity})`
            : normalizedProducts.map(function (item) {
                return `${item.name} (x${item.quantity})`;
            }).join(' | ');
        const totalPrice = normalizedProducts.reduce(function (sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);
        const fullName = document.getElementById('full-name')?.value.trim() || '';
        const phone = document.getElementById('phone-number')?.value.trim() || '';
        const city = document.getElementById('city')?.value.trim() || '';
        const address = document.getElementById('full-address')?.value.trim() || '';

        const payload = {
            name: fullName,
            phone: phone,
            city: city,
            address: address,
            productDetails: productDetails,
            totalPrice: totalPrice
        };

        const submitBtn = document.getElementById('submit-order');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الإرسال...';
        }

        try {
            await fetch(ORDER_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            showThankYouMessage();
            form.reset();
            updateSubmitButtonState();
            cartItems = [];
            renderCart();
        } catch (_err) {
            alert('حدث خطأ أثناء إرسال الطلب. المرجو إعادة المحاولة.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'تأكيد الطلب';
            }
        }
    }

    function filterProducts(category) {
        const heroSection = document.getElementById('home');
        const galleryContainer = document.getElementById('collection-gallery');
        const perfumeList = document.getElementById('perfume-list');
        const detailSection = document.getElementById('product-detail-section');
        if (!(heroSection && galleryContainer && perfumeList && detailSection)) {
            return Promise.resolve([]);
        }

        activeCategory = category || 'all';
        if (activeCategory !== 'all' && new URLSearchParams(window.location.search).get('product')) {
            clearProductUrl();
        }

        heroSection.style.display = 'block';
        galleryContainer.style.display = 'block';
        detailSection.style.display = 'none';
        perfumeList.style.display = 'grid';
        updateCollectionTitle(activeCategory);

        return fetchPerfumesFromSanity(activeCategory).then(function (data) {
            lastFetchedPerfumes = data;
            if (activeCategory === 'all') {
                allPerfumes = data;
            }
            window.allPerfumes = allPerfumes;

            const urlParams = new URLSearchParams(window.location.search);
            const productSlug = urlParams.get('product');
            if (productSlug) {
                const product = allPerfumes.find(function (p) {
                    return p.slug?.current === productSlug;
                });
                if (product) {
                    showPerfumeDetails(product, { syncUrl: false });
                } else {
                    clearProductUrl();
                    resetHomeOnLoad();
                }
            } else if (activeCategory === 'all') {
                resetHomeOnLoad();
            }

            renderPerfumes(data);

            if (typeof initRevealObserver === 'function') {
                initRevealObserver();
            }

            window.requestAnimationFrame(runProductCardFadeIn);
            return data;
        });
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
                    filterProducts(filterAttr).catch(function () {
                        // Keep UI stable if fetching fails.
                    });
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

    function initProductViewEvents() {
        document.getElementById('back-to-collection')
            ?.addEventListener('click', function () {
                backToCollection(false);
            });
        document.getElementById('order-form')
            ?.addEventListener('submit', function (e) {
                submitOrder(e);
            });
        document.getElementById('consent')
            ?.addEventListener('change', updateSubmitButtonState);
        document.getElementById('detail-qty-plus')
            ?.addEventListener('click', function () {
                selectedDetailQuantity += 1;
                updateDetailQuantityDisplay();
            });
        document.getElementById('detail-qty-minus')
            ?.addEventListener('click', function () {
                selectedDetailQuantity = Math.max(1, selectedDetailQuantity - 1);
                updateDetailQuantityDisplay();
            });
        updateSubmitButtonState();
    }

    function initCartEvents() {
        document.getElementById('cart-toggle')
            ?.addEventListener('click', openCartDrawer);
        document.getElementById('close-cart-btn')
            ?.addEventListener('click', closeCartDrawer);
        document.getElementById('continue-shopping-btn')
            ?.addEventListener('click', continueShoppingGlobal);
        document.getElementById('cart-overlay')
            ?.addEventListener('click', closeCartDrawer);
        document.getElementById('cart-checkout-btn')
            ?.addEventListener('click', function () {
                closeCartDrawer();
                if (activePerfume) {
                    document.getElementById('product-detail-section')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    smooth('#collection');
                }
            });
        document.getElementById('cart-items')
            ?.addEventListener('click', function (e) {
                const target = e.target;
                if (!(target instanceof HTMLElement)) return;
                const action = target.dataset.action;
                const name = target.dataset.name;
                if (!action || !name) return;

                if (action === 'increase') updateCartItemQuantity(name, 1);
                if (action === 'decrease') updateCartItemQuantity(name, -1);
                if (action === 'remove') removeCartItem(name);
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
        const closeMenuBtn = document.getElementById('closeMenuBtn');
        if (!hamburger || !navLinks) return;

        function openMenu() {
            navLinks.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
        }

        function closeMenu() {
            navLinks.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }

        hamburger.addEventListener('click', function () {
            if (navLinks.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        closeMenuBtn?.addEventListener('click', closeMenu);

        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMenu();
            });
        });

        document.addEventListener('click', function (event) {
            if (!navLinks.classList.contains('active')) return;
            const target = event.target;
            if (!(target instanceof Element)) return;

            const clickedInsideMenu = navLinks.contains(target);
            const clickedHamburger = hamburger.contains(target);
            if (!clickedInsideMenu && !clickedHamburger) {
                closeMenu();
            }
        });
    }

    function initOptionalBoutique() {
        document.querySelector('.btn-boutique')
            ?.addEventListener('click', function (e) {
                e.preventDefault();
                alert('طلب موعد خاص: سيتواصل معك فريق الكونسيرج خلال 24 ساعة.');
            });
    }

    function initHistoryNavigation() {
        window.addEventListener('popstate', function () {
            const slug = new URLSearchParams(window.location.search).get('product');
            if (!slug) {
                backToCollection(true);
                return;
            }
            const match = allPerfumes.find(function (p) {
                return p.slug?.current === slug;
            });
            if (match) {
                showPerfumeDetails(match, { syncUrl: false });
            } else {
                backToCollection(true);
            }
        });
    }

    function init() {
        enforceInitialViewState();
        filterProducts('all').catch(function () {
            // Keep UI stable if fetching fails.
        });
        initCursor();
        initRevealObserver();
        initHeaderNav();
        initHistoryNavigation();
        initProductViewEvents();
        initCartEvents();
        initDiscoverBtn();
        initSubscribe();
        initHamburger();
        initOptionalBoutique();
        renderCart();
    }

    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging + deep-link tooling (e.g. console usage)
    window.showPerfumeDetails = showPerfumeDetails;
    window.allPerfumes = allPerfumes;
})();
