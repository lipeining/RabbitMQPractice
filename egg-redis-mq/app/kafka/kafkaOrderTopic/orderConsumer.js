const Subscription = require('egg').Subscription;

class OrderSubscription extends Subscription {
    async subscribe(message) {
        const { value, topic, key } = message;
        // await asyncTask();
        const { ctx, app } = this;
        ctx.logger.info(`consume message ${value} by topic ${topic} key ${key} consumer`);
        // 不知道为什么有时会在agent上运行这段代码 app指向agent,agent上并没有redis,fakeToken
        // const obj = JSON.parse(value);
        // const resource = obj.resource || 'kafka:item:80';
        // const uid = obj.uid;
        // const counter = obj.counter;
        // const redisRes = obj.redisRes;
        // const resourceCounter = `${resource}:cnt`;
        // const redis = ctx.app.redis;
        // const shouldPay = obj.shouldPay;
        // const fakeToken = await ctx.app.fakeToken.find({ uid, resource });
        // ctx.logger.info(`kafka order topic order consumer get token of ${uid} shouldPay:${shouldPay}`, fakeToken);
        // if (shouldPay) {
        //     // do nothing
        // } else {
        //     await redis.incr(resourceCounter);
        // }
    }
}
module.exports = OrderSubscription;