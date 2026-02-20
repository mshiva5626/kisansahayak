// Simple in-memory storage for hackathon demo mode when MongoDB is unavailable
const users = [];
const farms = [];

const mockStore = {
    users: {
        findOne: async (query) => {
            return users.find(u => {
                for (let key in query) {
                    if (u[key] !== query[key]) return false;
                }
                return true;
            });
        },
        findById: async (id) => {
            if (!id) return null;
            const idStr = id.toString();
            return users.find(u => u._id === idStr);
        },
        create: async (data) => {
            const id = Date.now().toString();
            const newUser = {
                ...data,
                _id: id,
                id: id,
                save: async function () { return this; }
            };
            users.push(newUser);
            return newUser;
        }
    },
    farms: {
        find: async (query) => farms.filter(f => !query.user || f.user === query.user),
        findById: async (id) => farms.find(f => f._id === id.toString()),
        create: async (data) => {
            const newFarm = { ...data, _id: Date.now().toString(), save: async function () { return this; } };
            farms.push(newFarm);
            return newFarm;
        }
    }
};

module.exports = mockStore;
