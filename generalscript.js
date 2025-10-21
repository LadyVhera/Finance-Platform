
        AOS.init({ once: true, duration: 700, offset: 80 });

        // Navbar shadow on scroll
        window.addEventListener("scroll", () => {
            const nav = document.getElementById("mainNav");
            nav.classList.toggle("scrolled", window.scrollY > 10);
        });

        // ⭐ Enable/refresh Bootstrap ScrollSpy for active-link highlighting
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize ScrollSpy
            const spy = new bootstrap.ScrollSpy(document.body, {
                target: '#mainNav',
                offset: 100 // keep in sync with body[data-bs-offset]
            });

            // Recalculate on resize/content changes (e.g., images/AOS)
            const refreshSpy = () => {
                if (spy && typeof spy.refresh === 'function') spy.refresh();
            };
            window.addEventListener('resize', refreshSpy);
            window.addEventListener('load', refreshSpy);
            document.addEventListener('aos:in', refreshSpy);
            const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
        });

        // Counters animation
        function countTo(el, target, suffix = '') {
            const d = 1200; const start = 0; const t0 = performance.now();
            function frame(t) { const p = Math.min((t - t0) / d, 1); const val = Math.floor(start + (target - start) * (0.5 - 0.5 * Math.cos(Math.PI * p))); el.textContent = val + suffix; if (p < 1) requestAnimationFrame(frame); }
            requestAnimationFrame(frame);
        }

        // Bootstrap form validation
        (function () { 'use strict'; var forms = document.querySelectorAll('.needs-validation'); Array.from(forms).forEach(function (form) { form.addEventListener('submit', function (event) { if (!form.checkValidity()) { event.preventDefault(); event.stopPropagation(); } form.classList.add('was-validated'); }, false); }); })();

        // Demo local auth (client-side only)
        const USERS_KEY = 'tpt_demo_users_v2';
        function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch (e) { return []; } }
        function saveUser(u) { const arr = getUsers(); arr.push(u); localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }

        // toggle password visibility
        document.getElementById('toggleSignInPwd').addEventListener('click', () => {
            const p = document.getElementById('signInPassword'); p.type = (p.type === 'password') ? 'text' : 'password'; document.getElementById('toggleSignInPwd').textContent = p.type === 'password' ? 'Show' : 'Hide';
        });

        // Sign up flow
        document.getElementById('signUpForm').addEventListener('submit', e => {
            e.preventDefault(); e.stopPropagation();
            const f = e.target; if (!f.checkValidity()) { f.classList.add('was-validated'); return; }
            const name = document.getElementById('suName').value.trim();
            const email = document.getElementById('suEmail').value.trim().toLowerCase();
            const password = document.getElementById('suPassword').value;
            const role = document.getElementById('suRole').value;
            const users = getUsers();
            if (users.some(u => u.email === email)) { alert('An account with that email already exists (demo).'); return; }
            saveUser({ name, email, password, role, created: Date.now() });
            alert('Account created (demo). You can now sign in.');
            // switch to sign in tab and prefill
            document.querySelector('#signin-tab').click();
            document.getElementById('signInEmail').value = email;
        });

        // Sign in flow
        document.getElementById('signInForm').addEventListener('submit', e => {
            e.preventDefault(); e.stopPropagation();
            const f = e.target; if (!f.checkValidity()) { f.classList.add('was-validated'); return; }
            const email = document.getElementById('signInEmail').value.trim().toLowerCase();
            const password = document.getElementById('signInPassword').value;
            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) { alert('Sign in failed (demo). Check email/password.'); return; }
            // demo session
            localStorage.setItem('tpt_demo_session', JSON.stringify({ email: user.email, name: user.name }));
            // close modal
            const modalEl = document.getElementById('authModal'); const bsModal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
            bsModal.hide();
            setTimeout(() => alert('Welcome back, ' + (user.name || 'friend') + ' — demo session stored locally.'), 200);
        });

        // "Forgot password" demo
        document.getElementById('forgotLink').addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt('Enter your email for password-reset instructions (demo):');
            if (!email) return;
            const found = getUsers().find(u => u.email === email.trim().toLowerCase());
            if (!found) { alert('Email not found (demo).'); return; }
            alert('Demo: a password-reset link would be sent to your email (not implemented).');
        });

        // small helpers for switching tabs
        document.getElementById('toSignUp').addEventListener('click', () => document.querySelector('#signup-tab').click());
        document.getElementById('toSignIn').addEventListener('click', () => document.querySelector('#signin-tab').click());

        // Subscribe demo
        document.getElementById('subscribeBtn').addEventListener('click', () => {
            const em = document.getElementById('subscribeEmail').value.trim();
            if (!em || !/\S+@\S+\.\S+/.test(em)) { alert('Enter a valid email.'); return; }
            alert('Thanks — subscribed (demo).');
            document.getElementById('subscribeEmail').value = '';
        });

        // Form handlers (demo)
        document.getElementById('loginForm')?.addEventListener('submit', e => {
            e.preventDefault();
            alert('Logged in (demo). Implement backend authentication.');
            bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
        });
        document.getElementById('registerForm')?.addEventListener('submit', e => {
            e.preventDefault();
            alert('Account created (demo). Connect to backend.');
            bootstrap.Modal.getInstance(document.getElementById('registerModal'))?.hide();
        });
        document.getElementById('requestForm')?.addEventListener('submit', e => {
            e.preventDefault();
            alert('Request published (demo). Hook with your API.');
            bootstrap.Modal.getInstance(document.getElementById('requestModal'))?.hide();
        });

        (function () {
            const grid = document.getElementById('tptGalleryGrid');
            const filters = document.getElementById('tptGalleryFilters');
            if (!grid || !filters) return;

            const items = Array.from(grid.querySelectorAll('.tpt-g-item'));
            let active = 'all';

            const match = (el) => active === 'all' || el.dataset.category === active;

            function showSix() {
                let count = 0;
                items.forEach(el => {
                    const ok = match(el) && count < 6;
                    el.classList.toggle('tpt-visible', ok);
                    el.style.display = ok ? '' : 'none';
                    if (ok) count++;
                });
                if (window.AOS) AOS.refresh();
                // refresh ScrollSpy because layout height changed
                const spy = bootstrap.ScrollSpy.getInstance(document.body);
                if (spy && typeof spy.refresh === 'function') spy.refresh();
            }

            // filter clicks
            filters.querySelectorAll('button[data-filter]').forEach(btn => {
                btn.addEventListener('click', () => {
                    filters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    active = btn.dataset.filter || 'all';
                    showSix();
                    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });

            // lightbox (optional)
            const lbModalEl = document.getElementById('tptLightbox');
            const lb = lbModalEl ? bootstrap.Modal.getOrCreateInstance(lbModalEl) : null;
            const lbImg = document.getElementById('tptLbImg');
            const lbTitle = document.getElementById('tptLbTitle');
            const lbCap = document.getElementById('tptLbCap');
            const lbTag = document.getElementById('tptLbTag');

            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-open="lightbox"]');
                if (!btn || !lb) return;
                const card = btn.closest('.tpt-g-item');
                const img = card.querySelector('img');
                lbImg.src = img.src;
                lbImg.alt = card.dataset.title || '';
                lbTitle.textContent = card.dataset.title || 'Story';
                lbCap.textContent = card.dataset.caption || '';
                lbTag.textContent = (card.dataset.category || '').replace(/^\w/, c => c.toUpperCase());
                lb.show();
            });

            // init
            showSix();
        })();

        document.addEventListener("DOMContentLoaded", function () {
            // Utility: animate number counting
            function animateValue(id, start, end, duration, isCurrency = false, isPercent = false) {
                const obj = document.getElementById(id);
                const range = end - start;
                const increment = range / (duration / 20);
                let current = start;

                const timer = setInterval(() => {
                    current += increment;
                    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                        current = end;
                        clearInterval(timer);
                    }

                    if (isCurrency) {
                        obj.textContent = "₱" + Math.floor(current).toLocaleString();
                    } else if (isPercent) {
                        obj.textContent = Math.floor(current) + "%";
                    } else {
                        obj.textContent = Math.floor(current);
                    }
                }, 20);
            }

            // When modal opens, trigger the animation
            const dashboardModal = document.getElementById("dashboardModal");
            dashboardModal.addEventListener("shown.bs.modal", function () {
                // Example demo values — replace with real data later
                const inflows = 82500;
                const outflows = 67800;
                const fulfillmentRate = Math.round((outflows / inflows) * 100);

                animateValue("kpi1", 0, inflows, 1200, true);   // inflows
                animateValue("kpi2", 0, outflows, 1200, true);  // outflows
                animateValue("kpi3", 0, fulfillmentRate, 1200, false, true); // rate
            });

            // Reset values when modal closes (so it re-animates on reopen)
            dashboardModal.addEventListener("hidden.bs.modal", function () {
                document.getElementById("kpi1").textContent = "₱0";
                document.getElementById("kpi2").textContent = "₱0";
                document.getElementById("kpi3").textContent = "0%";
            });
        });

        // === (Legacy) Example lightbox with prev/next — not used by current gallery ===
        (function () {
            const modalEl = document.getElementById('lightboxModal');
            if (!modalEl) return;

            const imgEl = document.getElementById('lightboxImage');
            const titleEl = document.getElementById('lightboxTitle');
            const capEl = document.getElementById('lightboxCaption');
            const tagEl = document.getElementById('lightboxTag');
            const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);

            const items = Array.from(document.querySelectorAll('.gallery-item'));
            let current = 0;

            function openAt(index) {
                const it = items[index];
                current = index;
                imgEl.src = it.querySelector('img').src;
                imgEl.alt = it.dataset.title || '';
                titleEl.textContent = it.dataset.title || 'Story';
                capEl.textContent = it.dataset.caption || '';
                tagEl.textContent = (it.dataset.category || '').replace(/^\w/, c => c.toUpperCase());
                bsModal.show();
            }

            document.querySelectorAll('[data-open-lightbox]').forEach(btn => {
                btn.addEventListener('click', e => {
                    const card = e.currentTarget.closest('.gallery-item');
                    const idx = items.indexOf(card);
                    if (idx >= 0) openAt(idx);
                });
            });

            modalEl.querySelector('.lightbox-prev')?.addEventListener('click', () => {
                current = (current - 1 + items.length) % items.length;
                openAt(current);
            });
            modalEl.querySelector('.lightbox-next')?.addEventListener('click', () => {
                current = (current + 1) % items.length;
                openAt(current);
            });

            // keyboard navigation
            modalEl.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') modalEl.querySelector('.lightbox-prev')?.click();
                if (e.key === 'ArrowRight') modalEl.querySelector('.lightbox-next')?.click();
            });
        })();
    
        // Smooth scroll with fixed-offset + collapse on mobile
