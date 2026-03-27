// mock-db.js - Simulador de Base de Datos y Estado Local

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA = {
    products: [
        { id: generateId(), name: 'Zapatillas Nike Air', sku: 'NK-AIR-01', price: 65000, brand: 'Nike', stock: 15, variants: [{ size: '42', color: 'Blanco', stock: 10 }, { size: '43', color: 'Negro', stock: 5 }] },
        { id: generateId(), name: 'Polerón Adidas O.', sku: 'AD-POL-01', price: 35000, brand: 'Adidas', stock: 8, variants: [{ size: 'M', color: 'Gris', stock: 8 }] },
        { id: generateId(), name: 'Jeans Levis 501', sku: 'LV-501', price: 45000, brand: 'Levis', stock: 20, variants: [{ size: '42', color: 'Azul', stock: 20 }] },
        { id: generateId(), name: 'Perfume Calvin Klein', sku: 'CK-PER-01', price: 29990, brand: 'Calvin Klein', stock: 2, variants: [{ size: '100ml', color: 'N/A', stock: 2 }] }
    ],
    clients: [
        { id: generateId(), rut: '11.111.111-1', name: 'Juan Pérez', giro: 'Particular', limit_credit: 150000, debt: 45000 },
        { id: generateId(), rut: '22.222.222-2', name: 'Comercial XYZ', giro: 'Retail', limit_credit: 500000, debt: 0 },
        { id: generateId(), rut: '33.333.333-3', name: 'María González', giro: 'Particular', limit_credit: 100000, debt: 120000 } // Excede!
    ],
    sales: [],
    // Tabla 'Letras' o 'Cuotas' vinculada a venta a crédito
    quotas: [
        { id: generateId(), clientId: '1', clientName: 'Juan Pérez', clientRut: '11.111.111-1', saleId: 'V-001', num_quota: 1, total_quotas: 3, amount: 15000, dueDate: '2026-03-25', status: 'mora', interest: 500 },
        { id: generateId(), clientId: '1', clientName: 'Juan Pérez', clientRut: '11.111.111-1', saleId: 'V-001', num_quota: 2, total_quotas: 3, amount: 15000, dueDate: '2026-04-25', status: 'pendiente', interest: 0 },
        { id: generateId(), clientId: '3', clientName: 'María González', clientRut: '33.333.333-3', saleId: 'V-002', num_quota: 1, total_quotas: 1, amount: 120000, dueDate: '2026-02-15', status: 'mora', interest: 10000 }
    ],
    cart: [],
    currentClient: null
};

class Database {
    constructor() {
        this.load();
    }

    load() {
        const data = localStorage.getItem('erp_data');
        if (data) {
            this.data = JSON.parse(data);
        } else {
            this.data = INITIAL_DATA;
            // Link mock data IDs correctly
            this.data.quotas[0].clientId = this.data.clients[0].id;
            this.data.quotas[1].clientId = this.data.clients[0].id;
            this.data.quotas[2].clientId = this.data.clients[2].id;
            this.save();
        }
    }

    save() {
        localStorage.setItem('erp_data', JSON.stringify(this.data));
    }

    // Products
    getProducts(query = '') {
        if (!query) return this.data.products;
        query = query.toLowerCase();
        return this.data.products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
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

    // Validador de Crédito (Regla de Negocio Crítica)
    validateCredit(clientId, amount) {
        const client = this.data.clients.find(c => c.id === clientId);
        if (!client) return { valid: false, reason: 'Cliente no seleccionado' };

        // 1. Validar límite
        if ((client.debt + amount) > client.limit_credit) {
            return { valid: false, reason: `Supera límite de crédito asignado ($${client.limit_credit.toLocaleString('es-CL')})` };
        }

        // 2. Validar cuotas en mora
        const moras = this.data.quotas.filter(q => q.clientId === clientId && q.status === 'mora');
        if (moras.length >= 3) {
            return { valid: false, reason: 'El cliente tiene 3 o más cuotas vencidas/en mora.' };
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

    // Sales (including Presales and Credits)
    registerSale(paymentMethod, isPresale, creditParams = null) {
        if (this.data.cart.length === 0) return false;

        const total = this.data.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const sale = {
            id: 'V-00' + (this.data.sales.length + 3),
            date: new Date().toISOString(),
            clientId: this.data.currentClient ? this.data.currentClient.id : 'General',
            total: total,
            method: paymentMethod,
            status: isPresale ? 'preventa' : 'finalizada',
            items: [...this.data.cart]
        };

        // Reducir stock (si está configurado permitir negativos, no hay problema)
        this.data.cart.forEach(cartItem => {
            const prod = this.data.products.find(p => p.id === cartItem.id);
            if(prod) prod.stock -= cartItem.qty;
        });

        // Crear cuotas/letras si es crédito
        if (paymentMethod === 'credit' && creditParams && this.data.currentClient) {
            const client = this.data.clients.find(c => c.id === this.data.currentClient.id);
            client.debt += total;

            const cuotaAmount = Math.round(total / creditParams.installments);
            
            for (let i = 1; i <= creditParams.installments; i++) {
                let dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i); // + 30 dias aprox por cuota

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
