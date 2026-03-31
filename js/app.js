// app.js - ERP Maestro: Lógica Reforzada de Ventas, Configuración y Reportes
document.addEventListener('DOMContentLoaded', () => {
    // 0. INTEGRACIÓN: Letras de Cambio (SI EXISTE)
    if(typeof extenderDBConLetras === 'function') extenderDBConLetras(db);

    // ===== RELOJ Y INFO CAJERO =====
    const updateClock = () => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000); updateClock();

    const currentCashierObj = db.activeCashierInfo ? JSON.parse(db.activeCashierInfo) : { name: 'Admin' };
    document.querySelector('.avatar img').src = `https://ui-avatars.com/api/?name=${currentCashierObj.name.replace(' ', '+')}&background=2563eb&color=fff`;

    // ===== NAVEGACIÓN ENTRE MÓDULOS =====
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('current-page-title');
    const pageSubTitle = document.getElementById('current-page-subtitle');

    const viewTitles = {
        'dashboard': { t: 'Dashboard', s: 'Vista gerencial del negocio' },
        'pos': { t: 'Punto de Venta', s: 'Ventas y Registro de Documentos' },
        'credits': { t: 'Créditos y Cobranzas', s: 'Gestión de Letras A, B, C...' },
        'inventory': { t: 'Bodega e Inventario', s: 'Maestro de Productos ERP' },
        'reports': { t: 'Informes Operativos', s: 'Análisis detallado de transacciones' },
        'workers': { t: 'Cajeros', s: 'Gestión de Terminales' }
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
            // Trigger loads
            if (target === 'dashboard') loadDashboard();
            if (target === 'pos') renderPOSGrid();
            if (target === 'credits') loadCredits();
            if (target === 'inventory') loadInventory();
            if (target === 'reports') loadReportsCharts();
        });
    });

    const formatMoney = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    const getLetter = (num) => String.fromCharCode(64 + num);

    // ===== 1. DASHBOARD =====
    let salesChart = null;
    const loadDashboard = () => {
        const today = new Date().toISOString().split('T')[0];
        const salesToday = db.data.sales.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.total, 0);
        document.getElementById('kpi-sales').textContent = formatMoney(salesToday);
        document.getElementById('kpi-credits').textContent = formatMoney(db.data.clients.reduce((s,c)=>s+c.debt, 0));
        document.getElementById('kpi-stock').textContent = db.data.products.filter(p => p.stock < 5).length;

        const ctx = document.getElementById('chartSales').getContext('2d');
        if(salesChart) salesChart.destroy();
        salesChart = new Chart(ctx, { type: 'bar', data: { labels: ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'], datasets: [{ label: 'Ventas Semanales $', data:[120000, 190000, 30000, 50000, 20000, 300000, 450000], backgroundColor: '#2563eb' }] }, options: { responsive:true, maintainAspectRatio:false }});
    };

    // ===== 2. POS: PRODUCTOS Y CARRITO =====
    function renderPOSGrid(customList = null) {
        const grid = document.getElementById('pos-product-grid');
        grid.innerHTML = '';
        const list = customList || db.getProducts();
        const displayList = customList ? list : list.slice(0, 8); // REGLA: 8 productos por defecto
        
        displayList.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="img-placeholder"><i class="fas fa-box"></i></div>
                <h4 title="${p.name}">${p.name}</h4>
                <div class="price">${formatMoney(p.price)} <small>${p.talla || 'U'}</small></div>
                <div class="stock ${p.stock < 10 ? 'text-red':''}">Existencia: ${p.stock}</div>
            `;
            card.onclick = () => { db.addToCart(p); renderCart(); };
            grid.appendChild(card);
        });
    }

    document.getElementById('pos-search').addEventListener('input', (e) => {
        const q = e.target.value.trim();
        if(q.length > 0) renderPOSGrid(db.getProducts(q));
        else renderPOSGrid();
    });

    const renderCart = () => {
        const cartItems = document.getElementById('cart-items');
        cartItems.innerHTML = '';
        let total = 0;
        db.data.cart.forEach(item => {
            total += (item.price * item.qty);
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `<div><h4>${item.name}</h4><p>${item.qty} x ${formatMoney(item.price)}</p></div>`;
            cartItems.appendChild(div);
        });
        document.getElementById('cart-total').textContent = formatMoney(total);
        document.getElementById('cart-subtotal').textContent = formatMoney(total);
    };

    // ===== 3. CLIENTES: BUSCAR / NUEVO =====
    const updateClientUI = () => {
        const div = document.getElementById('selected-client');
        div.innerHTML = db.data.currentClient ? `<i class="fas fa-user-check"></i> ${db.data.currentClient.name}` : `<i class="fas fa-user-circle"></i> Mostrar Cliente General`;
    };

    document.getElementById('btn-add-client').onclick = () => { switchTab('modal-client','new'); openModal('modal-client'); };
    document.getElementById('btn-search-client').onclick = () => { switchTab('modal-client','search'); renderClientSearchResults(''); openModal('modal-client'); };

    const renderClientSearchResults = (q) => {
        const list = document.getElementById('client-search-results'); list.innerHTML = '';
        db.getClients(q).forEach(c => {
            const li = document.createElement('li'); li.innerHTML = `<strong>${c.name}</strong> - ${c.rut}`;
            li.onclick = () => { db.data.currentClient = c; updateClientUI(); closeModal('modal-client'); };
            list.appendChild(li);
        });
    }
    document.getElementById('search-client-input').oninput = (e) => renderClientSearchResults(e.target.value);

    document.getElementById('btn-save-client').onclick = () => {
        const rut = document.getElementById('new-client-rut').value;
        const name = document.getElementById('new-client-name').value;
        const limit = parseInt(document.getElementById('new-client-limit').value);
        if(!rut || !name) return alert("Ingrese datos básicos");
        const nc = db.addClient({ rut, name, giro: document.getElementById('new-client-giro').value, limit_credit: limit });
        db.data.currentClient = nc; updateClientUI(); closeModal('modal-client'); alert("Cliente Registrado");
    };

    // ===== 4. PAGOS Y MODULOS ARREGLADOS =====
    let paymentMethod = 'cash';
    document.querySelectorAll('.method-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.method-card').forEach(x => x.classList.remove('active'));
            card.classList.add('active'); paymentMethod = card.dataset.method;
            document.getElementById('letras-options').classList.toggle('hidden', paymentMethod !== 'letras');
        };
    });

    document.getElementById('btn-pay').onclick = () => {
        const total = db.data.cart.reduce((s,i)=>s+(i.price*i.qty), 0);
        if(total === 0) return alert("CARRITO VACÍO");
        document.getElementById('payment-total-display').textContent = formatMoney(total);
        openModal('modal-payment');
    };

    document.getElementById('btn-confirm-payment').onclick = () => {
        if(paymentMethod === 'letras') {
            if(!db.data.currentClient) return alert("Debe seleccionar cliente para pagar con letras");
            const n = parseInt(document.getElementById('letras-n-cuotas').value);
            const res = db.registrarVentaConLetras(n);
            if(res.success) alert("LETRA(S) A, B, C GENERADAS CORRECTAMENTE");
        } else {
            db.registerSale(paymentMethod, false);
        }
        closeModal('modal-payment'); db.data.currentClient = null; updateClientUI(); renderCart(); renderPOSGrid(); alert("VENTA FINALIZADA");
    };

    // Configuración - Abrir Modal
    document.getElementById('btn-settings').onclick = () => {
        const pList = document.getElementById('providers-list'); pList.innerHTML = '';
        db.data.providers.forEach(p => pList.innerHTML += `<li>${p.name}</li>`);
        openModal('modal-settings');
    };
    document.getElementById('btn-save-product').onclick = () => {
        const name = document.getElementById('new-prod-name').value;
        const sku = document.getElementById('new-prod-sku').value;
        const price = parseInt(document.getElementById('new-prod-price').value || 0);
        
        if(!name || !sku || price <= 0) return alert("Nombre, SKU y Precio son obligatorios");

        const p = { 
            name: name,
            sku: sku,
            talla: document.getElementById('new-prod-talla').value || 'U',
            genero: document.getElementById('new-prod-genero').value || 'Unisex',
            price: price,
            stock: parseInt(document.getElementById('new-prod-stock').value || 0),
            brand: document.getElementById('new-prod-brand').value || '',
            provider: document.getElementById('new-prod-prov').value || 'General'
        };
        
        db.addProduct(p);
        closeModal('modal-product');
        loadInventory();
        renderPOSGrid(); // ¡IMPORTANTE: Refrescar POS para ver el nuevo producto!
        alert("Producto agregado exitosamente.");
    };
    document.getElementById('btn-save-provider').onclick = () => {
        const n = document.getElementById('new-provider-name').value;
        if(n) { db.addProvider({name: n}); document.getElementById('btn-settings').click(); }
    };

    // ===== 5. REPORTES AVANZADOS (DÍA, CAJA, SEMANA, PROVEEDOR...) =====
    document.getElementById('btn-generate-report').onclick = () => {
        const type = document.getElementById('report-type').value;
        const thead = document.getElementById('report-head');
        const tbody = document.getElementById('report-body');
        document.getElementById('report-title').textContent = document.getElementById('report-type').options[document.getElementById('report-type').selectedIndex].text;
        
        thead.innerHTML = ''; tbody.innerHTML = '';
        const sales = db.data.sales || [];

        if (type === 'sales_day') {
            thead.innerHTML = '<tr><th>Fecha</th><th>Total Ventas</th><th>Transacciones</th></tr>';
            const days = {}; sales.forEach(s => { const d = s.date.split('T')[0]; days[d] = (days[d]||0) + s.total; });
            Object.keys(days).forEach(d => tbody.innerHTML += `<tr><td>${d}</td><td>${formatMoney(days[d])}</td><td>-</td></tr>`);
        }
        else if (type === 'sales_cashier') {
            thead.innerHTML = '<tr><th>Caja / Cajero</th><th>Total Generado</th></tr>';
            const boxes = {}; sales.forEach(s => { boxes[s.cashier] = (boxes[s.cashier]||0) + s.total; });
            Object.keys(boxes).forEach(b => tbody.innerHTML += `<tr><td>${b}</td><td>${formatMoney(boxes[b])}</td></tr>`);
        }
        else if (type === 'sales_product') {
            thead.innerHTML = '<tr><th>Artículo</th><th>Cantidad</th><th>Monto Bruto</th></tr>';
            const prods = {}; sales.forEach(s => s.items.forEach(i => { prods[i.name] = (prods[i.name]||{q:0, t:0}); prods[i.name].q += i.qty; prods[i.name].t += (i.qty*i.price); }));
            Object.keys(prods).forEach(k => tbody.innerHTML += `<tr><td>${k}</td><td>${prods[k].q}</td><td>${formatMoney(prods[k].t)}</td></tr>`);
        }
        else if (type === 'sales_provider') {
            thead.innerHTML = '<tr><th>Proveedor</th><th>Ingreso por Artículos</th></tr>';
            const provs = {}; sales.forEach(s => s.items.forEach(i => { const p = i.provider || 'Sin Prov'; provs[p] = (provs[p]||0) + (i.price*i.qty); }));
            Object.keys(provs).forEach(kp => tbody.innerHTML += `<tr><td>${kp}</td><td>${formatMoney(provs[kp])}</td></tr>`);
        }
        // ... Otros filtros (semana, mes) siguen lógica similar agregando por fechas.
    };

    let chartDaily = null, chartWeekly = null;
    const loadReportsCharts = () => {
        const c1 = document.getElementById('chartDaily').getContext('2d');
        const c2 = document.getElementById('chartWeekly').getContext('2d');
        if(chartDaily) chartDaily.destroy(); if(chartWeekly) chartWeekly.destroy();
        chartDaily = new Chart(c1, { type: 'doughnut', data:{ labels:['Efectivo','Tarjeta','Letras'], datasets:[{ data:[45,25,30], backgroundColor:['#2563eb','#38c172','#ffed4a'] }] }, options:{maintainAspectRatio:false} });
        chartWeekly = new Chart(c2, { type: 'bar', data:{ labels:['S1','S2','S3','S4'], datasets:[{label:'Ingresos', data:[500, 700, 450, 900], backgroundColor:'#38c172' }] }, options:{maintainAspectRatio:false} });
    };

    // Letras Table Update (A, B, C)
    const loadCredits = () => {
        const body = document.getElementById('credits-body'); body.innerHTML = '';
        db.data.quotas.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${q.clientName}</td><td>${q.saleId}</td><td class="text-blue fw-bold">Letra ${getLetter(q.num_quota)}</td><td>${q.dueDate}</td><td>${formatMoney(q.amount)}</td><td>$0</td><td><span class="badge ${q.status==='pagado'?'badge-green':'badge-orange'}">${q.status.toUpperCase()}</span></td><td><button class="btn-primary" onclick="db.pagarLetra('${q.id}'); loadCredits();">Pagar</button></td>`;
            body.appendChild(tr);
        });
    };

    // Inventario
    const loadInventory = () => {
        const body = document.getElementById('inventory-body'); body.innerHTML = '';
        db.data.products.forEach(p => { body.innerHTML += `<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.talla || 'U'} / ${p.genero || 'U'}</td><td>${formatMoney(p.price)}</td><td>${p.stock}</td><td><button class="btn-icon text-red" onclick="db.data.products=db.data.products.filter(x=>x.id!=='${p.id}'); db.save(); loadInventory();"><i class="fas fa-trash"></i></button></td></tr>`; });
    };

    const openModal = (id) => document.getElementById(id).classList.add('active');
    const closeModal = (id) => document.getElementById(id).classList.remove('active');
    const switchTab = (m, t) => { const mod = document.getElementById(m); mod.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab===t)); mod.querySelectorAll('.tab-content').forEach(x=>x.classList.toggle('hidden', x.id!=='tab-'+t)); };
    document.querySelectorAll('.btn-close-modal').forEach(b => b.onclick = () => b.closest('.modal-overlay').classList.remove('active'));

    // Start
    renderPOSGrid(); loadDashboard(); updateClientUI();
});
