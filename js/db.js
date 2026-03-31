// db.js - Motor de Datos MrPOS ERP
const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

const generateGroceries = () => {
    const brands = ['Soprole', 'Colun', 'Nestlé', 'Lucchetti', 'Carozzi', 'Tucapel', 'Chef', 'Belmont', 'Coca-Cola', 'CCU'];
    const items = [
        { n: 'Arroz G1', p: 1500 }, { n: 'Fideos 400g', p: 900 }, { n: 'Aceite 1L', p: 2500 },
        { n: 'Sal de Mesa 1kg', p: 600 }, { n: 'Azúcar 1kg', p: 1200 }, { n: 'Harina 1kg', p: 1100 }
    ];
    let prods = [];
    items.forEach((it, i) => {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        prods.push({
            id: generateId(), sku: 'CHI-' + (1000 + i), name: `${it.n} ${brand}`,
            price: it.p, brand: brand, stock: 20, talla: 'U', genero: 'Unisex',
            provider: 'Distribuidora Central'
        });
    });
    return prods;
};

const INITIAL_DATA = {
    products: generateGroceries(),
    clients: [
        { id: generateId(), rut: '11.111.111-1', name: 'Juan Ignacio Pérez', giro: 'Particular', limit_credit: 150000, debt: 45000 },
        { id: generateId(), rut: '09.876.543-2', name: 'Constructora Eloísa', giro: 'Construcción', limit_credit: 1500000, debt: 0 }
    ],
    sales: [],
    quotas: [],
    cart: [],
    currentClient: null,
    workers: [
        { id: 'admin', name: 'Administrador ERP', pin: '1234', status: 'Activo' }
    ],
    providers: [
        { id: generateId(), name: 'Distribuidora Central' },
        { id: generateId(), name: 'Textiles Chile' }
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
            if(!this.data.workers) this.data.workers = INITIAL_DATA.workers;
            if(!this.data.providers) this.data.providers = INITIAL_DATA.providers;
        } else {
            this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
            this.save();
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Products
    getProducts(query = '') {
        if (!query) return this.data.products;
        query = query.toLowerCase();
        return this.data.products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.sku.toLowerCase().includes(query) ||
            (p.brand && p.brand.toLowerCase().includes(query))
        );
    }

    addProduct(prod) {
        const newProd = { id: generateId(), ...prod };
        this.data.products.push(newProd);
        this.save();
        return newProd;
    }

    // Providers & Workers
    addWorker(worker) {
        const nw = { id: generateId(), status: 'Activo', ...worker };
        this.data.workers.push(nw);
        this.save();
        return nw;
    }
    
    addProvider(prov) {
        const np = { id: generateId(), ...prov };
        this.data.providers.push(np);
        this.save();
        return np;
    }

    // Clients
    getClients(query = '') {
        if (!query) return this.data.clients;
        query = query.toLowerCase();
        return this.data.clients.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.rut.includes(query)
        );
    }

    addClient(client) {
        const newClient = { id: generateId(), debt: 0, ...client };
        this.data.clients.push(newClient);
        this.save();
        return newClient;
    }

    // Venta con Letras - Logic
    registrarVentaConLetras(nCuotas) {
        if(this.data.cart.length === 0 || !this.data.currentClient) return { success: false, error: 'Venta no válida' };
        
        const total = this.data.cart.reduce((s,i)=>s+(i.price*i.qty), 0);
        const folio = 'V-LTR-' + (this.data.sales.length + 100);
        
        const venta = {
            id: folio, date: new Date().toISOString(),
            clientId: this.data.currentClient.id, 
            cashier: this.activeCashierInfo ? JSON.parse(this.activeCashierInfo).name : 'Admin',
            total, method: 'letras', status: 'finalizada', items: [...this.data.cart]
        };

        const cuotaMonto = Math.round(total / nCuotas);
        for(let i=1; i<=nCuotas; i++){
            let d = new Date(); d.setDate(d.getDate() + (30*i));
            this.data.quotas.push({
                id: 'LTR-' + generateId(), clientId: this.data.currentClient.id, clientName: this.data.currentClient.name,
                clientRut: this.data.currentClient.rut, saleId: folio, num_quota: i, total_quotas: nCuotas,
                amount: cuotaMonto, dueDate: d.toISOString().split('T')[0], status: 'pendiente'
            });
        }
        this.data.sales.push(venta);
        this.data.cart = [];
        this.save();
        return { success: true, folio };
    }

    registerSale(method, isPresale) {
        if(this.data.cart.length === 0) return false;
        const total = this.data.cart.reduce((s,i)=>s+(i.price*i.qty), 0);
        const sale = {
            id: 'V-00' + (this.data.sales.length + 200), date: new Date().toISOString(),
            clientId: this.data.currentClient ? this.data.currentClient.id : 'General',
            cashier: this.activeCashierInfo ? JSON.parse(this.activeCashierInfo).name : 'Admin',
            total, method, status: isPresale?'preventa':'finalizada', items: [...this.data.cart]
        };
        this.data.cart.forEach(it => { const p = this.data.products.find(x=>x.id===it.id); if(p) p.stock -= it.qty; });
        this.data.sales.push(sale);
        this.data.cart = [];
        this.save(); return true;
    }

    addToCart(p) {
        const item = this.data.cart.find(x => x.id === p.id);
        if(item) item.qty++;
        else this.data.cart.push({ ...p, qty: 1 });
        this.save();
    }
}
const db = new Database();
