const Subscription = require('egg').Subscription;

class ResourceSubscription extends Subscription {
    async subscribe(message) {
        const { value, topic, key } = message;
        const {ctx, app} = this;
        ctx.logger.info(`consume message ${value} by topic ${topic} key ${key} consumer`);
        const obj = JSON.parse(value);
        const resource = obj.resource || 'kafka:item:80';
        const uid = obj.uid;
        const resourceCounter = `${resource}:cnt`;
        const redis = app.redis;
        const counter = await redis.get(resourceCounter);
        const body = {};
        if (Number(counter) > 0) {
            const redisRes = await redis.decr(resourceCounter);
            ctx.logger.info(`redis:decr:${redisRes}`);
            const shouldPay = Math.random() > 0.5;
            if (redisRes >= 0) {
                if (shouldPay) {
                    await app.fakeOrder.insert({ uid, resource, number: 1, counter, redisRes });
                } else {
                    await app.fakeToken.insert({ uid, resource, number: 1, counter, redisRes });
                }
                await this.ctx.kafka.sendMessage({
                    topic: 'kafkaOrderTopic', // Specify topics in the Kafka directory
                    key: 'order', // Specify consumer for the corresponding key under topic
                    messages: JSON.stringify({
                        resource,
                        resourceCounter,
                        uid,
                        shouldPay,
                        counter,
                        redisRes,
                    }),
                });
            } else {
                await redis.del(resourceCounter);
            }
            body.code = 0;
            body.redisRes = redisRes;
            body.msg = 'try for it';
        } else {
            body.msg = 'late for it';
            body.code = 4;
        }
        body.counter = counter;
        ctx.logger.info(`lock result body: ${JSON.stringify(body)}`);
    }
}
module.exports = ResourceSubscription;