(function () {
  const OFFSET = 100; // keep in sync with data-bs-offset & CSS scroll-margin-top
  const links = document.querySelectorAll('#mainNav .nav-link[href^="#"]');
  const navCollapseEl = document.getElementById('navContent');
  const navCollapse = navCollapseEl ? bootstrap.Collapse.getOrCreateInstance(navCollapseEl, { toggle: false }) : null;

  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const targetSel = a.getAttribute('href');
      const target = targetSel ? document.querySelector(targetSel) : null;
      if (!target) return; // let browser handle if not an in-page id

      e.preventDefault();

      // precise scroll position accounting for fixed nav
      const y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // collapse mobile menu after click
      if (navCollapse && window.getComputedStyle(navCollapseEl).display !== 'none') {
        navCollapse.hide();
      }
    });
  });
})();

// Robust smooth scroll that waits for mobile menu to collapse, and uses live nav height
(function () {
  const nav = document.getElementById('mainNav');
  const collapseEl = document.getElementById('navContent');
  const collapse = collapseEl ? bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }) : null;

  function getOffset() {
    // Add a little breathing room under the nav
    return (nav ? nav.offsetHeight : 0) + 16;
  }

  // Keep CSS scroll-margin-top in sync (if you added that CSS helper)
  function syncScrollMarginTop() {
    document.documentElement.style.setProperty('--nav-offset', getOffset() + 'px');
  }
  window.addEventListener('resize', syncScrollMarginTop);
  window.addEventListener('load', syncScrollMarginTop);
  syncScrollMarginTop();

  document.querySelectorAll('#mainNav .nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const sel = link.getAttribute('href');
      const target = sel ? document.querySelector(sel) : null;
      if (!target) return; // not an in-page anchor—let browser handle
      e.preventDefault();

      const doScroll = () => {
        const y = target.getBoundingClientRect().top + window.pageYOffset - getOffset();
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      // If mobile menu is open, wait for it to finish collapsing before scrolling
      const isExpanded = collapseEl && collapseEl.classList.contains('show');
      if (collapse && isExpanded) {
        const onHidden = () => {
          collapseEl.removeEventListener('hidden.bs.collapse', onHidden);
          // nav height changed after collapse → recompute offset then scroll
          syncScrollMarginTop();
          doScroll();
        };
        collapseEl.addEventListener('hidden.bs.collapse', onHidden);
        collapse.hide();
      } else {
        // Desktop or menu already closed
        doScroll();
      }
    });
  });
})();


document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault(); // prevent form from refreshing

  // Optional: get form values (for later validation)
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  // Simulate login check
  if (email && password) {
    // ✅ Redirect to the user dashboard page
    window.location.href = "userdashboard.html";
  } else {
    alert("Please enter valid credentials");
  }
});