const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'localDb.json');

// Helper to load/save JSON data
function readData() {
    if (!fs.existsSync(DB_FILE)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify({
            users: [],
            farms: [],
            images: [],
            advisories: [],
            notifications: [],
            _nextId: 100
        }, null, 2), 'utf8');
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading localDb.json:', err.message);
        return {
            users: [],
            farms: [],
            images: [],
            advisories: [],
            notifications: [],
            _nextId: 100
        };
    }
}

function writeData(data) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing localDb.json:', err.message);
    }
}

// Convert from JSON storage format (camelCase, _id) to Supabase representation (snake_case, id)
function toSupabase(table, record) {
    if (!record) return null;
    const mapped = { ...record };
    
    // Map _id -> id
    if ('_id' in mapped) {
        mapped.id = mapped._id;
    }
    
    // Map userId -> user_id
    if ('userId' in mapped) {
        mapped.user_id = mapped.userId;
    }
    
    // Map createdAt -> created_at
    if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt;
    }
    
    // Map updatedAt -> updated_at
    if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt;
    }
    
    return mapped;
}

// Convert from Supabase representation to JSON storage format
function fromSupabase(table, record) {
    if (!record) return null;
    const mapped = { ...record };
    
    // Map id -> _id
    if ('id' in mapped) {
        mapped._id = mapped.id;
        delete mapped.id;
    }
    
    // Map user_id -> userId
    if ('user_id' in mapped) {
        mapped.userId = mapped.user_id;
        delete mapped.user_id;
    }
    
    // Map created_at -> createdAt
    if ('created_at' in mapped) {
        mapped.createdAt = mapped.created_at;
        delete mapped.created_at;
    }
    
    // Map updated_at -> updatedAt
    if ('updated_at' in mapped) {
        mapped.updatedAt = mapped.updated_at;
        delete mapped.updated_at;
    }
    
    return mapped;
}

class MockSupabaseQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.op = 'select';
        this.filters = [];
        this.orderField = null;
        this.orderAscending = true;
        this.limitCount = null;
        this.insertData = null;
        this.updateData = null;
        this.isSingle = false;
        this.isMaybeSingle = false;
        this.selectFields = '*';
    }

    select(fields = '*') {
        this.selectFields = fields;
        return this;
    }

    insert(data) {
        this.op = 'insert';
        this.insertData = Array.isArray(data) ? data : [data];
        return this;
    }

    update(data) {
        this.op = 'update';
        this.updateData = data;
        return this;
    }

    delete(options) {
        this.op = 'delete';
        return this;
    }

    eq(column, value) {
        this.filters.push((record) => {
            // Compare both possibilities (e.g. user_id vs userId, id vs _id)
            if (column === 'id' || column === '_id') {
                return record.id === value || record._id === value;
            }
            if (column === 'user_id' || column === 'userId') {
                return record.user_id === value || record.userId === value;
            }
            return record[column] === value;
        });
        return this;
    }

    neq(column, value) {
        this.filters.push((record) => {
            if (column === 'id' || column === '_id') {
                return record.id !== value && record._id !== value;
            }
            if (column === 'user_id' || column === 'userId') {
                return record.user_id !== value && record.userId !== value;
            }
            return record[column] !== value;
        });
        return this;
    }

    or(filterString) {
        this.filters.push((record) => {
            const parts = filterString.split(',');
            return parts.some(part => {
                const [col, op, val] = part.split('.');
                if (op === 'eq') {
                    if (col === 'id' || col === '_id') {
                        return record.id === val || record._id === val;
                    }
                    if (col === 'user_id' || col === 'userId') {
                        return record.user_id === val || record.userId === val;
                    }
                    return record[col] === val;
                }
                return false;
            });
        });
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.orderField = column;
        this.orderAscending = ascending;
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }

    // A thenable object so 'await' works naturally on the chain
    async then(resolve, reject) {
        try {
            const result = await this.execute();
            resolve(result);
        } catch (err) {
            resolve({ data: null, error: err });
        }
    }

    async execute() {
        const dbData = readData();
        const jsonTable = this.tableName;
        
        if (!dbData[jsonTable]) {
            dbData[jsonTable] = [];
        }

        let records = dbData[jsonTable].map(r => toSupabase(jsonTable, r));
        let data = null;
        let error = null;

        if (this.op === 'select') {
            for (const filterFn of this.filters) {
                records = records.filter(filterFn);
            }

            if (this.orderField) {
                const mappedOrderField = this.orderField === 'created_at' ? 'createdAt' : this.orderField;
                records.sort((a, b) => {
                    const valA = a[this.orderField] || a[mappedOrderField];
                    const valB = b[this.orderField] || b[mappedOrderField];
                    if (valA === valB) return 0;
                    if (valA === undefined || valA === null) return 1;
                    if (valB === undefined || valB === null) return -1;
                    
                    const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
                    return this.orderAscending ? comparison : -comparison;
                });
            }

            if (this.limitCount !== null) {
                records = records.slice(0, this.limitCount);
            }

            data = records;

        } else if (this.op === 'insert') {
            const insertedRecords = [];
            for (const item of this.insertData) {
                const nextId = 'mem_' + dbData._nextId++ + '_' + Date.now().toString(36);
                const newRecord = {
                    id: nextId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ...item
                };
                
                insertedRecords.push(newRecord);
                
                const jsonRecord = fromSupabase(jsonTable, newRecord);
                dbData[jsonTable].push(jsonRecord);
            }
            writeData(dbData);
            data = insertedRecords;

        } else if (this.op === 'update') {
            let matchedIndices = [];
            for (let i = 0; i < records.length; i++) {
                let matches = true;
                for (const filterFn of this.filters) {
                    if (!filterFn(records[i])) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    matchedIndices.push(i);
                }
            }

            const updatedRecords = [];
            const timestamp = new Date().toISOString();
            
            for (const idx of matchedIndices) {
                const record = records[idx];
                const updated = {
                    ...record,
                    ...this.updateData,
                    updated_at: timestamp
                };
                records[idx] = updated;
                updatedRecords.push(updated);
                
                dbData[jsonTable][idx] = fromSupabase(jsonTable, updated);
            }

            writeData(dbData);
            data = updatedRecords;

        } else if (this.op === 'delete') {
            let matchedIndices = [];
            for (let i = 0; i < records.length; i++) {
                let matches = true;
                for (const filterFn of this.filters) {
                    if (!filterFn(records[i])) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    matchedIndices.push(i);
                }
            }

            matchedIndices.sort((a, b) => b - a);
            for (const idx of matchedIndices) {
                dbData[jsonTable].splice(idx, 1);
            }

            writeData(dbData);
            data = [];
        }

        if (this.isSingle) {
            if (!data || data.length === 0) {
                error = { message: 'No records found' };
                data = null;
            } else {
                data = data[0];
            }
        } else if (this.isMaybeSingle) {
            if (!data || data.length === 0) {
                data = null;
            } else {
                data = data[0];
            }
        }

        return { data, error };
    }
}

class MockSupabaseStorageBucket {
    constructor(bucketName) {
        this.bucketName = bucketName;
    }

    async upload(fileName, fileBuffer, options = {}) {
        return {
            data: { path: fileName },
            error: null
        };
    }

    getPublicUrl(filePath) {
        return {
            data: { publicUrl: `/uploads/${filePath}` }
        };
    }
}

class MockSupabaseStorage {
    from(bucketName) {
        return new MockSupabaseStorageBucket(bucketName);
    }
}

class MockSupabaseClient {
    constructor() {
        this.storage = new MockSupabaseStorage();
    }

    from(tableName) {
        return new MockSupabaseQueryBuilder(tableName);
    }
}

module.exports = MockSupabaseClient;
