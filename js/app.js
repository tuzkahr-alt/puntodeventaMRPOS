// app.js - Lógica de Interfaz de Usuario y Controladores

document.addEventListener('DOMContentLoaded', () => {
    // ===== SYSTEM CLOCK & CASHIER INFO =====
    const updateClock = () => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000);
    updateClock();

    const currentCashierName = db.activeCashierInfo ? JSON.parse(db.activeCashierInfo).name : 'Admin';
    document.querySelector('.avatar img').src = `https://ui-avatars.com/api/?name=${currentCashierName.replace(' ', '+')}&background=2563eb&color=fff`;

    // ===== ROUTING (Tabs) =====
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('current-page-title');
    const pageSubTitle = document.getElementById('current-page-subtitle');

    const viewTitles = {
        'dashboard': { t: 'Dashboard', s: 'Resumen general del negocio' },
        'pos': { t: 'Punto de Venta', s: 'Ventas y Preventas' },
        'credits': { t: 'Cobranzas y Créditos', s: 'Estado de cuenta, letras y abonos' },
        'inventory': { t: 'Inventario', s: `Gestión de productos. Caja Activa: ${currentCashierName}` },
        'workers': { t: 'Cajeros y Personal', s: 'Gestión de Instancias Aisladas' }
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

            // Refresh specific view data
            if (target === 'dashboard') loadDashboard();
            if (target === 'credits') loadCredits();
            if (target === 'inventory') loadInventory();
            if (target === 'workers') loadWorkers();
        });
    });

    // ===== RENDERERS =====
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const countDaysDelayed = (dueDate) => {
        const today = new Date();
        const dDate = new Date(dueDate);
        const diffTime = today - dDate;
        if (diffTime <= 0) return 0;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // 1. DASHBOARD & CHARTS
    let salesChart = null;

    const loadDashboard = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = db.data.sales.filter(s => s.date.startsWith(today) && s.status === 'finalizada').reduce((sum, s) => sum + s.total, 0);
        document.getElementById('kpi-sales').textContent = formatMoney(todaySales);

        const totalCredits = db.data.quotas.filter(q => q.status !== 'pagado').reduce((sum, q) => sum + q.amount, 0);
        document.getElementById('kpi-credits').textContent = formatMoney(totalCredits);

        const lowStock = db.data.products.filter(p => p.stock < 15).length;
        document.getElementById('kpi-stock').textContent = lowStock;

        // Alerts Table
        const alertsBody = document.getElementById('alerts-body');
        alertsBody.innerHTML = '';
        
        const pendingQuotas = db.data.quotas.filter(q => q.status !== 'pagado').sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        pendingQuotas.slice(0, 5).forEach(q => {
            const daysDelayed = countDaysDelayed(q.dueDate);
            const isMora = daysDelayed > 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${q.clientName}</td>
                <td>Cuota ${q.num_quota}/${q.total_quotas}</td>
                <td><span class="badge ${isMora ? 'badge-red' : 'badge-green'}">${isMora ? daysDelayed + ' días' : 'Al día'}</span></td>
                <td style="font-weight:bold">${formatMoney(q.amount)}</td>
            `;
            alertsBody.appendChild(tr);
        });

        // Setup Chart
        const prodAgg = {};
        db.data.sales.filter(s => s.status === 'finalizada').forEach(sale => {
            sale.items.forEach(item => {
                prodAgg[item.name] = (prodAgg[item.name] || 0) + item.qty;
            });
        });

        const sortedAgg = Object.entries(prodAgg).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const labels = sortedAgg.map(i => i[0]);
        const data = sortedAgg.map(i => i[1]);

        const ctx = document.getElementById('chartSales').getContext('2d');
        if(salesChart) salesChart.destroy();
        
        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: '#1a73e8',
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    // 2. POS
    const posProductGrid = document.getElementById('pos-product-grid');
    
    const renderPOSProducts = (products) => {
        posProductGrid.innerHTML = '';
        products.slice(0, 10).forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <div class="img-placeholder"><i class="fas fa-box"></i></div>
                <h4 title="${p.name}">${p.name.length > 20 ? p.name.substring(0, 20)+'...' : p.name}</h4>
                <div class="price">${formatMoney(p.price)}</div>
                <div class="stock ${p.stock <= 5 ? 'text-red' : ''}">Stock: ${p.stock}</div>
            `;
            div.addEventListener('click', () => {
                db.addToCart(p);
                renderCart();
            });
            posProductGrid.appendChild(div);
        });
    };

    const searchInput = document.getElementById('pos-search');
    const searchResults = document.getElementById('pos-search-results');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            searchResults.classList.add('hidden');
            renderPOSProducts(db.getProducts());
            return;
        }

        const products = db.getProducts(query);
        renderPOSProducts(products);
        
        searchResults.innerHTML = '';
        if (products.length > 0) {
            products.slice(0, 10).forEach(p => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.innerHTML = `<span><strong>${p.name}</strong> <small>(${p.sku})</small></span><span>${formatMoney(p.price)}</span>`;
                div.addEventListener('click', () => {
                    db.addToCart(p);
                    renderCart();
                    searchInput.value = '';
                    searchResults.classList.add('hidden');
                    renderPOSProducts(db.getProducts());
                    searchInput.focus();
                });
                searchResults.appendChild(div);
            });
            searchResults.classList.remove('hidden');
        } else {
            searchResults.classList.add('hidden');
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (!query) return;
            
            const products = db.getProducts(query);
            if (products.length > 0) {
                db.addToCart(products[0]);
                renderCart();
                searchInput.value = '';
                searchResults.classList.add('hidden');
                renderPOSProducts(db.getProducts());
                searchInput.focus();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar-modern')) {
            if(searchResults) searchResults.classList.add('hidden');
        }
    });

    const renderCart = () => {
        const cartItems = document.getElementById('cart-items');
        cartItems.innerHTML = '';
        
        if (db.data.cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart-msg">No hay productos en la orden.</div>';
            document.getElementById('cart-subtotal').textContent = '$0';
            document.getElementById('cart-total').textContent = '$0';
            return;
        }

        let total = 0;
        db.data.cart.forEach(item => {
            total += item.price * item.qty;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h4 title="${item.name}">${item.name.length > 15 ? item.name.substring(0, 15)+'...' : item.name}</h4>
                    <p>${formatMoney(item.price)} x ${item.qty}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                    <button class="btn-text" onclick="updateQty('${item.id}', -999)"><i class="fas fa-trash"></i></button>
                </div>
            `;
            cartItems.appendChild(div);
        });

        document.getElementById('cart-subtotal').textContent = formatMoney(total);
        document.getElementById('cart-total').textContent = formatMoney(total);
    };

    window.updateQty = (id, change) => {
        const item = db.data.cart.find(i => i.id === id);
        if(item) {
            db.updateCartQty(id, item.qty + change);
            renderCart();
        }
    };

    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        db.clearCart();
        renderCart();
    });

    const updateClientUI = () => {
        if(db.data.currentClient) {
            document.getElementById('selected-client').innerHTML = `<i class="fas fa-user-circle"></i> ${db.data.currentClient.name} (${db.data.currentClient.rut})`;
        } else {
            document.getElementById('selected-client').innerHTML = `<i class="fas fa-user-circle"></i> Cliente Genérico`;
        }
    };

    // 3. CREDITOS LÓGICA (LIVE SEARCH)
    const loadCredits = (query = '') => {
        const tBody = document.getElementById('credits-body');
        tBody.innerHTML = '';
        
        const filtered = db.data.quotas.filter(q => {
            if(!query) return true;
            return q.clientName.toLowerCase().includes(query.toLowerCase()) || q.clientRut.includes(query);
        });

        filtered.forEach(q => {
            const tr = document.createElement('tr');
            const isMora = q.status === 'mora' || countDaysDelayed(q.dueDate) > 0;
            
            tr.innerHTML = `
                <td><strong>${q.clientName}</strong><br><small>${q.clientRut}</small></td>
                <td>${q.saleId}</td>
                <td>${q.num_quota} / ${q.total_quotas}</td>
                <td class="${isMora ? 'text-red fw-bold' : ''}">${q.dueDate}</td>
                <td>${formatMoney(q.amount)}</td>
                <td>${formatMoney(q.interest)}</td>
                <td><span class="badge ${isMora ? 'badge-red' : (q.status === 'pagado' ? 'badge-green' : 'badge-orange')}">${isMora ? 'En Mora' : q.status.toUpperCase()}</span></td>
                <td>
                    ${q.status !== 'pagado' ? `<button class="btn-primary" onclick="payQuota('${q.id}')"><i class="fas fa-money-check-alt"></i> Pagar</button>` : '<i class="fas fa-check text-green"></i>'}
                </td>
            `;
            tBody.appendChild(tr);
        });
    };

    document.getElementById('credit-search').addEventListener('input', (e) => loadCredits(e.target.value));

    window.payQuota = (id) => {
        if(confirm('¿Confirmar pago de esta cuota? Esto actualizará el estado de cuenta.')) {
            const quota = db.data.quotas.find(q => q.id === id);
            if(quota) {
                quota.status = 'pagado';
                const client = db.data.clients.find(c => c.id === quota.clientId);
                if(client) client.debt -= quota.amount;
                db.save();
                loadCredits(document.getElementById('credit-search').value);
            }
        }
    };

    // 4. INVENTORY
    const loadInventory = () => {
        const body = document.getElementById('inventory-body');
        body.innerHTML = '';
        db.getProducts().forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.sku}</td>
                <td><strong>${p.name}</strong></td>
                <td><small>${p.brand || 'S/M'}</small></td>
                <td>${formatMoney(p.price)}</td>
                <td><span class="${p.stock <= 5 ? 'text-red fw-bold' : ''}">${p.stock} u.</span></td>
                <td><button class="btn-icon text-red" onclick="deleteProd('${p.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            body.appendChild(tr);
        });
    };
    
    window.deleteProd = (id) => {
        if(confirm('¿Eliminar producto?')) {
            db.data.products = db.data.products.filter(p => p.id !== id);
            db.save();
            loadInventory();
        }
    };

    // 5. WORKERS
    const loadWorkers = () => {
        const body = document.getElementById('workers-body');
        body.innerHTML = '';
        db.data.workers.forEach(w => {
            const isActiv = (w.id === db.activeCashier);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${w.id}</td>
                <td><strong>${w.name}</strong></td>
                <td><span class="badge ${isActiv ? 'badge-green' : 'badge-orange'}">${isActiv ? 'Activo' : 'Offline'}</span></td>
                <td>
                    ${!isActiv ? `<button class="btn-primary" onclick='window.switchWork(${JSON.stringify(w)})'>Log in</button>` : '<i class="fas fa-check"></i> Activo'}
                </td>
            `;
            body.appendChild(tr);
        });
    };

    window.switchWork = (w) => {
        const pin = prompt(`Ingrese PIN autorizador para ${w.name}:`);
        if(pin === w.pin) {
            db.switchCashier(w);
        } else {
            alert('PIN Incorrecto');
        }
    }


    // ===== MODALS LOGIC =====
    const openModal = (id) => document.getElementById(id).classList.add('active');
    const closeModal = (id) => document.getElementById(id).classList.remove('active');

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Nuevo Producto Modal
    document.getElementById('btn-open-new-product').addEventListener('click', () => openModal('modal-product'));
    document.getElementById('btn-save-product').addEventListener('click', () => {
        const pInfo = {
            name: document.getElementById('new-prod-name').value,
            sku: document.getElementById('new-prod-sku').value,
            price: parseInt(document.getElementById('new-prod-price').value, 10),
            stock: parseInt(document.getElementById('new-prod-stock').value, 10),
            brand: document.getElementById('new-prod-brand').value,
        };
        if(!pInfo.name || !pInfo.price) return alert("Faltan datos clave (Nombre/Precio)");
        db.addProduct(pInfo);
        closeModal('modal-product');
        loadInventory();
    });

    // Worker Modal
    document.getElementById('btn-new-worker').addEventListener('click', () => openModal('modal-worker'));
    document.getElementById('btn-create-worker').addEventListener('click', () => {
        const wInfo = {
            name: document.getElementById('new-worker-name').value,
            pin: document.getElementById('new-worker-pin').value || '1234'
        };
        if(!wInfo.name) return alert("Faltan datos del cajero");
        db.addWorker(wInfo);
        closeModal('modal-worker');
        loadWorkers();
    });

    // Settings Modal
    document.getElementById('btn-settings').addEventListener('click', () => {
        openModal('modal-settings');
        // Render provider list
        const provList = document.getElementById('providers-list');
        provList.innerHTML = '';
        db.data.providers.forEach(p => {
            provList.innerHTML += `<li>${p.name}</li>`;
        });
        // Render stock selects
        const sSelect = document.getElementById('adj-product');
        sSelect.innerHTML = '';
        db.getProducts().forEach(p => {
            sSelect.innerHTML += `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`;
        });
    });
    
    document.getElementById('btn-save-provider').addEventListener('click', () => {
        const nom = document.getElementById('new-provider-name').value;
        if(nom) {
            db.addProvider({name: nom});
            document.getElementById('btn-settings').click(); // refresh modal state
            document.getElementById('new-provider-name').value = '';
        }
    });

    document.getElementById('btn-save-stock-adj').addEventListener('click', () => {
        const prodId = document.getElementById('adj-product').value;
        const nQty = parseInt(document.getElementById('adj-stock-qty').value, 10);
        if(!isNaN(nQty)) {
            const p = db.data.products.find(x => x.id === prodId);
            if(p) p.stock = nQty;
            db.save();
            alert("Inventario modificado drásticamente.");
            closeModal('modal-settings');
            loadInventory();
        }
    });

    // POS Payment Modal (VENTA CON CAMBIO Y ENTER)
    let selectedPaymentMethod = 'cash';
    let currentTotal = 0;

    document.getElementById('btn-pay').addEventListener('click', () => {
        if (db.data.cart.length === 0) return alert('El carrito está vacío');
        
        currentTotal = db.data.cart.reduce((s, i) => s + (i.price * i.qty), 0);
        document.getElementById('payment-total-display').textContent = formatMoney(currentTotal);
        
        document.getElementById('credit-warning').classList.add('hidden');
        document.getElementById('credit-options').classList.add('hidden');
        
        document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
        document.querySelector('.method-card[data-method="cash"]').classList.add('active');
        selectedPaymentMethod = 'cash';
        
        document.getElementById('cash-options').classList.remove('hidden');
        document.getElementById('cash-received').value = '';
        document.getElementById('cash-change').textContent = '$0';

        openModal('modal-payment');
        setTimeout(() => document.getElementById('cash-received').focus(), 100);
    });

    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedPaymentMethod = card.dataset.method;

            if (selectedPaymentMethod === 'credit') {
                document.getElementById('credit-options').classList.remove('hidden');
                document.getElementById('cash-options').classList.add('hidden');
                
                if (!db.data.currentClient) {
                    document.getElementById('credit-warning').classList.remove('hidden');
                    document.getElementById('credit-warning').innerHTML = '<i class="fas fa-exclamation-circle"></i> Debe seleccionar un cliente.';
                    document.getElementById('btn-confirm-payment').disabled = true;
                    return;
                }
                const validation = db.validateCredit(db.data.currentClient.id, currentTotal);
                if (!validation.valid) {
                    document.getElementById('credit-warning').classList.remove('hidden');
                    document.getElementById('credit-warning').innerHTML = `<i class="fas fa-ban"></i> RECHAZADO: ${validation.reason}`;
                    document.getElementById('btn-confirm-payment').disabled = true;
                } else {
                    document.getElementById('credit-warning').classList.add('hidden');
                    document.getElementById('btn-confirm-payment').disabled = false;
                }
            } else if (selectedPaymentMethod === 'cash') {
                document.getElementById('credit-options').classList.add('hidden');
                document.getElementById('cash-options').classList.remove('hidden');
                document.getElementById('btn-confirm-payment').disabled = false;
                document.getElementById('cash-received').focus();
            } else {
                document.getElementById('credit-options').classList.add('hidden');
                document.getElementById('cash-options').classList.add('hidden');
                document.getElementById('btn-confirm-payment').disabled = false;
            }
        });
    });

    // Lógica Vuelto y Submit con Enter
    const cashInput = document.getElementById('cash-received');
    cashInput.addEventListener('input', (e) => {
        const received = parseInt(e.target.value, 10) || 0;
        const change = received - currentTotal;
        document.getElementById('cash-change').textContent = change >= 0 ? formatMoney(change) : 'Falta dinero';
    });

    cashInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btn-confirm-payment').click();
        }
    });

    document.getElementById('btn-confirm-payment').addEventListener('click', () => {
        let creditParams = null;
        if (selectedPaymentMethod === 'credit') {
            creditParams = { installments: parseInt(document.getElementById('credit-installments').value, 10) }
        }

        const success = db.registerSale(selectedPaymentMethod, false, creditParams);
        if (success) {
            closeModal('modal-payment');
            renderCart();
            renderPOSProducts(db.getProducts());
            db.data.currentClient = null;
            updateClientUI();
        }
    });

    document.getElementById('btn-presale').addEventListener('click', () => {
        if (db.data.cart.length === 0) return alert('El carrito está vacío');
        if (db.registerSale('cash', true)) {
            renderCart();
            alert('Preventa enviada.');
        }
    });

    // Clients Modal
    document.getElementById('btn-search-client').addEventListener('click', () => openModal('modal-client'));
    document.getElementById('btn-add-client').addEventListener('click', () => {
        document.querySelector('.tab[data-tab="new"]').click();
        openModal('modal-client');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabsContainer = tab.closest('.modal-body') || tab.closest('.tabs').parentElement;
            tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tabsContainer.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
            
            if(tab.dataset.tab === 'search') renderClientSearch();
        });
    });

    const renderClientSearch = (query = '') => {
        const ul = document.getElementById('client-search-results');
        ul.innerHTML = '';
        db.getClients(query).forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${c.name}</strong> - ${c.rut} | Límite: $${formatMoney(c.limit_credit)}`;
            li.addEventListener('click', () => {
                db.data.currentClient = c;
                db.save();
                updateClientUI();
                closeModal('modal-client');
            });
            ul.appendChild(li);
        });
    };

    document.getElementById('search-client-input').addEventListener('input', (e) => renderClientSearch(e.target.value));

    document.getElementById('btn-save-client').addEventListener('click', () => {
        const rut = document.getElementById('new-client-rut').value;
        const name = document.getElementById('new-client-name').value;
        if(!rut || !name) return alert('RUT y Nombre requeridos');

        const newClient = db.addClient({
            rut, name, 
            giro: document.getElementById('new-client-giro').value || 'Particular',
            limit_credit: parseInt(document.getElementById('new-client-limit').value, 10) || 0
        });

        db.data.currentClient = newClient;
        db.save();
        updateClientUI();
        closeModal('modal-client');
    });

    // Acceso Inmediato
    document.querySelector('.nav-item[data-target="pos"]').click();
    renderPOSProducts(db.getProducts());
    renderCart();
    updateClientUI();
});
