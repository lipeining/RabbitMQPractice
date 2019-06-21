'use strict';

const Controller = require('egg').Controller;

class KafkaController extends Controller {
    async init() {
        const { app, ctx } = this;
        // 根据传入的resource,初始化对应的队列，并且处理绑定
        const query = ctx.request.query;
        const resource = query.resource || 'kafka:item:80';
        const resourceCounter = `${resource}:cnt`;
        const cnt = query.number || 20;
        await app.redis.set(resourceCounter, cnt);
        await app.redis.del(app.fakeToken.parseOptions({ resource }));
        ctx.body = {};
    }
    async monitor() {
        const { app, ctx } = this;
        // 返回内存里面的内容
        const query = ctx.request.query;
        // const uid = query.uid;
        const resource = query.resource || 'kafka:item:80';
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
        const resource = query.resource || 'kafka:item:80';
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
        const resource = query.resource || 'kafka:item:80';
        const resourceCounter = `${resource}:cnt`;
        const redis = app.redis;
        const counter = await redis.get(resourceCounter);
        const body = {};
        if (Number(counter) > 0) {
            const uid = app.uuid();
            const kafka = ctx.kafka;
            await this.ctx.kafka.sendMessage({
                topic: 'kafkaResourceTopic', // Specify topics in the Kafka directory
                key: 'resource', // Specify consumer for the corresponding key under topic
                messages: JSON.stringify({
                    resource,
                    resourceCounter,
                    uid,
                    counter,
                }),
            });
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

module.exports = KafkaController;