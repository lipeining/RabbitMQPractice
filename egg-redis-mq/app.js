'use strict';
const Redlock = require('redlock');
const uuid = require('uuid/v4');
const FakeOrder = require('./utils/fake_order');
const FakeToken = require('./utils/fake_token');

module.exports = async app => {
    app.on('error', async (err, ctx) => {
        console.log('in app.js');
        console.log(err);
    });
    app.ready(async () => {
        // {
        //     queue: "orderQueue", // only handle messages from the queue with this name
        //     type: "order", // handle messages with this type name or pattern
        //     autoNack: true, // automatically handle exceptions thrown in this handler
        //     // context: this,
        //     // context: null, // control what `this` is when invoking the handler
        //     // handler: null // allows you to just pass the handle function as an option property ... because why not?
        // }
        // app.rabbot.handle('order', async (msg) => {
        //     app.logger.info('received msg', JSON.stringify(msg.body, null, 2));
        //     // 在正常情况下。controller中，会返回前端一个状态码表示，是否成功，同时，会保存一份
        //     // 对应的用户与订单的信息或者token，表示锁定了物品，然后，通过死信队列，实现订单超时未支付的功能。
        //     // 然后通过死信队列上面的信息，查询数据库，是否已经支付了，如果支付了，那么忽视，
        //     // 否则，对counter进行加一。
        //     // 如果中途，用户取消了操作，需要另外操作一个counter+1.

        //     // 现在将controller的功能全部移到此处进行处理。
        //     // 此时，如果成功了，那么说明，需要保存一份用户信息，同时，再次投递到
        //     msg.ack();
        // });
        app.rabbot.handle({
                queue: "deadQueue", // only handle messages from the queue with this name
                type: "*", // handle messages with this type name or pattern
                autoNack: true, // automatically handle exceptions thrown in this handler
                // context: this,
                // context: null, // control what `this` is when invoking the handler
                // handler: null // allows you to just pass the handle function as an option property ... because why not?
            },
            async msg => {
                // 这里处理的是死信队列的消息。一般是超时之后的订单，直接与数据库中的数据对比。
                // 然后处理counter是否需要+1
                // app.logger.info('received msg', JSON.stringify(msg.properties.headers, null, 2));
                // app.logger.info(JSON.stringify(msg.body, null, 2));
                const body = msg.body;
                const { uid, shouldPay, counter, redisRes, resource } = body;
                const resourceCounter = `${resource}:cnt`;
                const fakeOrder = await app.fakeOrder.find({ uid });
                app.logger.info(`dead queue get order of ${uid} shouldPay:${shouldPay}`, fakeOrder);
                // if (!fakeOrder) {
                //     // 并没有记录
                //     await app.redis.incr(resourceCounter);
                // }
                const fakeToken = await app.fakeToken.find({ uid, resource });
                app.logger.info(`dead queue get token of ${uid} shouldPay:${shouldPay}`, fakeToken);
                if (!fakeToken) {
                    // 并没有记录,说明已经支付了吧
                } else {
                    // 有记录。说明，还没支付。可以加一
                    await app.redis.incr(resourceCounter);
                }
                await app.fakeToken.remove({ uid, resource }, { fake: false });
                msg.ack();
            }
        );
        app.redlock = new Redlock(
            // you should have one client for each independent redis node
            // or cluster
            [app.redis], {
                // the expected clock drift; for more details
                // see http://redis.io/topics/distlock
                driftFactor: 0.01, // time in ms

                // the max number of times Redlock will attempt
                // to lock a resource before erroring
                retryCount: 10,

                // the time in ms between attempts
                retryDelay: 200, // time in ms

                // the max time in ms randomly added to retries
                // to improve performance under high contention
                // see https://www.awsarchitectureblog.com/2015/03/backoff.html
                retryJitter: 200 // time in ms
            }
        );
        app.redlock.on('clientError', (err) => {
            app.logger.error('redlock:A redis error has occurred:', err);
        });
        app.uuid = uuid;
        app.fakeOrder = new FakeOrder();
        app.fakeToken = new FakeToken({ app });
    });
};

// app.js
// class AppBootHook {
//     constructor(app) {
//         this.app = app;
//     }

//     configWillLoad() {
//         // 此时 config 文件已经被读取并合并，但是还并未生效
//         // 这是应用层修改配置的最后时机
//         // 注意：此函数只支持同步调用
//         // 例如：参数中的密码是加密的，在此处进行解密
//         // this.app.config.mysql.password = decrypt(this.app.config.mysql.password);
//         // 例如：插入一个中间件到框架的 coreMiddleware 之间
//         // const statusIdx = this.app.config.coreMiddleware.indexOf('status');
//         // this.app.config.coreMiddleware.splice(statusIdx + 1, 0, 'limit');
//     }

//     async didLoad() {
//         // 所有的配置已经加载完毕
//         // 可以用来加载应用自定义的文件，启动自定义的服务
//         // 例如：创建自定义应用的示例
//         // this.app.queue = new Queue(this.app.config.queue);
//         // await this.app.queue.init();
//         // // 例如：加载自定义的目录
//         // this.app.loader.loadToContext(path.join(__dirname, 'app/tasks'), 'tasks', {
//         //     fieldClass: 'tasksClasses',
//         // });
//     }

//     async willReady() {
//         // 所有的插件都已启动完毕，但是应用整体还未 ready
//         // 可以做一些数据初始化等操作，这些操作成功才会启动应用
//         // type order 
//         // await rabbot.publish('orderEx', { type: 'order', body: 'hello!' });
//         const app = this.app;
//         this.app.rabbot.handle({
//             queue: "orderQueue", // only handle messages from the queue with this name
//             type: "order", // handle messages with this type name or pattern
//             autoNack: true, // automatically handle exceptions thrown in this handler
//             context: this,
//             // context: null, // control what `this` is when invoking the handler
//             // handler: null // allows you to just pass the handle function as an option property ... because why not?
//         }, (msg) => {
//             this.app.logger.error('received msg', JSON.stringify(msg, null, 2));
//             app.logger.info('received msg', JSON.stringify(msg, null, 2));
//             app.logger.error('received msg', JSON.stringify(msg, null, 2));
//             console.error('received msg', JSON.stringify(msg, null, 2));
//             msg.ack();
//         });
//         this.app.redlock = new Redlock(
//             // you should have one client for each independent redis node
//             // or cluster
//             [this.app.redis], {
//                 // the expected clock drift; for more details
//                 // see http://redis.io/topics/distlock
//                 driftFactor: 0.01, // time in ms

//                 // the max number of times Redlock will attempt
//                 // to lock a resource before erroring
//                 retryCount: 10,

//                 // the time in ms between attempts
//                 retryDelay: 200, // time in ms

//                 // the max time in ms randomly added to retries
//                 // to improve performance under high contention
//                 // see https://www.awsarchitectureblog.com/2015/03/backoff.html
//                 retryJitter: 200 // time in ms
//             }
//         );
//         this.app.redlock.on('clientError', (err) => {
//             this.app.logger.error('redlock:A redis error has occurred:', err);
//         });
//     }

//     async didReady() {
//         // 应用已经启动完毕
//     }

//     async serverDidReady() {
//         // http / https server 已启动，开始接受外部请求
//         // 此时可以从 app.server 拿到 server 的实例
//         // this.app.server.on('timeout', socket => {
//         //     // handle socket timeout
//         // });
//     }
// }
// module.exports = AppBootHook;