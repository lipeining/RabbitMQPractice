global._ = require('lodash');
const redis = require('./ioredisclient');
const RedisLock = require('ioredis-lock');
// const LockAcquisitionError = redislock.LockAcquisitionError;
// const LockReleaseError = redislock.LockReleaseError;
const amqp = require('amqp');
const config = require('./config');
const { exec, fork, execFile, spawn } = require('child_process');
const redisClient = require('./redisclient');
const EventEmitter = require('events');

const fun = () => {}
/**
 * 
 * @param {function} next 
 */
const onStartTemplete = (next) => {

}
/**
 * 
 * @param {*}   item
 */
const onProcessTemplete = (item) => {

}
/**
 * 
 * @param {error} error
 */
const onErrorTemplete = (error) => {

}
/**
 * 
 * @param {function} next 
 */
const onDoneTemplete = (next) => {
    console.log('done');
}
/**
 * 
 * @param {function} next 
 */
const callbackTemplete = (next) => {

}
class RedisQueue extends EventEmitter {
    constructor({
        obj = {},
        name = '',
        total = 100,
        onStart = onStartTemplete,
        onProcess = onProcessTemplete,
        onError = onErrorTemplete,
        onDone = onDoneTemplete,
        callback = callbackTemplete
    } = {}) {
        super();
        this.obj = obj;
        this.name = name || `item-${Math.random()}`;
        this.total = total;
        this.onStart = onStart;
        this.onProcess = onProcess;
        this.onError = onError;
        this.onDone = onDone;
        this.callback = callback;
        this.redis = undefined;
        this.client = undefined;
        this.lock = undefined;
        this.rabbitmq = undefined;
        this.exchange = undefined;
        this.replyQueue = undefined;
        this.consumers = [];
        this.replySuccess = [];
        this.sendErr = [];
        this.sendCounter = 0;
        this.numOfConsumer = 3;
        this.ready = false; // 交换器是主要的问题
        this.done = false; // 交换器是主要的问题
        this.noItem = false;
        this.initRedisConnection();
        this.initRabbitMQConnection();
    }
    initRedisConnection() {
        this.redis = redis;
        this.client = redisClient;
        this.lock = RedisLock.createLock(this.redis);
    }
    initRabbitMQConnection() {
        this.rabbitmq = amqp.createConnection(config.rabbitmq);
        this.rabbitmq.on('ready', () => {
            this.emit('rabbitmq-ready', this.rabbitmq);
            this.initExchange();
        })
    }
    async initExchange() {
        // 如果设置 exchange为confirm的话，需要声明时指定confirm:true
        // 同时在publish的最后的回调函数中判断返回值，得知是否成功投递
        // 然后可以将错误的信息保存下来，再次publish
        this.exchange = this.rabbitmq.exchange(this.name, { autoDelete: false, confirm: true });
        this.emit('exchange-ready', this.exchange);
        this.initReplyQueue();
        await this.initRedisList();
        await this.initRedisCounter();
        this.initConsumer();
    }
    async initReplyQueue() {
        this.replyQueue = this.rabbitmq.queue('');
        this.replyQueue.subscribe((message, headers, deliveryInfo, messageObject) => {
            // console.log(headers);
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            // console.log(`receive consumer reply :`);
            // console.log(result);
            this.replySuccess.push(result);
            if (this.replySuccess.length >= this.total) {
                this.done = true;
                this.emit('done');
            }
        });
    }
    async initRedisList() {
        for (let i = 0; i < this.total; i++) {
            await this.redis.rpush(this.itemRedisItemListKey, JSON.stringify(this.obj));
        }
        this.emit('item-list-ready');
    }
    async initRedisCounter() {
        await this.redis.set(this.itemRedisItemCounter, this.total);
        this.emit('item-counter-ready');
    }
    initConsumer() {
        // const child = exec(`/usr/local/bin/node ./consumer.js ${this.name} `, {cwd: __dirname}, (error, stdout, stderr) => {
        //     if (error) {
        //         throw error;
        //     }
        //     console.log(stdout);
        // });
        if (this.consumers.length) {
            return;
        }
        let cnt = 0;
        for (let i = 1; i < (this.numOfConsumer + 1); i++) {
            const child = fork(`./consumer.js`, [`${this.name}`, `${i}`], { cwd: __dirname });
            child.on('message', (m) => {
                console.log(m);
                cnt++;
                if (cnt === this.numOfConsumer) {
                    this.ready = true;
                    console.log('main  ready');
                    this.emit('item-consumers-ready', this.consumers);
                }
            });
            this.consumers.push(child);
        }
        // throw new Error('ddododnonon');
        // this.emit('error', new Error('ddododnonon'));
        // console.log(child);
    }
    // set total(val) {
    //     console.log(`class set total: ${val}`);
    //     // await this.initRedisCounter();
    // }
    async setOptions(opts) {
        this.total = opts.total;
        await this.initRedisCounter();
    }
    get itemRedisItemConsumersKey() {
        // 抢到的用户列表
        return `${this.name}-item-consumers-list`;
    }
    get itemRedisItemListKey() {
        return `${this.name}-item-list`;
    }
    get itemRedisItemCounter() {
        // 商品剩余数量的counter
        return `${this.name}-item-counter`;
    }
    async getItemRedisConsumersLen() {
        return await this.redis.llen(this.itemRedisItemConsumersKey);
    }
    async republish() {
        // 将err中的publish对象再次发送出去
        let tmpArr = [];
        for (let input of this.sendErr) {
            let options = { replyTo: this.replyQueue.name, headers: {} };
            this.exchange.publish(`${this.name}.*`, JSON.stringify(input), options, (v) => {
                if (v) {
                    tmpErr.push(input);
                    setTimeout(this.republish, 100);
                }
            });
        }
        // 更新失败的列表
        this.sendErr = tmpArr;
    }
    async consumeOneItem(input) {
        if (!this.ready) {
            console.log('not ready');
            return;
        }
        if (this.done || this.noItem) {
            // console.log('you are late');
            // console.log(this.replySuccess);
            console.log(this.done);
            console.log(this.sendErr);
            console.log(this.sendCounter);
            console.log(this.replySuccess.length);
            console.log(this.replySuccess[0]);
            console.log(this.replySuccess.filter((v) => {
                return v.number === 1;
            }).length);
            console.log(this.replySuccess.filter((v) => {
                return v.number === 2;
            }).length);
            console.log(this.replySuccess.filter((v) => {
                return v.number === 3;
            }).length);
            return;
        }

        ////// 55555555555 悲观锁，通过redis-lock实现，将成功下单的用户入list
        /// use counter  并发一百个请求，只有一个成功了，并发10个请求，只有5个成功
        // try {
        //     await this.lock.acquire(`${this.name}:lock`);
        //     let counter = await this.redis.get(this.itemRedisItemCounter);
        //     // console.log(counter);
        //     if (Number(counter) > 0) {
        //         let multi = await this.redis.multi({ pipeline: true });
        //         await multi.rpush(this.itemRedisItemConsumersKey, JSON.stringify({ input }));
        //         await multi.decr(this.itemRedisItemCounter);
        //         let result = await multi.exec();
        //         console.log(result);
        //         if (result.length && result[0][1]) {
        //             this.exchange.publish(this.name, JSON.stringify({ input }));
        //             await this.lock.release();
        //             return true;
        //         } else {
        //             await this.lock.release();
        //             return Promise.reject('you failed');
        //         }
        //     } else {
        //         this.done = true;
        //         await this.lock.release();
        //         return Promise.reject('no item left');
        //     }
        // } catch (err) {
        //     // console.log(typeof err);
        //     // console.log(err instanceof LockAcquisitionError);
        //     // console.log(err instanceof LockReleaseError);
        //     // console.log(err);
        //     return Promise.reject('you failed');
        // }


        ////// 444444444 先将商品入队，通过lpop取出
        // let item = await this.redis.lpop(this.itemRedisItemListKey);
        // if (!item) {
        //     this.done = true;
        //     // this.onDone();
        //     return Promise.reject('no item left'); 
        // } else {
        //     this.exchange.publish(this.name, JSON.stringify({ input }));
        //     this.counter++;
        //     return;            
        // }


        ///// 乐观锁 当前并发数 concurrency：40, total:30, 
        //  那么，会产生40条记录， 
        // 只能处理  concurrency * n = total 的情况。


        /////// 333333333乐观锁，使用redis库
        // this.client.watch(this.itemRedisItemCounter);
        // this.client.watch(this.itemRedisItemCounter, (err) => {
        //     if (err) {
        //         console.log(err);
        //         return Promise.reject('you failed');
        //     }
        //     this.client.get(this.itemRedisItemCounter, (err, counter) => {
        //         if (err) {
        //             console.log(err);
        //             return Promise.reject('you failed');
        //         }

        //         // Process counter
        //         // Heavy and time consuming operation here
        //         console.log(counter);
        //         if (Number(counter) > 0) {
        //             this.client.multi()
        //                 .rpush(this.itemRedisItemConsumersKey, JSON.stringify({ input }))
        //                 .decr(this.itemRedisItemCounter)
        //                 .exec((err, results) => {

        //                     /**
        //                      * If err is null, it means Redis successfully attempted 
        //                      * the operation.
        //                      */
        //                     if (err) {
        //                         console.log(err);
        //                         return Promise.reject('you failed');
        //                     }

        //                     /**
        //                      * If results === null, it means that a concurrent client
        //                      * changed the key while we were processing it and thus 
        //                      * the execution of the MULTI command was not performed.
        //                      * 
        //                      * NOTICE: Failing an execution of MULTI is not considered
        //                      * an error. So you will have err === null and results === null
        //                      */
        //                     console.log(results);
        //                     if (!results) {
        //                         return Promise.reject('you failed ');
        //                     } else {
        //                         this.exchange.publish(this.name, JSON.stringify({ input }));
        //                         return true;
        //                     }
        //                 });
        //         } else {
        //             this.done = true;
        //             return Promise.reject('no item left');
        //         }
        //     });
        // });




        ///// 3333333333333333 乐观锁不成功

        await this.redis.watch(this.itemRedisItemCounter);
        let counter = await this.redis.get(this.itemRedisItemCounter);
        // console.log(counter);
        if (Number(counter) > 0) {
            // this.redis.multi({ pipeline: true })
            //     .rpush(this.itemRedisItemConsumersKey, JSON.stringify({ input }))
            //     .decr(this.itemRedisItemCounter)
            //     .exec((err, res) => {
            //         if (err) {
            //             console.log(err);
            //             return Promise.reject('you failed ');
            //         }
            //         this.redis.unwatch();
            //         console.log(res);
            //         if (res[0][1]) {
            //             this.exchange.publish(this.name, JSON.stringify({ input }));
            //             return true;
            //         } else {
            //             return Promise.reject('you failed ');
            //         }
            //     });
            let multi = await this.redis.multi({ pipeline: true });
            await multi.decr(this.itemRedisItemCounter);
            // await multi.rpush(this.itemRedisItemConsumersKey, JSON.stringify({ input }));
            let result = await multi.exec();
            console.log(result);
            if (result.length && result[0][1] >= 0) {
                let options = { replyTo: this.replyQueue.name, headers: {} };
                this.exchange.publish(`${this.name}.*`, JSON.stringify(input), options, (v) => {
                    if (v) {
                        this.sendErr.push(input);
                        setTimeout(this.republish, (this.total- this.sendCounter) * 100);
                    }
                    this.sendCounter++;
                    // 用于确认itemRedisItemConsumersKey中的第几个出错了。
                });
                return true;
            } else {
                return Promise.reject('you failed');
            }
        } else {
            this.noItem = true;
            return Promise.reject('no item left');
        }



        /// 11111111111111 error
        // let len = await this.redis.multi().llen(this.itemRedisItemConsumersKey).exec();
        // let len = await this.getItemRedisListLen();
        // console.log(len);
        // if (this.counter >= this.total) {
        //     return Promise.reject('no item left');
        // } else {
        //     let nowLen = await this.redis.rpush(this.itemRedisItemConsumersKey, JSON.stringify(input));
        //     this.exchange.publish(this.name, JSON.stringify({ input, nowLen }));
        //     this.counter++;
        //     return nowLen;
        // }


        ///// 22222222222 error 
        // let nowLen = await this.redis.rpush(this.itemRedisItemConsumersKey, JSON.stringify(input));
        // if(nowLen >= this.total) {
        //     this.done = true;
        //     this.onDone();
        //     return Promise.reject('no item left');
        // } else {
        //     this.exchange.publish(this.name, JSON.stringify({ input, nowLen }));
        //     this.counter++;
        //     return nowLen;
        // }
    }
}


module.exports = RedisQueue;