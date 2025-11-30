(() => {
    'use strict';

    // Helpers
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const debounce = (fn, wait = 20) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    };

    // Elements (guarded) - be more robust locating the nav
    const hamburger = $('.hamburger');
    const navMenu = document.getElementById('main-navigation') || $('.nav-menu');
    const navbar = $('.navbar');
    const quoteForm = $('#quoteForm');

    // Accessibility helpers for mobile menu (enhanced link animation)
    const setMenuState = (open) => {
        if (!hamburger || !navMenu) return;
        hamburger.classList.toggle('active', !!open);
        navMenu.classList.toggle('show', !!open);
        navMenu.classList.toggle('active', !!open);
        hamburger.setAttribute('aria-expanded', String(!!open));
        navMenu.setAttribute('aria-hidden', String(!open));

        const links = Array.from(navMenu.querySelectorAll('a'));
        if (open) {
            // prepare links for staggered reveal
            links.forEach((a, i) => {
                a.setAttribute('tabindex', '0');
                a.style.opacity = '0';
                a.style.transform = 'translateY(8px)';
                a.style.transition = 'opacity .32s cubic-bezier(.2,.9,.3,1), transform .32s cubic-bezier(.2,.9,.3,1)';
                setTimeout(() => {
                    a.style.opacity = '1';
                    a.style.transform = 'translateY(0)';
                }, 60 + i * 60);
            });
        } else {
            // clear inline styles and remove from tab order
            links.forEach(a => {
                a.setAttribute('tabindex', '-1');
                a.style.opacity = '';
                a.style.transform = '';
                a.style.transition = '';
            });
        }
    };

    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = hamburger.classList.contains('active');
            setMenuState(!isOpen);
        });
    }

    // Close mobile menu on link click (event delegation)
    if (navMenu) {
        navMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) setMenuState(false);
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger || !navMenu) return;
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            setMenuState(false);
        }
    });

    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuState(false);
    });

    // Smooth scrolling for internal anchors
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        // Respect reduced motion
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'start'
        });
        // Close mobile menu after navigation
        setMenuState(false);
    });

    // Quote form handling with basic validation and optional fetch
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = quoteForm.querySelector('button[type="submit"]');
            const name = quoteForm.querySelector('input[type="text"]')?.value?.trim() || '';
            const email = quoteForm.querySelector('input[type="email"]')?.value?.trim() || '';
            const message = quoteForm.querySelector('textarea')?.value?.trim() || '';
            if (!name || !email) {
                alert('Please provide your name and email.');
                return;
            }

            // Simple email pattern check
            const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailValid) {
                alert('Please enter a valid email address.');
                return;
            }

            if (submitBtn) submitBtn.disabled = true;

            // Replace the URL below with your server endpoint to actually send data
            const endpoint = quoteForm.getAttribute('data-endpoint') || ''; // optional
            const payload = { name, email, message };

            try {
                if (endpoint) {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error('Network error');
                } else {
                    // Fake delay to simulate send
                    await new Promise(r => setTimeout(r, 700));
                }
                // Success UX
                alert('Thank you for your inquiry! We will get back to you soon.');
                quoteForm.reset();
            } catch (err) {
                console.error('Form submit error', err);
                alert('There was an error submitting the form. Please try again later.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Header class toggling on scroll (debounced)
    const onScroll = () => {
        if (!navbar) return;
        const y = window.scrollY || window.pageYOffset;
        navbar.classList.toggle('scrolled', y > 80);
    };
    window.addEventListener('scroll', debounce(onScroll, 50), { passive: true });
    // initial check
    onScroll();

    // Simple CSS fallback if JS can't set CSS variables
    // Animation on scroll (IntersectionObserver), respects reduced motion
    document.addEventListener('DOMContentLoaded', () => {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const observerOpts = { threshold: 0.08, rootMargin: '0px 0px -10% 0px' };
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                // add revealed class (CSS handles transition)
                el.classList.add('revealed');
                // apply pop variant if requested
                if (el.dataset.animate === 'pop') el.classList.add('pop');
                obs.unobserve(el);
            });
        }, observerOpts);

        // select elements to animate and assign stagger delays
        const animateSelector = '.feature, .product-card, .service-card, .map-card, .footer-section';
        const elements = $$(animateSelector);
        elements.forEach((el, idx) => {
            el.classList.add('reveal');
            el.style.setProperty('--delay', `${idx * 20}ms`);
            if (el.matches('.service-card')) el.dataset.animate = 'pop';
            io.observe(el);
        });
    });

    // Expose for debugging if needed
    window.__Ananda = {
        setMenuState
    };
})();