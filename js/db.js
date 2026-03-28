const generateId = () => Math.random().toString(36).substr(2, 9);

const generateGroceries = () => {
    const brands = ['Soprole', 'Colun', 'Nestlé', 'Lucchetti', 'Carozzi', 'Tucapel', 'Chef', 'Belmont', 'Coca-Cola', 'CCU', 'Cachantun', 'Báltica', 'Cristal', 'Escudo', 'Costa', 'McKay', 'Savory', 'Maggi', 'Hellmanns', 'Lipton', 'Ideal', 'Castaño'];
    const items = [
        { n: 'Arroz G1', p: 1500 }, { n: 'Fideos Espagueti 400g', p: 900 }, { n: 'Aceite Maravilla 1L', p: 2500 },
        { n: 'Salsa de Tomates 200g', p: 500 }, { n: 'Leche Entera 1L', p: 1100 }, { n: 'Bebida 2L', p: 2200 },
        { n: 'Cerveza Lata 473ml', p: 1000 }, { n: 'Galletas Vino', p: 700 }, { n: 'Galletas Tritón', p: 900 },
        { n: 'Mayonesa 400g', p: 1800 }, { n: 'Ketchup 400g', p: 1500 }, { n: 'Mostaza 250g', p: 900 },
        { n: 'Té Ceylán 100 bolsitas', p: 2500 }, { n: 'Café Instantáneo 100g', p: 3500 }, { n: 'Azúcar Blanca 1kg', p: 1200 },
        { n: 'Sal de Mesa 1kg', p: 600 }, { n: 'Atún Lomitos Lata', p: 1400 }, { n: 'Jurel Lata 425g', p: 1600 },
        { n: 'Mantequilla 250g', p: 2100 }, { n: 'Margarina 500g', p: 1400 }, { n: 'Pan de Molde Blanco', p: 2000 },
        { n: 'Queso Gouda Laminado 250g', p: 2500 }, { n: 'Cecina Mortadela 250g', p: 1500 }, { n: 'Jamón Pierna 250g', p: 2800 },
        { n: 'Yogurt Batido 125g', p: 350 }, { n: 'Jugo en Polvo', p: 300 }, { n: 'Agua Mineral 1.5L', p: 900 },
        { n: 'Papel Higiénico 4 rollos', p: 2000 }, { n: 'Toalla Nova 2 rollos', p: 1500 }, { n: 'Detergente Polvo 1kg', p: 2800 },
        { n: 'Lavalozas 500ml', p: 1200 }, { n: 'Cloro 1L', p: 1100 }, { n: 'Limpiador Pisos 900ml', p: 1500 },
        { n: 'Shampoo 400ml', p: 2500 }, { n: 'Acondicionador 400ml', p: 2500 }, { n: 'Jabón Barra 3 un', p: 1800 },
        { n: 'Pasta Dental 90g', p: 1500 }, { n: 'Desodorante Spray', p: 2800 }, { n: 'Harina sin polvos 1kg', p: 1200 },
        { n: 'Polvos de hornear', p: 600 }, { n: 'Levadura', p: 500 }, { n: 'Porotos Hallados 1kg', p: 2500 },
        { n: 'Lentejas 1kg', p: 2200 }, { n: 'Garbanzos 1kg', p: 2400 }, { n: 'Avena 500g', p: 1100 },
        { n: 'Cereal Chocapic', p: 2900 }, { n: 'Miel 500g', p: 3500 }, { n: 'Mermelada Durazno 250g', p: 1100 },
        { n: 'Manjar 250g', p: 1200 }, { n: 'Crema de leche 200ml', p: 1000 }
    ];
    let prods = [];
    items.forEach((it, i) => {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        prods.push({
            id: generateId(), sku: 'CHI-' + (1000 + i), name: `${it.n} ${brand}`,
            price: it.p, brand: brand, stock: Math.floor(Math.random() * 50) + 10, variants: null
        });
    });
    return prods;
};

const INITIAL_DATA = {
    products: generateGroceries(),
    clients: [
        { id: generateId(), rut: '11.111.111-1', name: 'Juan Ignacio Pérez', giro: 'Particular', limit_credit: 150000, debt: 45000 },
        { id: generateId(), rut: '22.222.222-2', name: 'Comercial La Florida SpA', giro: 'Retail', limit_credit: 500000, debt: 0 },
        { id: generateId(), rut: '15.345.678-K', name: 'María González López', giro: 'Particular', limit_credit: 100000, debt: 0 },
        { id: generateId(), rut: '09.876.543-2', name: 'Constructora Eloísa Ltda.', giro: 'Construcción', limit_credit: 1500000, debt: 250000 },
        { id: generateId(), rut: '18.123.456-7', name: 'Carlos Díaz Valdés', giro: 'Particular', limit_credit: 80000, debt: 75000 },
        { id: generateId(), rut: '12.987.654-3', name: 'Minimarket El Sol', giro: 'Comercio', limit_credit: 300000, debt: 15000 },
        { id: generateId(), rut: '19.456.789-0', name: 'Ana Silva Mendoza', giro: 'Particular', limit_credit: 120000, debt: 0 },
        { id: generateId(), rut: '76.543.210-9', name: 'Panadería San Juan EIRL', giro: 'Panadería', limit_credit: 800000, debt: 0 },
        { id: generateId(), rut: '14.222.333-5', name: 'Pedro Morales Rojas', giro: 'Particular', limit_credit: 50000, debt: 65000 },
        { id: generateId(), rut: '17.654.321-4', name: 'Camila Soto Figueroa', giro: 'Particular', limit_credit: 200000, debt: 0 }
    ],
    sales: [],
    quotas: [],
    cart: [],
    currentClient: null,
    workers: [
        { id: 'admin', name: 'Administrador Principal', pin: '1234' }
    ],
    providers: [
        { id: generateId(), name: 'Distribuidora Central' }
    ]
};

