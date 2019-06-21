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
    config.kafkaNode = {
        kafkaHost: 'localhost:9092', // kafka 连接的地址
        // kafkaHost: 'localhost:9094', // kafka 连接的地址
        clientOption: {

        }, // KafkaClient 相关配置, 更多配置可以查看kafka-node
        consumerOption: [{
            groupId: 'kafkaResource', // consumerGroup 消费组id
            topics: ['kafkaResourceTopic'], // 同一消费组 consumerGroup 下的所有 topic
            options: {
                // fetchMaxWaitMs: 100,
                // fetchMinBytes: 1,
                // fetchMaxBytes: 1024 * 1024,
            }, // 每个消费组对应的相关 consumerGroup 配置
        }, {
            groupId: 'kafkaOrder',
            topics: ['kafkaOrderTopic'],
            options: {},
        }],
        // HighLevelProducer 生产者配置, 更多配置可以查看kafka-node
        producerOption: {
            requireAcks: 1,
            ackTimeoutMs: 100,
            partitionerType: 2,
            autoCreateTopic: true, // 是否开启自动创建 topic功能
            topics: ['kafkaResourceTopic', 'kafkaOrderTopic'], // 所有消费组需要包含的topics 集合
        },
        messageOption: {
            partition: 0,
            attributes: 0, // 发送消息的相关配置
        },
    };
    config.baseDir = appInfo.baseDir;
    return {
        ...config,
        ...userConfig,
    };
};