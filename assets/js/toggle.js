'use strict';

function initToggle(card) {
    var tabs = Array.prototype.slice.call(card.querySelectorAll('.property-card__tab'));

    function activate(unit) {
        // Update tabs
        tabs.forEach(function (tab) {
            var isActive = tab.getAttribute('data-unit') === unit;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Show/hide panels and images (skip the tab buttons themselves)
        var unitEls = card.querySelectorAll('[data-unit]');
        for (var k = 0; k < unitEls.length; k++) {
            var el = unitEls[k];
            if (el.classList.contains('property-card__tab')) continue;
            el.hidden = el.getAttribute('data-unit') !== unit;
        }
    }

    tabs.forEach(function (tab, idx) {
        tab.addEventListener('click', function () {
            activate(tab.getAttribute('data-unit'));
        });

        tab.addEventListener('keydown', function (e) {
            var next;
            if (e.key === 'ArrowRight') {
                next = tabs[(idx + 1) % tabs.length];
            } else if (e.key === 'ArrowLeft') {
                next = tabs[(idx - 1 + tabs.length) % tabs.length];
            } else {
                return;
            }
            e.preventDefault();
            activate(next.getAttribute('data-unit'));
            next.focus();
        });
    });
}

if (typeof module !== 'undefined') {
    module.exports = { initToggle: initToggle };
}
