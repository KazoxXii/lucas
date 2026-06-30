document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.innerWidth <= 768
        || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // ── HERO ZOOM ──
    setTimeout(() => {
        document.querySelector('.hero').classList.add('loaded');
    }, 100);

    // ── NAVBAR SCROLL ──
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    // ── SCROLL REVEAL ──
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseFloat(entry.target.getAttribute('data-delay')) || 0;
                setTimeout(() => entry.target.classList.add('visible'), delay * 1000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

    // ── SMOOTH SCROLL ──
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                const offset = navbar.offsetHeight + 20;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    });

    // ══════════════════════════════
    // MOBILE MENU
    // ══════════════════════════════
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileClose = document.getElementById('mobileClose');

    function openMobileMenu() {
        mobileMenu.classList.add('open');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    mobileClose.addEventListener('click', closeMobileMenu);
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMobileMenu);
    });

    // Close on swipe down
    let menuTouchStartY = 0;
    mobileMenu.addEventListener('touchstart', (e) => {
        menuTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    // ══════════════════════════════
    // LIGHTBOX WITH PINCH-TO-ZOOM
    // ══════════════════════════════
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    // Wrap img in a container for zoom
    const imgWrap = document.createElement('div');
    imgWrap.className = 'lightbox-img-wrap';
    lightboxImg.parentNode.insertBefore(imgWrap, lightboxImg);
    imgWrap.appendChild(lightboxImg);

    let currentScale = 1;
    let startDist = 0;
    let startScale = 1;
    let lastTap = 0;

    function resetZoom() {
        currentScale = 1;
        lightboxImg.style.transform = 'scale(1)';
    }

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetZoom();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxImg.src = '';
        resetZoom();
    }

    // Open lightbox on image click
    document.querySelectorAll('.flip-front img, .collection-img img, .about-img img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox(img.src, img.alt);
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === imgWrap) closeLightbox();
    });

    // Double-tap to zoom
    imgWrap.addEventListener('touchend', (e) => {
        if (e.touches.length > 0) return;
        const now = Date.now();
        if (now - lastTap < 300) {
            e.preventDefault();
            if (currentScale > 1) {
                resetZoom();
            } else {
                currentScale = 2.5;
                lightboxImg.style.transform = 'scale(2.5)';
            }
        }
        lastTap = now;
    });

    // Pinch-to-zoom
    imgWrap.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            startDist = getDistance(e.touches[0], e.touches[1]);
            startScale = currentScale;
        }
    }, { passive: true });

    imgWrap.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = getDistance(e.touches[0], e.touches[1]);
            currentScale = Math.min(Math.max(startScale * (dist / startDist), 0.5), 5);
            lightboxImg.style.transform = `scale(${currentScale})`;
        }
    }, { passive: false });

    function getDistance(t1, t2) {
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeMobileMenu();
        }
    });

    // ══════════════════════════════
    // ADD TO CART
    // ══════════════════════════════
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const original = btn.textContent;
            btn.textContent = '✓ Ajouté';
            btn.style.background = 'var(--gold)';
            btn.style.color = 'var(--bg)';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = 'transparent';
                btn.style.color = 'var(--gold)';
                btn.disabled = false;
            }, 1500);
        });
    });

});
