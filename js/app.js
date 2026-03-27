// app.js - Lógica de Interfaz de Usuario y Controladores

document.addEventListener('DOMContentLoaded', () => {
    // ===== SYSTEM CLOCK =====
    const updateClock = () => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000);
    updateClock();

    // ===== ROUTING (Tabs) =====
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('current-page-title');
    const pageSubTitle = document.getElementById('current-page-subtitle');

    const viewTitles = {
        'dashboard': { t: 'Dashboard', s: 'Resumen general del negocio' },
        'pos': { t: 'Punto de Venta', s: 'Ventas y Preventas' },
        'credits': { t: 'Cobranzas y Créditos', s: 'Estado de cuenta, letras y abonos' },
        'inventory': { t: 'Inventario', s: 'Gestión de productos y stock' }
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

    // 1. DASHBOARD
    const loadDashboard = () => {
        // Sales today
        const today = new Date().toISOString().split('T')[0];
        const todaySales = db.data.sales.filter(s => s.date.startsWith(today) && s.status === 'finalizada').reduce((sum, s) => sum + s.total, 0);
        document.getElementById('kpi-sales').textContent = formatMoney(todaySales);

        // Pending Credits Total
        const totalCredits = db.data.quotas.filter(q => q.status !== 'pagado').reduce((sum, q) => sum + q.amount, 0);
        document.getElementById('kpi-credits').textContent = formatMoney(totalCredits);

        // Low stock 
        const lowStock = db.data.products.filter(p => p.stock < 5).length;
        document.getElementById('kpi-stock').textContent = lowStock;

        // Alerts Table
        const alertsBody = document.getElementById('alerts-body');
        alertsBody.innerHTML = '';
        
        const pendingQuotas = db.data.quotas.filter(q => q.status !== 'pagado').sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        pendingQuotas.slice(0, 10).forEach(q => {
            const daysDelayed = countDaysDelayed(q.dueDate);
            const isMora = daysDelayed > 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${q.clientName}</td>
                <td>${q.clientRut}</td>
                <td>Cuota ${q.num_quota}/${q.total_quotas} - ${q.dueDate}</td>
                <td><span class="badge ${isMora ? 'badge-red' : 'badge-green'}">${isMora ? daysDelayed + ' días' : 'Al día'}</span></td>
                <td style="font-weight:bold">${formatMoney(q.amount)}</td>
                <td>${isMora ? 'En Mora' : 'Pendiente'}</td>
            `;
            alertsBody.appendChild(tr);
        });
    };

    // 2. POS
    const posProductGrid = document.getElementById('pos-product-grid');
    
    const renderPOSProducts = (products) => {
        posProductGrid.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <div class="img-placeholder"><i class="fas fa-box"></i></div>
                <h4>${p.name}</h4>
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

    document.getElementById('pos-search').addEventListener('input', (e) => {
        renderPOSProducts(db.getProducts(e.target.value));
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
                    <h4>${item.name}</h4>
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

    // Client Selector in POS
    const updateClientUI = () => {
        if(db.data.currentClient) {
            document.getElementById('selected-client').innerHTML = `<i class="fas fa-user-circle"></i> ${db.data.currentClient.name} (${db.data.currentClient.rut})`;
        } else {
            document.getElementById('selected-client').innerHTML = `<i class="fas fa-user-circle"></i> Cliente Genérico`;
        }
    };

    // 3. CREDITOS (Cobranzas)
    const loadCredits = () => {
        const tBody = document.getElementById('credits-body');
        tBody.innerHTML = '';
        
        db.data.quotas.forEach(q => {
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

    window.payQuota = (id) => {
        if(confirm('¿Confirmar pago de esta cuota? Esto actualizará el estado de cuenta.')) {
            const quota = db.data.quotas.find(q => q.id === id);
            if(quota) {
                quota.status = 'pagado';
                // discount debt from client
                const client = db.data.clients.find(c => c.id === quota.clientId);
                if(client) client.debt -= quota.amount;
                db.save();
                loadCredits();
                loadDashboard();
            }
        }
    };

    // 4. INVENTORY
    const loadInventory = () => {
        const body = document.getElementById('inventory-body');
        body.innerHTML = '';
        db.getProducts().forEach(p => {
            const variantsStr = p.variants ? p.variants.map(v => `${v.size} / ${v.color}`).join('<br>') : '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.sku}</td>
                <td><strong>${p.name}</strong></td>
                <td><small>${variantsStr}</small></td>
                <td>${formatMoney(p.price)}</td>
                <td><span class="${p.stock <= 5 ? 'text-red fw-bold' : ''}">${p.stock} u.</span></td>
                <td>
                    <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Stock"><i class="fas fa-cubes"></i></button>
                </td>
            `;
            body.appendChild(tr);
        });
    };

    // ===== MODALS LOGIC =====
    // Utilities
    const openModal = (id) => document.getElementById(id).classList.add('active');
    const closeModal = (id) => document.getElementById(id).classList.remove('active');

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });

    // POS Payment Modal
    let selectedPaymentMethod = 'cash';
    document.getElementById('btn-pay').addEventListener('click', () => {
        if (db.data.cart.length === 0) return alert('El carrito está vacío');
        
        const total = db.data.cart.reduce((s, i) => s + (i.price * i.qty), 0);
        document.getElementById('payment-total-display').textContent = formatMoney(total);
        
        // Reset warnings
        document.getElementById('credit-warning').classList.add('hidden');
        document.getElementById('credit-options').classList.add('hidden');
        
        // Reset active
        document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
        document.querySelector('.method-card[data-method="cash"]').classList.add('active');
        selectedPaymentMethod = 'cash';

        openModal('modal-payment');
    });

    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedPaymentMethod = card.dataset.method;

            const total = db.data.cart.reduce((s, i) => s + (i.price * i.qty), 0);

            if (selectedPaymentMethod === 'credit') {
                document.getElementById('credit-options').classList.remove('hidden');
                
                // VALIDATE BUSINESS RULE: Check Limits and Mora
                if (!db.data.currentClient) {
                    document.getElementById('credit-warning').classList.remove('hidden');
                    document.getElementById('credit-warning').innerHTML = '<i class="fas fa-exclamation-circle"></i> Debe seleccionar un cliente primero.';
                    document.getElementById('btn-confirm-payment').disabled = true;
                    return;
                }

                const validation = db.validateCredit(db.data.currentClient.id, total);
                if (!validation.valid) {
                    document.getElementById('credit-warning').classList.remove('hidden');
                    document.getElementById('credit-warning').innerHTML = `<i class="fas fa-ban"></i> CRÉDITO RECHAZADO: ${validation.reason}`;
                    document.getElementById('btn-confirm-payment').disabled = true;
                } else {
                    document.getElementById('credit-warning').classList.add('hidden');
                    document.getElementById('btn-confirm-payment').disabled = false;
                }

            } else {
                document.getElementById('credit-options').classList.add('hidden');
                document.getElementById('btn-confirm-payment').disabled = false;
            }
        });
    });

    document.getElementById('btn-confirm-payment').addEventListener('click', () => {
        let creditParams = null;
        if (selectedPaymentMethod === 'credit') {
            creditParams = {
                installments: parseInt(document.getElementById('credit-installments').value, 10)
            }
        }

        const success = db.registerSale(selectedPaymentMethod, false, creditParams);
        if (success) {
            closeModal('modal-payment');
            renderCart();
            renderPOSProducts(db.getProducts());
            db.data.currentClient = null;
            updateClientUI();
            alert('Venta procesada con éxito!');
        }
    });

    document.getElementById('btn-presale').addEventListener('click', () => {
        if (db.data.cart.length === 0) return alert('El carrito está vacío');
        const success = db.registerSale('cash', true);
        if (success) {
            renderCart();
            alert('Preventa guardada y enviada a bodega.');
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
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            
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
            li.innerHTML = `<strong>${c.name}</strong> - ${c.rut} | Deuda: $${formatMoney(c.debt)}`;
            li.addEventListener('click', () => {
                db.data.currentClient = c;
                db.save();
                updateClientUI();
                closeModal('modal-client');
            });
            ul.appendChild(li);
        });
    };

    document.getElementById('search-client-input').addEventListener('input', (e) => {
        renderClientSearch(e.target.value);
    });

    document.getElementById('btn-save-client').addEventListener('click', () => {
        const rut = document.getElementById('new-client-rut').value;
        const name = document.getElementById('new-client-name').value;
        const giro = document.getElementById('new-client-giro').value;
        const lim = document.getElementById('new-client-limit').value;

        if(!rut || !name) return alert('RUT y Nombre requeridos');

        const newClient = db.addClient({
            rut: rut,
            name: name,
            giro: giro || 'Particular',
            limit_credit: parseInt(lim, 10) || 0
        });

        db.data.currentClient = newClient;
        db.save();
        updateClientUI();
        closeModal('modal-client');

        document.getElementById('new-client-rut').value = '';
        document.getElementById('new-client-name').value = '';
    });

    // Init
    loadDashboard();
    renderPOSProducts(db.getProducts());
    renderCart();
    updateClientUI();
});