class Database {
    constructor() {
        this.activeCashierInfo = localStorage.getItem('mrpos_active_cashier_info');
        this.activeCashier = this.activeCashierInfo ? JSON.parse(this.activeCashierInfo).id : 'admin';
        this.storageKey = 'erp_data_' + this.activeCashier;
        this.load();
    }

    load() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            this.data = JSON.parse(data);
            if(!this.data.workers) this.data.workers = [{id: 'admin', name: 'Admin', pin: '1234'}];
            if(!this.data.providers) this.data.providers = [];
        } else {
            this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
            this.save();
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    switchCashier(workerParams) {
        localStorage.setItem('mrpos_active_cashier_info', JSON.stringify(workerParams));
        location.reload();
    }

    // Products
    getProducts(query = '') {
        if (!query) return this.data.products;
        query = query.toLowerCase();
        return this.data.products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    }

    addProduct(prod) {
        const newProd = { id: generateId(), variants: null, ...prod };
        this.data.products.push(newProd);
        this.save();
        return newProd;
    }

    // Providers & Workers
    addWorker(worker) {
        this.data.workers.push({ id: generateId(), ...worker });
        this.save();
    }
    
    addProvider(prov) {
        this.data.providers.push({ id: generateId(), ...prov });
        this.save();
    }

    // Clients
    getClients(query = '') {
        if (!query) return this.data.clients;
        query = query.toLowerCase();
        return this.data.clients.filter(c => c.name.toLowerCase().includes(query) || c.rut.includes(query));
    }

    addClient(client) {
        const newClient = { id: generateId(), debt: 0, ...client };
        this.data.clients.push(newClient);
        this.save();
        return newClient;
    }

    validateCredit(clientId, amount) {
        const client = this.data.clients.find(c => c.id === clientId);
        if (!client) return { valid: false, reason: 'Cliente no seleccionado' };
        if ((client.debt + amount) > client.limit_credit) {
            return { valid: false, reason: `Supera límite de crédito asignado ($${client.limit_credit.toLocaleString('es-CL')})` };
        }
        const moras = this.data.quotas.filter(q => q.clientId === clientId && q.status === 'mora');
        if (moras.length >= 3) {
            return { valid: false, reason: 'El cliente tiene 3 o más cuotas en mora.' };
        }
        return { valid: true };
    }

    // Cart
    addToCart(product) {
        const existing = this.data.cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            this.data.cart.push({ ...product, qty: 1 });
        }
        this.save();
    }

    removeFromCart(productId) {
        this.data.cart = this.data.cart.filter(item => item.id !== productId);
        this.save();
    }

    updateCartQty(productId, qty) {
        const item = this.data.cart.find(item => item.id === productId);
        if (item) {
            item.qty = qty;
            if (item.qty <= 0) this.removeFromCart(productId);
        }
        this.save();
    }

    clearCart() {
        this.data.cart = [];
        this.save();
    }

    // Sales
    registerSale(paymentMethod, isPresale, creditParams = null) {
        if (this.data.cart.length === 0) return false;

        const total = this.data.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const sale = {
            id: 'V-00' + (this.data.sales.length + 3),
            date: new Date().toISOString(),
            clientId: this.data.currentClient ? this.data.currentClient.id : 'General',
            cashier: this.activeCashierInfo ? JSON.parse(this.activeCashierInfo).name : 'Admin',
            total: total,
            method: paymentMethod,
            status: isPresale ? 'preventa' : 'finalizada',
            items: [...this.data.cart] // Clonar
        };

        this.data.cart.forEach(cartItem => {
            const prod = this.data.products.find(p => p.id === cartItem.id);
            if(prod) prod.stock -= cartItem.qty;
        });

        if (paymentMethod === 'credit' && creditParams && this.data.currentClient) {
            const client = this.data.clients.find(c => c.id === this.data.currentClient.id);
            client.debt += total;

            const cuotaAmount = Math.round(total / creditParams.installments);
            
            for (let i = 1; i <= creditParams.installments; i++) {
                let dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);

                this.data.quotas.push({
                    id: generateId(),
                    clientId: client.id,
                    clientName: client.name,
                    clientRut: client.rut,
                    saleId: sale.id,
                    num_quota: i,
                    total_quotas: creditParams.installments,
                    amount: cuotaAmount,
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'pendiente',
                    interest: 0
                });
            }
        }

        this.data.sales.push(sale);
        this.clearCart();
        this.save();
        return true;
    }
}

const db = new Database();
