const Service = require('egg').Service;
const CACHE = Symbol.for("FakeOrder#Cache");
class FakeOrderService extends Service {
    // 默认不需要提供构造函数。
    constructor(ctx) {
        super(ctx);
        // 如果需要在构造函数做一些处理，一定要有这句话，才能保证后面`this.ctx`的使用。
        // 就可以直接通过 this.ctx 获取 ctx 了
        // 还可以直接通过 this.app 获取 app 了
        this[CACHE] = [];
    }
    /**
     * 
     * @param {Object} options 传入的筛选对象，转为Array的回调函数，将键值对解析为=== !== 
     * @param {Boolean} equal 对比比较符号 === !==
     */
    parseOptions(options, equal = true) {
        return function(item, index) {
            return Object.keys(options).every(key => {
                return equal ? item[key] === options[key] : item[key] !== options[key];
            });
        }
    }
    async findAll(options) {
        const orders = this[CACHE].filter(this.parseOptions(options));
        return orders;
    }
    async find(options) {
        const order = this[CACHE].find(this.parseOptions(options));
        return order;
    }
    async insert(values) {
        this[CACHE].push(values);
        return true;
    }
    async update(values, options) {
        const orders = this.findAll(options);
        orders.map(order => {
            Object.keys(values).map(key => {
                order[key] = values[key];
            });
        });
        return orders.length;
    }
    async remove(options) {
        const orders = this[CACHE].filter(this.parseOptions(options, false));
        const result = this[CACHE].length - orders.length;
        this[CACHE] = orders;
        return result;
    }
}

module.exports = FakeOrderService;