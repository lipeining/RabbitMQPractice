class FakeTokenService {
    // 默认不需要提供构造函数。
    // 利用 redis 存储token信息，用于证明
    constructor({ app }) {
        this.redis = app.redis;
    }
    /**
     * 
     * @param {Object} options
     */
    parseOptions(options) {
        const key = options.resource;
        if (!key) {
            throw new Error(`${JSON.stringify(options)} miss resource`);
        }
        return `${key}:tokens`;
    }
    async monitor(options) {
        const key = this.parseOptions(options);
        const list = await this.redis.hgetall(key);
        return list;
    }
    async find(options) {
        const key = this.parseOptions(options);
        const order = await this.redis.hget(key, options.uid);
        return JSON.parse(order) || null;
    }
    async insert(values) {
        const key = this.parseOptions(values);
        const exists = await this.redis.hexists(key, values.uid);
        if (exists) {
            return null;
        }
        const order = await this.redis.hset(key, values.uid, JSON.stringify(values));
        return order;
    }
    async update(values, options) {
        const key = this.parseOptions(options);
        const exists = await this.redis.hexists(key, options.uid);
        if (!exists) {
            return false;;
        }
        const order = await this.find(options);
        if (!order) {
            return false;
        }
        Object.keys(values).map(k => {
            order[k] = values[k];
        });
        await this.redis.hset(key, order.uid, JSON.stringify(order));
        return true;
    }
    async remove(values, options = { fake: false }) {
        if (options.fake) {
            return await this.update({ deleteTime: Date.now() }, values, options);
        } else {
            return await this.redis.hdel(this.parseOptions(values), [values.uid]);
        }

    }
}

module.exports = FakeTokenService;