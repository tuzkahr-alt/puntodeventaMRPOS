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
            id: generateId(), 
            sku: 'CHI-' + (1000 + i), 
            name: `${it.n} ${brand}`,
            price: it.p, 
            brand: brand, 
            stock: Math.floor(Math.random() * 50) + 10,
            stockCrit: 5,
            categoryId: 1,
            familyId: 1,
            type: 'Venta',
            observations: '',
            taxAdd: 0,
            unitSale: 'UN',
            unitBox: 1,
            active: true,
            hasIva: true,
            isPack: false,
            margin: 30,
            offerName: '',
            offerMinQty: 0,
            offerPrice: 0,
            nutritional: null
        });
    });
    return prods;
};

const INITIAL_DATA = {
    products: generateGroceries(),
    categories: [
        { id: 1, name: 'ABARROTES', printer: 'LPT1', printReport: true },
        { id: 2, name: 'BEBIDAS', printer: 'LPT1', printReport: true },
        { id: 3, name: 'LACTEOS', printer: 'LPT1', printReport: true }
    ],
    families: [
        { id: 1, name: 'ACEITES', categoryId: 1 },
        { id: 2, name: 'ARROCES', categoryId: 1 },
        { id: 3, name: 'GASEOSAS', categoryId: 2 }
    ],
    people: [
        { id: generateId(), rut: '11.111.111-1', name: 'Juan Ignacio Pérez', giro: 'Particular', address: 'Av. Siempre Viva 123', commune: 'Santiago', city: 'Santiago', phone: '+56912345678', email: 'juan@email.com', contact: 'Juan', isBlocked: false, isProvider: false, isClient: true, isEmployee: false, limit_credit: 150000, debt: 45000 },
        { id: generateId(), rut: '76.543.210-9', name: 'Distribuidora Central SpA', giro: 'Distribución', address: 'Calle Industrial 45', commune: 'Quilicura', city: 'Santiago', phone: '+5622334455', email: 'contacto@central.cl', contact: 'Marta Sol', isBlocked: false, isProvider: true, isClient: false, isEmployee: false, limit_credit: 0, debt: 0 }
    ],
    sales: [],
    purchases: [],
    quotas: [],
    creditMovements: [],
    cart: [],
    currentClient: null,
    workers: [
        { id: 'admin', name: 'Administrador Principal', pin: '1234' }
    ],
    companyData: {
        rut: '77.777.777-7',
        name: 'MRPOS ERP SOLUTIONS',
        fantasyName: 'WWW.MRPOS.CL',
        giro: 'SOPORTE INFORMÁTICO',
        address: 'AV. NUEVA PROVIDENCIA 123',
        commune: 'PROVIDENCIA',
        city: 'SANTIAGO'
    },
    posConfig: {
        posNum: 1,
        ip: '192.168.1.50',
        dbPath: 'C:\\MRPOS\\DATABASE',
        backupPath: 'D:\\BACKUPS',
        sincTx: true,
        sincRx: true,
        noSalesWithoutStock: false,
        askPassForDiscount: true,
        askPassForDelete: true
    },
    peripherals: {
        printer: { port: 'LPT1', baudRate: 9600, parity: 'None', dataBits: 8 },
        scanner: { port: 'COM1', baudRate: 9600, parity: 'None', dataBits: 8 },
        drawer: { enabled: true, port: 'LPT1' }
    }
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
            // Ensure new tables exist in case of update
            if(!this.data.categories) this.data.categories = INITIAL_DATA.categories;
            if(!this.data.families) this.data.families = INITIAL_DATA.families;
            if(!this.data.people) this.data.people = INITIAL_DATA.people;
            if(!this.data.purchases) this.data.purchases = [];
            if(!this.data.companyData) this.data.companyData = INITIAL_DATA.companyData;
            if(!this.data.posConfig) this.data.posConfig = INITIAL_DATA.posConfig;
            if(!this.data.creditMovements) this.data.creditMovements = [];
            if(!this.data.peripherals) this.data.peripherals = INITIAL_DATA.peripherals;
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
        const newProd = { id: generateId(), ...prod };
        this.data.products.push(newProd);
        this.save();
        return newProd;
    }

    // Categorias & Familias
    addCategory(cat) {
        this.data.categories.push({ id: this.data.categories.length + 1, ...cat });
        this.save();
    }

    addFamily(fam) {
        this.data.families.push({ id: this.data.families.length + 1, ...fam });
        this.save();
    }

    // People (Unified Clients/Providers)
    getPeople(query = '', type = '') {
        let list = this.data.people;
        if (type === 'client') list = list.filter(p => p.isClient);
        if (type === 'provider') list = list.filter(p => p.isProvider);
        if (type === 'employee') list = list.filter(p => p.isEmployee);
        
        if (!query) return list;
        query = query.toLowerCase();
        return list.filter(p => p.name.toLowerCase().includes(query) || p.rut.includes(query));
    }

    addPerson(person) {
        const newPerson = { id: generateId(), debt: 0, ...person };
        this.data.people.push(newPerson);
        this.save();
        return newPerson;
    }

    validateCredit(personId, amount) {
        const person = this.data.people.find(p => p.id === personId);
        if (!person) return { valid: false, reason: 'Persona no seleccionada' };
        if ((person.debt + amount) > person.limit_credit) {
            return { valid: false, reason: `Supera límite de crédito (${person.limit_credit})` };
        }
        if (person.isBlocked) return { valid: false, reason: 'El cliente está BLOQUEADO para crédito.' };
        return { valid: true };
    }

    // Cart ... (Keeping same)
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

    // Sales & Credits
    registerSale(paymentMethod, isPresale, creditParams = null) {
        if (this.data.cart.length === 0) return false;

        const total = this.data.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const sale = {
            id: 'V-' + (this.data.sales.length + 100).toString().padStart(4, '0'),
            date: new Date().toISOString(),
            personId: this.data.currentClient ? this.data.currentClient.id : 'General',
            cashier: this.activeCashierInfo ? JSON.parse(this.activeCashierInfo).name : 'Admin',
            total: total,
            method: paymentMethod,
            status: isPresale ? 'preventa' : 'finalizada',
            items: [...this.data.cart]
        };

        this.data.cart.forEach(cartItem => {
            const prod = this.data.products.find(p => p.id === cartItem.id);
            if(prod) prod.stock -= cartItem.qty;
        });

        if (paymentMethod === 'credit' && this.data.currentClient) {
            const person = this.data.people.find(p => p.id === this.data.currentClient.id);
            person.debt += total;

            // Log movement
            this.data.creditMovements.push({
                id: generateId(),
                personId: person.id,
                rut: person.rut,
                type: 'Venta',
                number: sale.id,
                date: sale.date,
                charge: total,
                credit: 0,
                balance: person.debt
            });

            if (creditParams) {
                const cuotaAmount = Math.round(total / creditParams.installments);
                for (let i = 1; i <= creditParams.installments; i++) {
                    let dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i);
                    this.data.quotas.push({
                        id: generateId(),
                        personId: person.id,
                        personName: person.name,
                        personRut: person.rut,
                        saleId: sale.id,
                        num_quota: i,
                        total_quotas: creditParams.installments,
                        amount: cuotaAmount,
                        dueDate: dueDate.toISOString().split('T')[0],
                        status: 'pendiente'
                    });
                }
            }
        }

        this.data.sales.push(sale);
        this.clearCart();
        this.save();
        return true;
    }
}

const db = new Database();
