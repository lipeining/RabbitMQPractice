'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
    async index() {
        const { ctx, app } = this;
        ctx.body = 'hi, egg';
    }
    async init() {
        const { app, ctx } = this;
        // 初始化counter
        const resource = 'locks:product:322456';
        const redlock = app.redlock;
        const rabbot = app.rabbot;
        const redis = app.redis;
        const resourceCounter = `${resource}:cnt`;
        const number = Number(ctx.request.query.number || 4);
        const redisRes = await redis.set(resourceCounter, number);
        await redis.del(app.fakeToken.parseOptions({ resource }));
        ctx.logger.info(`init: ${JSON.stringify(redisRes)}`);
        ctx.body = redisRes;
    }
    async monitor() {
        const { app, ctx } = this;
        // 返回内存里面的内容
        const query = ctx.request.query;
        // const uid = query.uid;
        const resource = query.resource || 'locks:product:322456';
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
        const resource = query.resource || 'locks:product:322456';
        const resourceCounter = `${resource}:cnt`;
        const data = { code: 0 };
        const fakeToken = await app.fakeToken.find({ uid, resource });
        // 判断token是否对应的上。
        if (query.pay) {
            data.order = await app.fakeOrder.insert({ uid, resource, number: 1 });
            // 删除掉token
            // await app.fakeToken.remove({ uid, resource }, { fake: true });
        } else {
            data.curCounter = await app.redis.incr(resourceCounter);
        }
        ctx.body = data;
    }
    getPublishBody(options) {
        return {
            type: 'order',
            routingKey: '',
            expiresAfter: 3000,
            body: options
        };
    }
    async optimisticLock() {
        const { app, ctx } = this;
        const resource = 'locks:product:322456';
        const rabbot = app.rabbot;
        const redis = app.redis;
        const resourceCounter = `${resource}:cnt`;
        await redis.watch(resourceCounter, async (err) => {
            if (err) {
                ctx.logger.error(err);
                ctx.body = { code: 5, err };
            } else {
                const counter = await redis.get(resourceCounter);
                const body = {};
                if (Number(counter) > 0) {
                    let multi = await redis.multi({ pipeline: true });
                    await multi.decr(resourceCounter);
                    let redisRes = await multi.exec();
                    ctx.logger.info(`redis:decr:${redisRes}`);
                    body.redisRes = redisRes;
                    if (Array.isArray(redisRes) && redisRes[0][1] >= 0) {
                        // 减一之后成功了  
                        body.code = 0;
                        const uid = app.uuid();
                        const shouldPay = Math.random() > 0.5;
                        if (shouldPay) {
                            await app.fakeOrder.insert({ uid, resource, number: 1, counter, redisRes });
                        } else {
                            await app.fakeToken.insert({ uid, resource, number: 1, counter, redisRes });
                        }
                        const rabbotRes = await rabbot.publish('orderEx', this.getPublishBody({ uid, shouldPay, counter, redisRes, resource }));
                        // ctx.logger.info(JSON.stringify(rabbotRes, null, 2));
                    } else {
                        // 有一些会失败了。
                        body.code = 3;
                        await redis.del(resourceCounter);
                    }

                    // const redisRes = await redis.decr(resourceCounter);
                    // ctx.logger.info(`redis:decr:${redisRes}`);
                    // if (redisRes >= 0) {
                    //     // 减一之后成功了  
                    //     body.code = 0;
                    //     const rabbotRes = await rabbot.publish('orderEx', { type: 'order', routingKey: '', expiresAfter: 3000, body: { counter, redisRes: redisRes } });
                    //     ctx.logger.info(JSON.stringify(rabbotRes, null, 2));
                    // } else {
                    //     // 有一些会失败了。
                    //     body.code = 3;
                    // }
                } else {
                    body.code = 4;
                }
                body.msg = `counter:${counter}`;
                ctx.logger.info(`res:${JSON.stringify(body)}`);
                ctx.body = body;
            }
        });
        // try {
        //     await redis.watch(resourceCounter);
        //     const counter = await redis.get(resourceCounter);
        //     const body = {};
        //     if (Number(counter) > 0) {
        //         let multi = await redis.multi({ pipeline: true });
        //         await multi.decr(resourceCounter);
        //         let redisRes = await multi.exec();
        //         ctx.logger.info(`redis:decr:${redisRes}`);
        //         if (redisRes[0][1] >= 0) {
        //             // 减一之后成功了  
        //             body.code = 0;
        //             const rabbotRes = await rabbot.publish('orderEx', { type: 'order', routingKey: '', expiresAfter: 3000, body: { counter, redisRes: redisRes } });
        //             ctx.logger.info(JSON.stringify(rabbotRes, null, 2));
        //         } else {
        //             // 有一些会失败了。
        //             body.code = 3;
        //         }
        //         // const redisRes = await redis.decr(resourceCounter);
        //         // ctx.logger.info(`redis:decr:${redisRes}`);
        //         // if (redisRes >= 0) {
        //         //     // 减一之后成功了  
        //         //     body.code = 0;
        //         //     await rabbot.publish('orderEx', { type: 'order', routingKey: '', expiresAfter: 3000, body: { counter, redisRes: redisRes } });
        //         // } else {
        //         //     body.code = 3;
        //         // }
        //     } else {
        //         body.code = 4;
        //     }
        //     body.msg = `counter:${counter}`;
        //     ctx.logger.info(`res:${JSON.stringify(body)}`);
        //     ctx.body = body;
        // } catch (err) {
        //     ctx.logger.error(err);
        //     ctx.body = { code: 5, err };
        // }
    }
    /**
     * @returns {*}
     * @returns {code} 0 正常，3：redis:decr,4:counter<=0,5:unexpected error
     */
    async exclusiveLock() {
        const { app, ctx } = this;
        // console.log(app.redis);
        // console.log(app.redlock);
        // console.log(app.rabbot);
        // the string identifier for the resource you want to lock
        const resource = 'locks:product:322456';
        // the maximum amount of time you want the resource locked,
        // keeping in mind that you can extend the lock up until
        // the point when it expires
        const ttl = 1000;
        const redlock = app.redlock;
        const redis = app.redis;
        const rabbot = app.rabbot;
        const resourceCounter = `${resource}:cnt`;
        try {
            const lock = await redlock.lock(resource, ttl);
            const counter = await redis.get(resourceCounter);
            const body = {};
            if (Number(counter) > 0) {
                // ...do something here...
                const redisRes = await redis.decr(resourceCounter);
                ctx.logger.info(`redis:decr:${redisRes}`);
                // unlock your resource when you are done
                body.redisRes = redisRes;
                if (redisRes >= 0) {
                    // 减一之后成功了  
                    body.code = 0;
                    const uid = app.uuid();
                    const shouldPay = Math.random() > 0.5;
                    if (shouldPay) {
                        await app.fakeOrder.insert({ uid, resource, number: 1, counter, redisRes });
                    } else {
                        await app.fakeToken.insert({ uid, resource, number: 1, counter, redisRes });
                    }
                    const rabbotRes = await rabbot.publish('orderEx', this.getPublishBody({ uid, shouldPay, counter, redisRes, resource }));
                    // ctx.logger.info(JSON.stringify(rabbotRes, null, 2));
                } else {
                    body.code = 3;
                    await redis.del(resourceCounter);
                }

            } else {
                body.code = 4;
            }
            await lock.unlock();
            body.msg = `counter:${counter}`;
            ctx.logger.info(`res:${JSON.stringify(body)}`);
            ctx.body = body;
        } catch (err) {
            // we weren't able to reach redis; your lock will eventually
            // expire, but you probably want to log this error
            ctx.logger.error(err);
            ctx.body = { code: 5, err };
        }
    }
    /**
     * @returns {*}
     * @returns {code} 0 正常，3：redis:decr,4:counter<=0,5:unexpected error
     */
    async exclusiveLockV2() {
        const { app, ctx } = this;
        // console.log(app.redis);
        // console.log(app.redlock);
        // console.log(app.rabbot);
        // the string identifier for the resource you want to lock
        const resource = 'locks:product:322456';
        // the maximum amount of time you want the resource locked,
        // keeping in mind that you can extend the lock up until
        // the point when it expires
        const ttl = 1000;
        const redlock = app.redlock;
        const redis = app.redis;
        const rabbot = app.rabbot;
        const resourceCounter = `${resource}:cnt`;
        try {
            const counter = await redis.get(resourceCounter);
            const body = {};
            if (Number(counter) > 0) {
                const lock = await redlock.lock(resource, ttl);
                // ...do something here...
                const redisRes = await redis.decr(resourceCounter);
                ctx.logger.info(`redis:decr:${redisRes}`);
                // unlock your resource when you are done
                await lock.unlock();
                body.redisRes = redisRes;
                if (redisRes >= 0) {
                    // 减一之后成功了  
                    body.code = 0;
                    const uid = app.uuid();
                    const shouldPay = Math.random() > 0.5;
                    if (shouldPay) {
                        await app.fakeOrder.insert({ uid, resource, number: 1, counter, redisRes });
                    } else {
                        await app.fakeToken.insert({ uid, resource, number: 1, counter, redisRes });
                    }
                    const rabbotRes = await rabbot.publish('orderEx', this.getPublishBody({ uid, shouldPay, counter, redisRes, resource }));
                    // ctx.logger.info(JSON.stringify(rabbotRes, null, 2));
                } else {
                    body.code = 3;
                    await redis.del(resourceCounter);
                }

            } else {
                body.code = 4;
            }
            body.msg = `counter:${counter}`;
            ctx.logger.info(`res:${JSON.stringify(body)}`);
            ctx.body = body;
        } catch (err) {
            // we weren't able to reach redis; your lock will eventually
            // expire, but you probably want to log this error
            ctx.logger.error(err);
            ctx.body = { code: 5, err };
        }
    }
}

module.exports = HomeController;