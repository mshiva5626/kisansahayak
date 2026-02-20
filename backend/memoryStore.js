const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'localDb.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Default empty store
let store = {
    users: [],
    farms: [],
    images: [],
    advisories: [],
    notifications: [],
    _nextId: 1
};

// Load from disk if available
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        store = { ...store, ...JSON.parse(data) };
    } catch (e) {
        console.error('Error reading localDb.json:', e.message);
    }
}

// Helper to save to disk
const syncToDisk = () => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing localDb.json:', e.message);
    }
};

function genId() {
    const id = 'mem_' + (store._nextId++) + '_' + Date.now().toString(36);
    syncToDisk();
    return id;
}

// ---- User operations ----
const UserStore = {
    async findOne(query) {
        if (query.email) return store.users.find(u => u.email === query.email) || null;
        if (query._id) return store.users.find(u => u._id === query._id) || null;
        return null;
    },
    async findById(id) {
        return store.users.find(u => u._id === id) || null;
    },
    async create({ email, password, name }) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const user = {
            _id: genId(),
            email: email.toLowerCase().trim(),
            password: hashed,
            name: name || '',
            mobile_number: '',
            preferred_language: 'en',
            state: '',
            district: '',
            farming_type: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        store.users.push(user);
        syncToDisk();
        return user;
    },
    async matchPassword(user, enteredPassword) {
        return bcrypt.compare(enteredPassword, user.password);
    },
    async save(user) {
        user.updatedAt = new Date();
        const idx = store.users.findIndex(u => u._id === user._id);
        if (idx !== -1) {
            store.users[idx] = user;
            syncToDisk();
        }
        return user;
    }
};

// ---- Farm operations ----
const FarmStore = {
    async create(farmData) {
        const farm = {
            _id: genId(),
            ...farmData,
            status: farmData.status || 'Healthy',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        store.farms.push(farm);
        syncToDisk();
        return farm;
    },
    async find(query, sort) {
        let results = store.farms.filter(f => f.userId === query.userId);
        if (sort && sort.createdAt === -1) {
            results.sort((a, b) => b.createdAt - a.createdAt);
        }
        return results;
    },
    async findOne(query) {
        return store.farms.find(f => f._id === query._id && f.userId === query.userId) || null;
    },
    async findById(id) {
        return store.farms.find(f => f._id === id) || null;
    },
    async save(farm) {
        farm.updatedAt = new Date();
        const idx = store.farms.findIndex(f => f._id === farm._id);
        if (idx !== -1) {
            store.farms[idx] = farm;
            syncToDisk();
        }
        return farm;
    },
    async findOneAndDelete(query) {
        const idx = store.farms.findIndex(f => f._id === query._id && f.userId === query.userId);
        if (idx === -1) return null;
        const [removed] = store.farms.splice(idx, 1);
        syncToDisk();
        return removed;
    }
};

// ---- Image operations ----
const ImageStore = {
    async create(imageData) {
        const image = {
            _id: genId(),
            ...imageData,
            analysis_result: null,
            confidence_score: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        store.images.push(image);
        syncToDisk();
        return image;
    },
    async findById(id) {
        return store.images.find(i => i._id === id) || null;
    },
    async find(query) {
        let results = store.images;
        if (query.farm_id) results = results.filter(i => i.farm_id === query.farm_id);
        return results.sort((a, b) => b.createdAt - a.createdAt);
    },
    async save(image) {
        image.updatedAt = new Date();
        const idx = store.images.findIndex(i => i._id === image._id);
        if (idx !== -1) {
            store.images[idx] = image;
            syncToDisk();
        }
        return image;
    }
};

// ---- Advisory operations ----
const AdvisoryStore = {
    async create(advisoryData) {
        const advisory = {
            _id: genId(),
            ...advisoryData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        store.advisories.push(advisory);
        syncToDisk();
        return advisory;
    },
    async find(query) {
        let results = store.advisories;
        if (query.farm_id) results = results.filter(a => a.farm_id === query.farm_id);
        return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
    }
};

// ---- Scheme operations (loaded from seed data) ----
let schemesLoaded = false;
let schemeData = [];

const SchemeStore = {
    load(seedData) {
        if (!schemesLoaded) {
            schemeData = seedData.map((s, i) => ({
                _id: 'scheme_' + (i + 1),
                ...s,
                createdAt: new Date()
            }));
            schemesLoaded = true;
        }
    },
    async find(query) {
        let results = [...schemeData];
        if (query && query.state) {
            const stateRegex = new RegExp(query.state, 'i');
            results = results.filter(s =>
                s.scheme_type === 'central' || stateRegex.test(s.state)
            );
        }
        return results.sort((a, b) => {
            if (a.scheme_type === 'central' && b.scheme_type !== 'central') return -1;
            if (a.scheme_type !== 'central' && b.scheme_type === 'central') return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    },
    async findById(id) {
        return schemeData.find(s => s._id === id) || null;
    },
    async count() {
        return schemeData.length;
    }
};

// ---- Notification operations ----
const NotificationStore = {
    async create(data) {
        const notif = { _id: genId(), ...data, read: false, createdAt: new Date() };
        store.notifications.push(notif);
        syncToDisk();
        return notif;
    },
    async find(query) {
        let results = store.notifications;
        if (query.userId) results = results.filter(n => n.userId === query.userId);
        return results.sort((a, b) => b.createdAt - a.createdAt);
    },
    async findById(id) {
        return store.notifications.find(n => n._id === id) || null;
    },
    async save(notif) {
        const idx = store.notifications.findIndex(n => n._id === notif._id);
        if (idx !== -1) {
            store.notifications[idx] = notif;
            syncToDisk();
        }
        return notif;
    }
};

module.exports = { UserStore, FarmStore, ImageStore, AdvisoryStore, SchemeStore, NotificationStore, store };
