// app.js - ERP MrPOS (6 Prod, Autocomplete, Maestro Premium, PWA)
document.addEventListener('DOMContentLoaded', () => {

    // 0. INTEGRACIÓN: PWA (Instalar en Android/Móvil)
    let deferredPrompt;
    const btnPwa = document.getElementById('btn-pwa-install');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); deferredPrompt = e;
        if(btnPwa) btnPwa.classList.remove('hidden');
    });
    if(btnPwa) btnPwa.onclick = () => {
        if(!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
            if(choice.outcome === 'accepted') btnPwa.classList.add('hidden');
            deferredPrompt = null;
        });
    };

    // Registro de Service Worker
    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Error:', err));
    }

    // Inicializar módulo de Letras
    if(typeof extenderDBConLetras === 'function') extenderDBConLetras(db);

    const updateClock = () => {
        const now = new Date();
        const clockEl = document.getElementById('clock');
        if(clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000); updateClock();

    const currentCashierObj = db.activeCashierInfo ? JSON.parse(db.activeCashierInfo) : { name: 'Admin' };
    const avatarImg = document.querySelector('.avatar img');
    if(avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${currentCashierObj.name.replace(' ', '+')}&background=2563eb&color=fff`;

    // ===== 1. MODULAR SEARCH / AUTOCOMPLETE =====
    const setupAutocomplete = (inputId, dropdownId, searchFn, selectFn, displayFn) => {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);
        if(!input || !dropdown) return;
        input.addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            if(q.length < 1) return dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            const results = searchFn(q);
            if(results.length === 0) return dropdown.classList.add('hidden');
            results.slice(0, 5).forEach(r => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.innerHTML = displayFn(r);
                div.onclick = () => { selectFn(r); dropdown.classList.add('hidden'); };
                dropdown.appendChild(div);
            });
            dropdown.classList.remove('hidden');
        });
        input.onfocus = () => { if(input.value.length > 0) input.dispatchEvent(new Event('input')); };
    };

    // Global Search
    setupAutocomplete('global-search', 'global-search-results', 
        (q) => db.data.sales.filter(s => s.id.toLowerCase().includes(q) || (s.clientId && s.clientId.toLowerCase().includes(q))),
        (s) => alert(`Información: ${s.id}\nFolio: ${s.id}\nTotal: ${s.total}`),
        (s) => `<span><strong>${s.id}</strong> - ${s.total}</span>`
    );

    // POS Search
    setupAutocomplete('pos-search', 'pos-search-results',
        (q) => db.getProducts(q),
        (p) => { db.addToCart(p); window.renderCart(); },
        (p) => `<span><strong>${p.name}</strong> (${p.sku})</span>`
    );

    // Client modal logic
    setupAutocomplete('search-client-input', 'client-search-results', 
       (q) => db.getClients(q),
       (c) => { db.data.currentClient = c; updateClientUI(); closeModal('modal-client'); },
       (c) => `<span><strong>${c.name}</strong> (${c.rut})</span>`
    );

    // ===== 2. POS: 6 FAVORITES & CART =====
    window.renderPOSGrid = (customList = null) => {
        const grid = document.getElementById('pos-product-grid');
        if(!grid) return; grid.innerHTML = '';
        const list = customList || db.getProducts();
        
        // REGLA: Mostrar SOLO 6 productos si no es búsqueda custom
        const displayList = customList ? list : list.slice(0, 6);
        
        displayList.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<div class="img-placeholder"><i class="fas fa-box"></i></div><h4>${p.name}</h4><div class="price">$${p.price}</div><div class="stock ${p.stock < 10?'text-red':''}">S: ${p.stock}</div>`;
            card.onclick = () => { db.addToCart(p); renderCart(); };
            grid.appendChild(card);
        });
    }

    const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    const getLetter = (num) => String.fromCharCode(64 + (num || 1));

    window.renderCart = () => {
        const items = document.getElementById('cart-items'); if(!items) return; items.innerHTML = '';
        db.data.cart.forEach(it => {
            const div = document.createElement('div'); div.className = 'cart-item';
            div.innerHTML = `<div><h4>${it.name}</h4><p>${it.qty} x ${formatMoney(it.price)}</p></div><button class="btn-icon text-red" onclick="window.removeFromCart('${it.id}')"><i class="fas fa-minus-circle"></i></button>`;
            items.appendChild(div);
        });
        document.getElementById('cart-total').textContent = formatMoney(db.data.cart.reduce((s,i)=>s+(i.price*i.qty), 0));
    };

    window.removeFromCart = (id) => { db.removeFromCart(id); renderCart(); };

    // ===== 3. MAESTRO PRODUCTOS (REDISEÑADO) =====
    window.openMaestro = () => {
        const inputs = document.querySelectorAll('#modal-product input, #modal-product textarea, #modal-product select');
        inputs.forEach(i => { if(i.type==='checkbox') i.checked=true; else i.value=''; });
        openModal('modal-product');
    };

    document.getElementById('btn-save-product').onclick = () => {
        const p = {
            sku: document.getElementById('m-codigo').value, name: document.getElementById('m-desc').value,
            category: document.getElementById('m-cat').value, family: document.getElementById('m-fam').value,
            type: document.getElementById('m-tipo').value, obs: document.getElementById('m-obs').value,
            price: parseInt(document.getElementById('m-pventa').value) || 0,
            margin: parseInt(document.getElementById('m-margen').value) || 0,
            uoferta: parseInt(document.getElementById('m-uoferta').value) || 0,
            poferta: parseInt(document.getElementById('m-poferta').value) || 0,
            tax: document.getElementById('m-impto').value,
            uvta: document.getElementById('m-uvta').value,
            ucaja: document.getElementById('m-ucaja').value,
            scrit: parseInt(document.getElementById('m-scrit').value) || 5,
            stock: parseInt(document.getElementById('m-sact').value) || 0,
            active: document.getElementById('m-activo').checked,
            iva: document.getElementById('m-iva').checked
        };
        if(!p.sku || !p.name) return alert("Complete los datos requeridos por MrPOS.");
        db.addProduct(p); closeModal('modal-product'); loadInventory(); renderPOSGrid();
        alert("¡M Maestro de Productos actualizado!");
    };

    // ===== 4. WORKERS (CAJEROS) =====
    document.getElementById('btn-new-worker').onclick = () => openModal('modal-worker');
    document.getElementById('btn-create-worker').onclick = () => {
        const n = document.getElementById('new-worker-name').value;
        const p = document.getElementById('new-worker-pin').value;
        if(n && p) { db.addWorker({name: n, pin: p}); closeModal('modal-worker'); loadWorkers(); alert("Acceso concedido al cajero."); }
    };

    // ===== 5. SETTINGS & STOCK ADJ =====
    document.getElementById('btn-settings').onclick = () => {
        const l = document.getElementById('providers-list'); l.innerHTML = '';
        db.data.providers.forEach(p => l.innerHTML += `<li>${p.name}</li>`);
        const adj = document.getElementById('adj-product');
        adj.innerHTML = db.data.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        switchTab('modal-settings', 'providers'); openModal('modal-settings');
    };
    document.getElementById('btn-save-provider').onclick = () => {
        const v = document.getElementById('new-provider-name').value;
        if(v) { db.addProvider({name: v}); document.getElementById('btn-settings').click(); }
    };
    document.getElementById('btn-save-stock-adj').onclick = () => {
        const id = document.getElementById('adj-product').value;
        const q = parseInt(document.getElementById('adj-stock-qty').value || 0);
        const p = db.data.products.find(x => x.id === id);
        if(p) { p.stock = q; db.save(); alert("S Stock General rectificado."); loadInventory(); renderPOSGrid(); }
    };

    // Other Nav and Refresh
    const updateClientUI = () => {
        const d = document.getElementById('selected-client');
        if(d) d.innerHTML = db.data.currentClient ? `<i class="fas fa-user-check"></i> ${db.data.currentClient.name}` : '<i class="fas fa-user-circle"></i> Cliente General';
    };
    document.getElementById('btn-pay').onclick = () => {
        const t = db.data.cart.reduce((s,i)=>s+(i.price*i.qty),0);
        if(t > 0) { document.getElementById('payment-total-display').textContent = formatMoney(t); openModal('modal-payment'); }
    };
    document.getElementById('btn-confirm-payment').onclick = () => {
        const m = document.querySelector('.method-card.active').dataset.method;
        if(m === 'letras') {
            if(!db.data.currentClient) return alert("Asigne cliente.");
            db.registrarVentaConLetras(parseInt(document.getElementById('letras-n-cuotas').value));
        } else {
            db.registerSale(m, false);
        }
        closeModal('modal-payment'); renderCart(); renderPOSGrid(); updateClientUI(); alert("VENTA FINALIZADA.");
    };

    // Navigation handles
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    navItems.forEach(item => {
        item.onclick = () => {
            const target = item.dataset.target;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            if(target === 'inventory') loadInventory();
            if(target === 'workers') loadWorkers();
            if(target === 'credits') loadCredits();
        };
    });

    window.loadInventory = () => {
        const b = document.getElementById('inventory-body'); b.innerHTML = '';
        db.data.products.forEach(p => b.innerHTML += `<tr><td>${p.sku}</td><td>${p.name}</td><td>${formatMoney(p.price)}</td><td>${p.stock}</td><td><button onclick="db.data.products=db.data.products.filter(x=>x.id!=='${p.id}');db.save();loadInventory();"><i class="fas fa-trash"></i></button></td></tr>`);
    };
    window.loadWorkers = () => {
        const b = document.getElementById('workers-body'); b.innerHTML = '';
        db.data.workers.forEach(w => b.innerHTML += `<tr><td>${w.id}</td><td>${w.name}</td><td>${w.pin}</td><td>${w.status}</td></tr>`);
    };
    window.loadCredits = () => {
        const b = document.getElementById('credits-body'); b.innerHTML = '';
        db.data.quotas.forEach(q => b.innerHTML += `<tr><td>${q.clientName}</td><td>${q.saleId}</td><td>Letra ${getLetter(q.num_quota)}</td><td>${formatMoney(q.amount)}</td><td>${q.status}</td><td><button onclick="window.payCredit('${q.id}')">Pagar</button></td></tr>`);
    };
    window.payCredit = (id) => { const q = db.data.quotas.find(x=>x.id===id); if(q){q.status='PAGADO';db.save();loadCredits();} };

    // Modal helpers
    window.openModal = (id) => document.getElementById(id).classList.add('active');
    window.closeModal = (id) => document.getElementById(id).classList.remove('active');
    window.switchTab = (m, t) => { 
        const mod = document.getElementById(m); mod.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab===t));
        mod.querySelectorAll('.tab-content').forEach(x=>x.classList.toggle('hidden', x.id!=='tab-'+t));
    };
    document.querySelectorAll('.btn-close-modal').forEach(b => b.onclick = () => b.closest('.modal-overlay').classList.remove('active'));
    document.getElementById('btn-open-new-product').onclick = () => openMaestro();

    // Start
    renderPOSGrid(); updateClientUI();
});
