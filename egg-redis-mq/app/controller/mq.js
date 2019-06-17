'use strict';

const Controller = require('egg').Controller;

class MQController extends Controller {
    async init() {
        const { app, ctx } = this;
        // 根据传入的resource,初始化对应的队列，并且处理绑定
        const query = ctx.request.query;
        const resource = query.resource || 'mq:item:80';
        const resourceCounter = `${resource}:cnt`;
        const cnt = query.number || 20;
        await app.redis.set(resourceCounter, cnt);
        const rabbot = app.rabbot;
        const redis = app.redis;
        const resourceQueue = `${resource}Queue`;
        const orderQueue = `${resource}OrderQueue`;
        const resourceOptions = {
            autoDelete: false,
            subscribe: true,
        };
        const orderOptions = {
            name: orderQueue,
            autoDelete: false,
            deadLetter: 'mqDeadOrderEx',
            subscribe: true
        };
        await rabbot.addQueue(resourceQueue, resourceOptions);
        await rabbot.addQueue(orderQueue, orderOptions);
        await rabbot.bindQueue('mqResourceEx', resourceQueue, [resource]);
        await rabbot.bindQueue('mqOrderEx', orderQueue, [resource]);
        // 而对应orderQueue，是不需要处理的，等待超时之后，进入死信队列。
        // 处理事件
        rabbot.handle({
                queue: resourceQueue, // only handle messages from the queue with this name
                type: resource, // handle messages with this type name or pattern
                autoNack: true, // automatically handle exceptions thrown in this handler
                // context: this,
                // context: null, // control what `this` is when invoking the handler
                // handler: null // allows you to just pass the handle function as an option property ... because why not?
            },
            async msg => {
                // 假定只有一个消费者，那么，可以直接读取redis的counter数据，同时设置
                // lock入口的流量。
                // 接着，将对应的内容再次转发到mqOrderQueue

                // 疑问：虽然只有一个消费者，但是，get之后再decr，也会出现负数。所以，
                // 是否直接decr就好了呢？
                const body = msg.body;
                const { uid, resource } = body;
                const counter = await redis.get(resourceCounter);
                if (Number(counter) > 0) {
                    const redisRes = await redis.decr(resourceCounter);
                    ctx.logger.info(`redis:decr:${redisRes}`);
                    if (redisRes >= 0) {
                        // 减一之后成功了
                        const shouldPay = Math.random() > 0.5;
                        if (shouldPay) {
                            await app.fakeOrder.insert({ uid, resource, number: 1, counter, redisRes });
                        } else {
                            await app.fakeToken.insert({ uid, resource, number: 1, counter, redisRes });
                        }
                        const rabbotRes = await rabbot.publish('mqOrderEx', {
                            type: 'order', // 这里的type其实不重要，因为使用了死信队列
                            routingKey: resource, // 需要使用上面绑定的routingKey
                            expiresAfter: 3000,
                            body: { uid, shouldPay, counter, redisRes, resource }
                        });
                        // ctx.logger.info(`mOrderEx rabbotRes: ${JSON.stringify(rabbotRes)}`);
                    } else {
                        await redis.del(resourceCounter);
                    }
                } else {
                    // 并没有排到队列
                }
                msg.ack();
            });
        ctx.body = {
            resourceQueue,
            orderQueue,
        };
    }
    async monitor() {
        const { app, ctx } = this;
        // 返回内存里面的内容
        const query = ctx.request.query;
        // const uid = query.uid;
        const resource = query.resource || 'mq:item:80';
        const fakeOrderList = await app.fakeOrder.monitor({ resource });
        const fakeTokenList = await app.fakeToken.monitor({ resource });
        ctx.body = {
            code: 0,
            data: {
                fakeOrderLength: fakeOrderList.length,
                fakeOrderList,
                fakeTokenList,
            }
        };
    }
    async order() {
        const { app, ctx } = this;
        // 这里是 用户手动http请求，支付或者取消 的逻辑。可以在这里判断是否需要解锁订单的物品
        const query = ctx.request.query;
        const uid = query.uid;
        const resource = query.resource || 'mq:item:80';
        const resourceCounter = `${resource}:cnt`;
        const data = { code: 0 };
        const fakeToken = await app.fakeToken.find({ uid, resource });
        // 判断token是否对应的上。
        if (query.pay) {
            data.order = await app.fakeOrder.insert({ uid, resource, number: 1 });
        } else {
            data.curCounter = await app.redis.incr(resourceCounter);
        }
        // 不过是否支付，都删除掉token
        // await app.fakeToken.remove({ uid, resource }, { fake: false });
        ctx.body = data;
    }
    async lock() {
        const { ctx, app } = this;
        const query = ctx.request.query;
        const resource = query.resource || 'mq:item:80';
        const resourceCounter = `${resource}:cnt`;
        const rabbot = app.rabbot;
        const redis = app.redis;
        const counter = await redis.get(resourceCounter);
        const body = {};
        if (Number(counter) > 0) {
            const uid = app.uuid();
            const rabbotRes = await rabbot.publish('mqResourceEx', {
                type: resource,
                routingKey: resource, // 需要使用上面绑定的routingKey
                expiresAfter: 3000,
                body: { uid, resource }
            });
            // ctx.logger.info(`mqResourceEx rabbotRes: ${JSON.stringify(rabbotRes)}`);
            body.code = 0;
            body.msg = 'try for it';
        } else {
            body.msg = 'late for it';
            body.code = 4;
        }
        body.counter = counter;
        ctx.logger.info(`lock result body: ${JSON.stringify(body)}`);
        ctx.body = body;
    }
}

module.exports = MQController;