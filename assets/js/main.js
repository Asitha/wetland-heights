(function () {
    'use strict';

    // Mobile menu toggle
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');

    if (toggle && menu) {
        var menuLinks = menu.querySelectorAll('.navbar__link');

        function closeMenu() {
            menu.classList.remove('navbar__nav--open');
            toggle.classList.remove('navbar__toggle--active');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function () {
            var isOpen = menu.classList.toggle('navbar__nav--open');
            toggle.classList.toggle('navbar__toggle--active');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        // Close menu when clicking a nav link
        for (var i = 0; i < menuLinks.length; i++) {
            menuLinks[i].addEventListener('click', function () {
                closeMenu();
            });
        }

        // Close menu on Escape key and return focus to toggle
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('navbar__nav--open')) {
                closeMenu();
                toggle.focus();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (menu.classList.contains('navbar__nav--open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Focus trap when menu is open
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab' || !menu.classList.contains('navbar__nav--open')) return;

            var focusableItems = [toggle];
            for (var j = 0; j < menuLinks.length; j++) {
                focusableItems.push(menuLinks[j]);
            }
            var firstItem = focusableItems[0];
            var lastItem = focusableItems[focusableItems.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstItem) {
                    e.preventDefault();
                    lastItem.focus();
                }
            } else {
                if (document.activeElement === lastItem) {
                    e.preventDefault();
                    firstItem.focus();
                }
            }
        });
    }

    // Navbar shadow on scroll
    var navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 10) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }
        }, { passive: true });
    }

    // Scroll-reveal animation
    var reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0 && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            for (var j = 0; j < entries.length; j++) {
                if (entries[j].isIntersecting) {
                    entries[j].target.classList.add('reveal--visible');
                    observer.unobserve(entries[j].target);
                }
            }
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        for (var k = 0; k < reveals.length; k++) {
            observer.observe(reveals[k]);
        }
    } else {
        // Fallback: show everything if IntersectionObserver is unavailable
        for (var m = 0; m < reveals.length; m++) {
            reveals[m].classList.add('reveal--visible');
        }
    }
})();
