// app.js - Lógica ERP Premium con Gráficos y Búsqueda Avanzada
document.addEventListener('DOMContentLoaded', () => {
    // ===== SYSTEM CLOCK =====
    const updateClock = () => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000);
    updateClock();

    const currentCashierName = db.activeCashierInfo ? JSON.parse(db.activeCashierInfo).name : 'Admin';
    document.querySelector('.avatar img').src = `https://ui-avatars.com/api/?name=${currentCashierName.replace(' ', '+')}&background=2563eb&color=fff`;

    // ===== ROUTING (Views) =====
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('current-page-title');
    const pageSubTitle = document.getElementById('current-page-subtitle');

    const viewTitles = {
        'dashboard': { t: 'Dashboard', s: 'Resumen genérico del negocio' },
        'pos': { t: 'Punto de Venta', s: 'Ventas y Emisión de Documentos' },
        'inventory': { t: 'Bodega e Inventario', s: 'Maestro de Productos y Ajustes' },
        'people': { t: 'Maestro de Personas', s: 'Gestión de Clientes, Proveedores y Personal' },
        'credits': { t: 'Gestión de Crédito', s: 'Ctas. Ctes. y Cobranza de Cuotas' },
        'workers': { t: 'Cajeros', s: 'Instancias de Terminal Activas' },
        'reports': { t: 'Reportes ERP', s: 'Informes de Gestión y Exportación' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            if (viewTitles[target]) {
                pageTitle.textContent = viewTitles[target].t;
                pageSubTitle.textContent = viewTitles[target].s;
            }
            if (target === 'dashboard') loadDashboard();
            if (target === 'inventory') loadInventory();
            if (target === 'people') loadPeople();
            if (target === 'credits') loadCredits();
            if (target === 'workers') loadWorkers();
            if (target === 'reports') {
                document.getElementById('btn-generate-report').click();
                loadReportsCharts();
            }
        });
    });

    const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    const getLetter = (num) => String.fromCharCode(64 + num);

    // ===== 1. DASHBOARD & KPIs =====
    let dashboardChart = null;
    const loadDashboard = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = db.data.sales.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.total, 0);
        document.getElementById('kpi-sales').textContent = formatMoney(todaySales);
        document.getElementById('kpi-credits').textContent = formatMoney(db.data.people.reduce((s,p)=>s+p.debt, 0));
        document.getElementById('kpi-stock').textContent = db.data.products.filter(p => p.stock <= p.stockCrit).length;

        // Dashboard Small Chart
        const ctx = document.getElementById('chartSales').getContext('2d');
        if(dashboardChart) dashboardChart.destroy();
        dashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['L','M','X','J','V','S','D'],
                datasets: [{ label: 'Ventas Semanales', data: [120, 190, 300, 500, 200, 300, 450], borderColor:'#1a73e8', tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    // ===== 2. POS (VENTAS & PRODUCTOS) =====
    const renderPOSProducts = (products = [], isSearch = false) => {
        const grid = document.getElementById('pos-product-grid');
        grid.innerHTML = '';
        
        // Regla: 8 productos por defecto, o todos si busca
        const list = isSearch ? products : (products.length > 0 ? products.slice(0, 8) : db.getProducts().slice(0, 8));

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="img-placeholder"><i class="fas fa-box"></i></div>
                <h4 title="${p.name}">${p.name}</h4>
                <div class="price">${formatMoney(p.price)}</div>
                <div class="stock ${p.stock <= p.stockCrit ? 'text-red' : ''}">Uds: ${p.stock}</div>
            `;
            card.addEventListener('click', () => {
                db.addToCart(p);
                renderCart();
            });
            grid.appendChild(card);
        });
    };

    document.getElementById('pos-search').addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            const filtered = db.getProducts(query);
            renderPOSProducts(filtered, true);
        } else {
            renderPOSProducts();
        }
    });

    const renderCart = () => {
        const items = document.getElementById('cart-items');
        items.innerHTML = '';
        if (db.data.cart.length === 0) {
            items.innerHTML = '<div class="empty-cart-msg">No hay productos en la orden.</div>';
            document.getElementById('cart-total').textContent = '$0';
            return;
        }

        let total = 0;
        db.data.cart.forEach(item => {
            total += item.price * item.qty;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info"><h4>${item.name}</h4><p>${formatMoney(item.price)} x ${item.qty}</p></div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
            `;
            items.appendChild(div);
        });
        document.getElementById('cart-subtotal').textContent = formatMoney(total);
        document.getElementById('cart-total').textContent = formatMoney(total);
    };

    window.updateQty = (id, n) => {
        const item = db.data.cart.find(i => i.id === id);
        if(item) {
            db.updateCartQty(id, item.qty + n);
            renderCart();
        }
    }

    document.getElementById('btn-pay').addEventListener('click', () => {
        if(db.data.cart.length === 0) return alert("Carrito Vacío");
        const total = db.data.cart.reduce((s, i) => s + (i.price * i.qty), 0);
        document.getElementById('payment-total-display').textContent = formatMoney(total);
        openModal('modal-payment');
    });

    document.getElementById('btn-confirm-payment').addEventListener('click', () => {
        const method = document.querySelector('.method-card.active').dataset.method;
        const creditParams = method === 'credit' ? { installments: parseInt(document.getElementById('credit-installments').value) } : null;
        if(db.registerSale(method, false, creditParams)) {
            closeModal('modal-payment');
            renderCart();
            renderPOSProducts();
            db.data.currentClient = null;
            updateClientUI();
            alert("Venta Finalizada Exitosamente");
        }
    });

    // ===== 3. AUTOTEXTO & FOLIOS (Búsqueda Global) =====
    const globalSearch = document.getElementById('global-search');
    const globalDropdown = document.getElementById('global-search-results');

    globalSearch.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if(q.length < 1) return globalDropdown.classList.add('hidden');
        
        globalDropdown.innerHTML = '';
        // Buscar en Folios
        const matchingSales = db.data.sales.filter(s => s.id.toLowerCase().includes(q));
        matchingSales.slice(0, 5).forEach(s => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerHTML = `<i class="fas fa-file-invoice"></i> Folio: ${s.id} | ${formatMoney(s.total)}`;
            div.onclick = () => { alert(`Venta Folio ${s.id}\nTotal: ${s.total}\nMétodo: ${s.method}`); globalDropdown.classList.add('hidden'); };
            globalDropdown.appendChild(div);
        });
        if(matchingSales.length > 0) globalDropdown.classList.remove('hidden');
        else globalDropdown.classList.add('hidden');
    });

    // ===== 4. CLIENT GENERAL ICON =====
    document.getElementById('btn-add-client').addEventListener('click', () => {
        // Enlazar al modal de creación de persona
        openModal('modal-person');
    });

    const updateClientUI = () => {
        const div = document.getElementById('selected-client');
        if(db.data.currentClient) div.innerHTML = `<i class="fas fa-user-check"></i> ${db.data.currentClient.name}`;
        else div.innerHTML = `<i class="fas fa-user-circle"></i> Mostrar Cliente General`;
    };

    // Client Search logic
    document.getElementById('btn-search-client').addEventListener('click', () => openModal('modal-client'));
    document.getElementById('search-client-input').addEventListener('input', (e) => {
        const q = e.target.value.trim();
        const results = document.getElementById('client-search-results');
        results.innerHTML = '';
        db.getPeople(q, 'client').forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${c.name}</strong> - ${c.rut}`;
            li.onclick = () => { db.data.currentClient = c; updateClientUI(); closeModal('modal-client'); };
            results.appendChild(li);
        });
    });

    // ===== 5. CREDITOS & LETRAS (A, B, C) =====
    const loadCredits = () => {
        const body = document.getElementById('credits-body');
        body.innerHTML = '';
        db.data.quotas.forEach(q => {
            const tr = document.createElement('tr');
            // Convertir número cuota a Letra (1->A, 2->B...)
            const quotaLabel = `Letra ${getLetter(q.num_quota)}`;
            tr.innerHTML = `
                <td>${q.personName}</td>
                <td>${q.saleId}</td>
                <td class="fw-bold text-blue">${quotaLabel}</td>
                <td>${q.dueDate}</td>
                <td>${formatMoney(q.amount)}</td>
                <td>$0</td>
                <td><span class="badge ${q.status === 'pagado' ? 'badge-green' : 'badge-orange'}">${q.status.toUpperCase()}</span></td>
                <td><button class="btn-primary" onclick="payLetter('${q.id}')">Pagar</button></td>
            `;
            body.appendChild(tr);
        });
    };

    window.payLetter = (id) => {
        const q = db.data.quotas.find(x => x.id === id);
        if(q && q.status !== 'pagado') {
            q.status = 'pagado';
            const person = db.data.people.find(p => p.id === q.personId);
            if(person) person.debt -= q.amount;
            db.save();
            loadCredits();
        }
    };

    // ===== 6. REPORTS & CHARTS (DIARIO/SEMANAL) =====
    let chartDaily = null, chartWeekly = null;
    const loadReportsCharts = () => {
        const ctxD = document.getElementById('chartDaily').getContext('2d');
        const ctxW = document.getElementById('chartWeekly').getContext('2d');
        
        if(chartDaily) chartDaily.destroy();
        if(chartWeekly) chartWeekly.destroy();

        chartDaily = new Chart(ctxD, {
            type: 'doughnut',
            data: {
                labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'],
                datasets: [{ data: [300000, 150000, 50000, 120000], backgroundColor: ['#2563eb', '#38c172', '#ffed4a', '#e3342f'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        chartWeekly = new Chart(ctxW, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                datasets: [{ label: 'Ventas por Día', data: [75000, 89000, 120000, 150000, 240000, 310000, 180000], backgroundColor: '#2563eb' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    // ===== OTHER CORE LOGIC (Personas, Inventory, Workers) =====
    // Inventory
    const loadInventory = () => {
        const body = document.getElementById('inventory-body');
        body.innerHTML = '';
        db.getProducts().forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.sku}</td><td>${p.name}</td><td>Maestro</td>
                <td>${formatMoney(p.price)}</td><td>${p.stock}</td>
                <td><span class="badge ${p.active ? 'badge-green':'badge-red'}">${p.active?'Act':'Inac'}</span></td>
                <td><button class="btn-icon text-red" onclick="deleteProd('${p.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            body.appendChild(tr);
        });
    };

    const loadPeople = () => {
        const body = document.getElementById('people-body');
        body.innerHTML = '';
        db.data.people.forEach(p => {
            const roles = p.isClient ? 'Cliente ' : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${p.rut}</td><td><strong>${p.name}</strong></td><td>${p.giro}</td><td>${p.phone}</td><td>${roles}</td><td><span class="badge badge-green">HABIL</span></td><td>#</td>`;
            body.appendChild(tr);
        });
    }

    // Modal Helpers
    const openModal = (id) => document.getElementById(id).classList.add('active');
    const closeModal = (id) => document.getElementById(id).classList.remove('active');
    document.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('active')));
    
    // Initial State
    document.querySelector('.nav-item[data-target="pos"]').click();
    renderPOSProducts();
    updateClientUI();
});
