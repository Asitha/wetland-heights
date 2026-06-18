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

        // Images: toggle is-active class (opacity crossfade, avoids hidden-on-absolute issues)
        var imgs = card.querySelectorAll('.property-card__unit-img');
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].classList.toggle('is-active', imgs[i].getAttribute('data-unit') === unit);
        }

        // Body content: toggle hidden attribute (reliable for flow elements)
        var bodyEls = card.querySelectorAll('[data-unit]:not(.property-card__tab):not(.property-card__unit-img)');
        for (var k = 0; k < bodyEls.length; k++) {
            bodyEls[k].hidden = bodyEls[k].getAttribute('data-unit') !== unit;
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
