/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1560130743766_9347';

    // add your middleware config here
    config.middleware = [];

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
    };
    config.cluster = {
        listen: {
            port: 7001,
        },
    };
    config.rabbot = {
        client: {
            connection: {
                name: 'default',
                user: 'guest',
                pass: 'guest',
                host: 'localhost',
                port: 5672,
                vhost: '%2f',
                // replyQueue: 'customReplyQueue',
            },
            exchanges: [
                { name: 'orderEx', type: 'fanout', autoDelete: false, durable: true },
                { name: 'orderDead', type: 'fanout', autoDelete: false, durable: true },
                // 使用rabbitmq来排队的交换器
                { name: 'mqResourceEx', type: 'topic', autoDelete: false, durable: true },
                { name: 'mqOrderEx', type: 'topic', autoDelete: false, durable: true },
                { name: 'mqDeadOrderEx', type: 'fanout', autoDelete: false, durable: true },
            ],
            queues: [
                { name: 'orderQueue', autoDelete: false, deadLetter: 'orderDead', durable: true, subscribe: true },
                { name: 'deadQueue', autoDelete: false, durable: true, subscribe: true },
                // rabbitmq
                { name: 'mqDeadQueue', autoDelete: false, subscribe: true },
            ],
            bindings: [
                { exchange: 'orderEx', target: 'orderQueue', keys: [] },
                { exchange: 'orderDead', target: 'deadQueue', keys: [] },
                // rabbitmq
                { exchange: 'mqDeadOrderEx', target: 'mqDeadQueue', keys: [] },
            ],
        },
    };
    config.redis = {
        client: {
            host: 'localhost',
            port: 6379,
            password: 'admin',
            db: 10,
        }
    };
    return {
        ...config,
        ...userConfig,
    };
};